import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET() {
  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY!,
    secret: process.env.BINANCE_SECRET_KEY!,
    options: { adjustForTimeDifference: true },
  });
  binance.setSandboxMode(true);

  try {
    const ticker = (await binance.fetchTicker('BTC/USDT'));
    return NextResponse.json(ticker);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
