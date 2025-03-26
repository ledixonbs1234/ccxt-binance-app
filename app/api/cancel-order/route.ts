import { NextResponse } from "next/server";
import ccxt from "ccxt";

export async function POST(request: Request) {
  const { orderId } = await request.json();
  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET_KEY,
    options: { adjustForTimeDifference: true }
  });
  binance.setSandboxMode(true);

  try {
    const result = await binance.cancelOrder(orderId, 'BTC/USDT');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
