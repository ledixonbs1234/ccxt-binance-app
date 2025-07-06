import { NextResponse } from "next/server";
import ccxt from "ccxt";

export async function GET(){
    const binance = new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET_KEY,
        options: { adjustForTimeDifference: true }
    });
    binance.setSandboxMode(true);
    // binance.fees = {
    //     trading: {
    //         tierBased: false,
    //         percentage: true,
    //         taker: 0.1, // 0.1%
    //         maker: 0.1, // 0.1%
    //     },
    //     funding: {
    //         tierBased: false,
    //         percentage: false,
    //         withdraw: {},
    //         deposit: {},
    //     },
    // };
    const fees = await binance.fetchTradingFees();
    return NextResponse.json(fees);
}
