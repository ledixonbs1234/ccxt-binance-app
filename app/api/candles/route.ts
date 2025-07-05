import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC/USDT';
    const timeframe = searchParams.get('timeframe') || '1m';
    const limit = parseInt(searchParams.get('limit') || '100');

    const exchange = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET_KEY,
      options: { adjustForTimeDifference: true },
      enableRateLimit: true,
    });
    
    exchange.setSandboxMode(true);

    // Load markets first to ensure symbol is available
    await exchange.loadMarkets();
    
    // Check if symbol exists
    if (!exchange.markets[symbol]) {
      return NextResponse.json({ 
        error: `Symbol ${symbol} not found`,
        availableSymbols: Object.keys(exchange.markets).filter(s => s.includes('USDT')).slice(0, 10)
      }, { status: 400 });
    }

    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    
    return NextResponse.json(ohlcv);
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
