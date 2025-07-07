import { NextResponse } from "next/server";
import ccxt from "ccxt";
import { balanceCache, CacheKeys } from "@/lib/cacheService";

export async function GET() {
    try {
        // Check cache first
        const cacheKey = CacheKeys.balance();
        const cachedBalance = balanceCache.get(cacheKey);

        if (cachedBalance) {
            console.log('[BALANCE] Cache hit');
            return NextResponse.json({
                ...cachedBalance,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log('[BALANCE] Cache miss, fetching from API');
        const startTime = Date.now();

        const binance = new ccxt.binance({
            apiKey: process.env.BINANCE_API_KEY,
            secret: process.env.BINANCE_SECRET_KEY,
            options: { adjustForTimeDifference: true }
        });

        binance.setSandboxMode(true);

        const balance = await binance.fetchBalance();
        const endTime = Date.now();

        console.log(`[BALANCE] Fetched in ${endTime - startTime}ms`);

        // Cache for 8 seconds
        balanceCache.set(cacheKey, balance, 8000);

        return NextResponse.json({
            ...balance,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[BALANCE] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}