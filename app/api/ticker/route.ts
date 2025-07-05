import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC/USDT';
  
  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY!,
    secret: process.env.BINANCE_SECRET_KEY!,
    options: { adjustForTimeDifference: true },
  });
  binance.setSandboxMode(true);

  try {
    // Load markets first to ensure symbol is available
    await binance.loadMarkets();
    
    // Check if symbol exists
    if (!binance.markets[symbol]) {
      return NextResponse.json({ 
        error: `Symbol ${symbol} not found`,
        availableSymbols: Object.keys(binance.markets).filter(s => s.includes('USDT')).slice(0, 10)
      }, { status: 400 });
    }
    
    const ticker = await binance.fetchTicker(symbol);
    return NextResponse.json(ticker);
  } catch (error: any) {
    console.error('Ticker API error:', error);
    return NextResponse.json({ 
      error: error.message,
      symbol: symbol 
    }, { status: 500 });
  }
}
