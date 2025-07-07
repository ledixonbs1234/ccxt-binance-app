import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { candleCache, CacheKeys } from '@/lib/cacheService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC/USDT';
    const timeframe = searchParams.get('timeframe') || '1m';
    const limit = parseInt(searchParams.get('limit') || '100');

    const exchange = new ccxt.binance({
      // Remove API keys for public data access - we only need OHLCV data
      // apiKey: process.env.BINANCE_API_KEY,
      // secret: process.env.BINANCE_SECRET_KEY,
      options: { adjustForTimeDifference: true },
      enableRateLimit: true,
    });

    // Use real market data instead of sandbox
    // exchange.setSandboxMode(true);

    // Load markets first to ensure symbol is available
    await exchange.loadMarkets();
    
    // Check if symbol exists
    if (!exchange.markets[symbol]) {
      return NextResponse.json({ 
        error: `Symbol ${symbol} not found`,
        availableSymbols: Object.keys(exchange.markets).filter(s => s.includes('USDT')).slice(0, 10)
      }, { status: 400 });
    }

    // Check cache first
    const cacheKey = CacheKeys.candles(symbol, timeframe, limit);
    const cachedCandles = candleCache.get(cacheKey);

    if (cachedCandles) {
      console.log(`[CANDLES] Cache hit for ${symbol} ${timeframe}`);
      return NextResponse.json({
        data: cachedCandles,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[CANDLES] Cache miss, fetching ${symbol} ${timeframe} from API`);
    const startTime = Date.now();

    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    const endTime = Date.now();

    console.log(`[CANDLES] Fetched ${symbol} ${timeframe} in ${endTime - startTime}ms`);

    // Cache for 20 seconds
    candleCache.set(cacheKey, ohlcv, 20000);

    return NextResponse.json({
      data: ohlcv,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching OHLCV data:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch OHLCV data',
        symbol: new URL(request.url).searchParams.get('symbol')
      },
      { status: 500 }
    );
  }
}
