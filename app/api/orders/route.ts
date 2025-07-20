import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { databasePerformanceService } from '@/lib/databasePerformanceService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Parse pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        // Parse filters
        const symbol = searchParams.get('symbol');
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');

        const filters: Record<string, any> = {};
        if (symbol) filters.symbol = symbol;
        if (status) filters.status = status;

        // Use optimized database service with pagination and caching
        const result = await databasePerformanceService.getOrdersOptimized(
            userId || undefined,
            { page, limit, sortBy, sortOrder },
            filters
        );

        return NextResponse.json({
            success: true,
            ...result,
            _metadata: {
                timestamp: new Date().toISOString(),
                cached: true // Indicates this endpoint uses caching
            }
        });
    } catch (error: any) {
        console.error('[Orders API] Error:', error);
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

export async function POST(req: Request) {
    try {
        const orderData = await req.json();

        // Validate required fields
        if (!orderData.symbol || !orderData.side || !orderData.quantity) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: symbol, side, quantity'
            }, { status: 400 });
        }

        // Add timestamps
        const enrichedOrderData = {
            ...orderData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(enrichedOrderData)
            .select();

        if (error) throw error;

        // Clear cache after successful insert
        databasePerformanceService.clearMemoryCache();

        return NextResponse.json({
            success: true,
            data: data[0],
            _metadata: {
                timestamp: new Date().toISOString(),
                operation: 'create'
            }
        });
    } catch (error: any) {
        console.error('[Orders API] POST Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            _metadata: {
                timestamp: new Date().toISOString(),
                operation: 'create'
            }
        }, { status: 500 });
    }
}