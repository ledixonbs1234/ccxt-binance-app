import { NextResponse } from "next/server";
import ccxt from "ccxt";

export async function GET() {
  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET_KEY,
    options: { adjustForTimeDifference: true }
  });
  binance.setSandboxMode(true);

  try {
    const trades = await binance.fetchMyTrades('BTC/USDT');
    const currentPrice = await binance.fetchTicker('BTC/USDT');
    console.log(trades);    

    const tradeHistory = trades.map(trade => ({
      id: trade.id,
      datetime: trade.datetime,
      price: trade.price,
      amount: trade.amount,
      currentPrice: currentPrice.last
    })).toReversed();


    return NextResponse.json(tradeHistory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
