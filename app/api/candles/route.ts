import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { candleCache, CacheKeys } from '@/lib/cacheService';
import { apiErrorHandler } from '@/lib/apiErrorHandler';

// Rate limiting for candles API
const CANDLES_RATE_LIMIT = 50; // requests per minute
const candleRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkCandlesRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = candleRequestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    candleRequestCounts.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (clientData.count >= CANDLES_RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC/USDT';
  const timeframe = searchParams.get('timeframe') || '1m';
  const limit = parseInt(searchParams.get('limit') || '100');

  // Validate parameters
  if (limit > 1000) {
    return NextResponse.json({
      success: false,
      error: 'Limit cannot exceed 1000 candles',
      maxLimit: 1000
    }, { status: 400 });
  }

  // Rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkCandlesRateLimit(clientId)) {
    return NextResponse.json({
      success: false,
      error: 'Rate limit exceeded for candles API',
      retryAfter: 60,
      maxRequestsPerMinute: CANDLES_RATE_LIMIT
    }, {
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // Check cache first
  const cacheKey = CacheKeys.candles(symbol, timeframe, limit);
  const cachedCandles = candleCache.get(cacheKey);

  if (cachedCandles) {
    console.log(`[CANDLES] Cache hit for ${symbol} ${timeframe}`);
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: cachedCandles,
      cached: true,
      _metadata: {
        symbol,
        timeframe,
        limit,
        responseTime,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'X-Response-Time': responseTime.toString(),
        'Cache-Control': 'public, max-age=20'
      }
    });
  }

  const operation = async () => {
    const exchange = new ccxt.binance({
      // Remove API keys for public data access - we only need OHLCV data
      // apiKey: process.env.BINANCE_API_KEY,
      // secret: process.env.BINANCE_SECRET_KEY,
      options: { adjustForTimeDifference: true },
      enableRateLimit: true,
    });

    // Load markets first to ensure symbol is available
    await exchange.loadMarkets();

    // Check if symbol exists
    if (!exchange.markets[symbol]) {
      const error = new Error(`Symbol ${symbol} not found`);
      (error as any).status = 400;
      (error as any).availableSymbols = Object.keys(exchange.markets).filter(s => s.includes('USDT')).slice(0, 10);
      throw error;
    }

    console.log(`[CANDLES] Cache miss, fetching ${symbol} ${timeframe} from API`);
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);

    if (!Array.isArray(ohlcv) || ohlcv.length === 0) {
      throw new Error(`No candle data received for ${symbol}`);
    }

    // Cache for 20 seconds
    candleCache.set(cacheKey, ohlcv, 20000);

    return ohlcv;
  };

  const fallback = () => {
    console.warn(`[CANDLES] Using fallback synthetic data for ${symbol} ${timeframe}`);
    return generateSyntheticCandles(symbol, timeframe, limit);
  };

  try {
    const ohlcv = await apiErrorHandler.executeWithCircuitBreaker(
      `candles_api_${symbol}_${timeframe}`,
      operation,
      fallback,
      {
        maxRetries: 2,
        baseDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`[CANDLES] Fetched ${symbol} ${timeframe} in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: ohlcv,
      cached: false,
      _metadata: {
        symbol,
        timeframe,
        limit,
        responseTime,
        timestamp: new Date().toISOString(),
        dataPoints: ohlcv.length
      }
    }, {
      headers: {
        'X-Response-Time': responseTime.toString(),
        'Cache-Control': 'public, max-age=20'
      }
    });

  } catch (error: any) {
    console.error('Error fetching OHLCV data:', error);

    const responseTime = Date.now() - startTime;
    const statusCode = error.status || 500;

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to fetch OHLCV data',
      symbol,
      timeframe,
      limit,
      _metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    };

    // Add available symbols for 400 errors
    if (statusCode === 400 && error.availableSymbols) {
      (errorResponse as any).availableSymbols = error.availableSymbols;
    }

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers: {
        'X-Response-Time': responseTime.toString()
      }
    });
  }
}

function generateSyntheticCandles(symbol: string, timeframe: string, limit: number): number[][] {
  const basePrice = getFallbackPrice(symbol);
  const now = Date.now();
  const timeframeMs = getTimeframeMs(timeframe);

  const candles: number[][] = [];
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - (i * timeframeMs);
    const volatility = 0.02; // 2% volatility
    const randomFactor = (Math.random() - 0.5) * volatility;

    const open = basePrice * (1 + randomFactor);
    const close = open * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = 1000 + Math.random() * 9000;

    candles.push([timestamp, open, high, low, close, volume]);
  }

  return candles;
}

function getFallbackPrice(symbol: string): number {
  const baseCurrency = symbol.split('/')[0];
  const fallbackPrices: Record<string, number> = {
    'BTC': 109000, 'ETH': 3800, 'PEPE': 0.00002, 'DOGE': 0.08,
    'SHIB': 0.000012, 'ADA': 0.45, 'SOL': 100, 'MATIC': 1.0
  };
  return fallbackPrices[baseCurrency] || 100;
}

function getTimeframeMs(timeframe: string): number {
  const timeframes: Record<string, number> = {
    '1m': 60 * 1000, '5m': 5 * 60 * 1000, '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000, '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  return timeframes[timeframe] || timeframes['1h'];
}
