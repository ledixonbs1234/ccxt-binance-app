import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { databasePerformanceService } from '@/lib/databasePerformanceService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Parse parameters
        const symbol = searchParams.get('symbol') || 'BTC/USDT';
        const limit = parseInt(searchParams.get('limit') || '100');
        const page = parseInt(searchParams.get('page') || '1');
        const status = searchParams.get('status'); // Filter by order status
        const userId = searchParams.get('userId') || 'default_user';

        // Check cache first
        const cachedData = await databasePerformanceService.getCachedOrderHistory(userId, symbol);
        if (cachedData) {
            // Apply filters and pagination to cached data
            let filteredData = cachedData;
            if (status) {
                filteredData = cachedData.filter((order: any) => order.status === status);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            return NextResponse.json({
                success: true,
                data: paginatedData,
                pagination: {
                    page,
                    limit,
                    total: filteredData.length,
                    totalPages: Math.ceil(filteredData.length / limit),
                    hasNext: endIndex < filteredData.length,
                    hasPrev: page > 1
                },
                filters: { symbol, status },
                _metadata: {
                    timestamp: new Date().toISOString(),
                    cached: true,
                    source: 'database_cache'
                }
            });
        }

        // Fetch from Binance if not cached
        const binance = new ccxt.binance({
            apiKey: process.env.BINANCE_API_KEY!,
            secret: process.env.BINANCE_SECRET_KEY!,
            options: { adjustForTimeDifference: true },
        });
        binance.setSandboxMode(true);

        // Lấy lịch sử lệnh của symbol được chỉ định
        const orders = await binance.fetchOrders(symbol, undefined, Math.min(limit * 2, 500));

        // Lọc ra những thông tin cần thiết cho mỗi lệnh
        const necessaryOrders = orders.map((order: any) => ({
            id: order.id,
            datetime: order.datetime,
            timestamp: order.timestamp,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            price: order.price,
            amount: order.amount,
            cost: order.cost,
            filled: order.filled,
            remaining: order.remaining,
            status: order.status,
            fee: order.fee,
            trades: order.trades?.length || 0,
            lastTradeTimestamp: order.lastTradeTimestamp
        })).reverse(); // Most recent first

        // Cache the full data
        await databasePerformanceService.cacheOrderHistory(userId, symbol, necessaryOrders);

        // Apply filters
        let filteredOrders = necessaryOrders;
        if (status) {
            filteredOrders = necessaryOrders.filter(order => order.status === status);
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredOrders.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            data: paginatedData,
            pagination: {
                page,
                limit,
                total: filteredOrders.length,
                totalPages: Math.ceil(filteredOrders.length / limit),
                hasNext: endIndex < filteredOrders.length,
                hasPrev: page > 1
            },
            filters: { symbol, status },
            _metadata: {
                timestamp: new Date().toISOString(),
                cached: false,
                source: 'binance_api',
                responseTime: Date.now()
            }
        });
    } catch (error: any) {
        console.error('[Order History API] Error:', error);
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
