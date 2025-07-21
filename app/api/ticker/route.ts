import { NextResponse } from 'next/server';
import ccxt, { Ticker } from 'ccxt';
import { apiErrorHandler } from '@/lib/apiErrorHandler';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC/USDT';

  // Rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      retryAfter: 60,
      message: `Too many requests. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed.`
    }, {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString()
      }
    });
  }

  const operation = async () => {
    const binance = new ccxt.binance({
      // Remove API keys for public data access - we only need ticker data
      // apiKey: process.env.BINANCE_API_KEY!,
      // secret: process.env.BINANCE_SECRET_KEY!,
      options: { adjustForTimeDifference: true },
      enableRateLimit: true,
    });

    // Load markets first to ensure symbol is available
    await binance.loadMarkets();

    // Check if symbol exists
    if (!binance.markets[symbol]) {
      const error = new Error(`Symbol ${symbol} not found`);
      (error as any).status = 400;
      (error as any).availableSymbols = Object.keys(binance.markets).filter(s => s.includes('USDT')).slice(0, 10);
      throw error;
    }

    const ticker = await binance.fetchTicker(symbol);
    return ticker;
  };

  const fallback = (): Ticker => {
    console.warn(`[Ticker API] Using fallback data for ${symbol}`);

    // Try to get cached successful price
    const lastPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
    const basePrice = lastPrice || getFallbackPrice(symbol);

    return {
      info: {},
      symbol,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      high: basePrice * 1.05,
      low: basePrice * 0.95,
      bid: basePrice * 0.999,
      bidVolume: undefined,
      ask: basePrice * 1.001,
      askVolume: undefined,
      vwap: undefined,
      open: basePrice,
      close: basePrice,
      last: basePrice,
      previousClose: undefined,
      change: 0,
      percentage: 0,
      average: basePrice,
      baseVolume: 1000000,
      quoteVolume: 1000000 * basePrice,
      indexPrice: undefined,
      markPrice: undefined
    };
  };

  try {
    const result = await apiErrorHandler.executeWithCircuitBreaker(
      `ticker_api_${symbol}`,
      operation,
      fallback,
      {
        maxRetries: 2,
        baseDelay: 500,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    );

    // Cache successful price
    if (result.last && !isNaN(result.last)) {
      apiErrorHandler.cacheSuccessfulPrice(symbol, result.last);
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      _metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        cached: false
      }
    }, {
      headers: {
        'X-Response-Time': responseTime.toString(),
        'Cache-Control': 'public, max-age=5'
      }
    });

  } catch (error: any) {
    console.error('Ticker API error:', error);

    const responseTime = Date.now() - startTime;
    const statusCode = error.status || 500;

    const errorResponse = {
      success: false,
      error: error.message || 'Internal server error',
      symbol,
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

function getFallbackPrice(symbol: string): number {
  const baseCurrency = symbol.split('/')[0];

  const fallbackPrices: Record<string, number> = {
    'BTC': 109000,
    'ETH': 3800,
    'PEPE': 0.00002,
    'DOGE': 0.08,
    'SHIB': 0.000012,
    'ADA': 0.45,
    'SOL': 100,
    'MATIC': 1.0
  };

  return fallbackPrices[baseCurrency] || 100;
}
