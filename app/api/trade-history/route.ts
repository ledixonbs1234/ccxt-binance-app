import { NextResponse } from "next/server";
import ccxt from "ccxt";
import { databasePerformanceService } from '@/lib/databasePerformanceService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse parameters
    const symbol = searchParams.get('symbol') || 'BTC/USDT';
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const userId = searchParams.get('userId') || 'default_user';

    // Check cache first
    const cachedData = await databasePerformanceService.getCachedTradeHistory(userId, symbol);
    if (cachedData) {
      // Apply pagination to cached data
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = cachedData.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: cachedData.length,
          totalPages: Math.ceil(cachedData.length / limit),
          hasNext: endIndex < cachedData.length,
          hasPrev: page > 1
        },
        _metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
          symbol,
          source: 'database_cache'
        }
      });
    }

    // Fetch from Binance if not cached
    const binance = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET_KEY,
      options: { adjustForTimeDifference: true }
    });
    binance.setSandboxMode(true);

    const [trades, currentPrice] = await Promise.all([
      binance.fetchMyTrades(symbol, undefined, Math.min(limit * 2, 500)), // Fetch more for caching
      binance.fetchTicker(symbol)
    ]);

    const tradeHistory = trades.map(trade => ({
      id: trade.id,
      datetime: trade.datetime,
      timestamp: trade.timestamp,
      price: trade.price,
      amount: trade.amount,
      cost: trade.cost,
      side: trade.side,
      symbol: trade.symbol,
      fee: trade.fee,
      currentPrice: currentPrice.last
    })).reverse(); // Most recent first

    // Cache the full data
    await databasePerformanceService.cacheTradeHistory(userId, symbol, tradeHistory);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = tradeHistory.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: tradeHistory.length,
        totalPages: Math.ceil(tradeHistory.length / limit),
        hasNext: endIndex < tradeHistory.length,
        hasPrev: page > 1
      },
      _metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        symbol,
        source: 'binance_api',
        responseTime: Date.now()
      }
    });
  } catch (error: any) {
    console.error('[Trade History API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      _metadata: {
        timestamp: new Date().toISOString(),
        cached: false
      }
    }, { status: 500 });
  }
}
