import { NextRequest, NextResponse } from 'next/server';
import { tradingApiService } from '@/lib/tradingApiService';
import { priceCache, CacheKeys } from '@/lib/cacheService';
import { apiErrorHandler } from '@/lib/apiErrorHandler';

// Rate limiting for batch ticker
const BATCH_RATE_LIMIT = 30; // requests per minute
const batchRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkBatchRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = batchRequestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    batchRequestCounts.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (clientData.count >= BATCH_RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json({
        success: false,
        error: 'Symbols parameter is required',
        example: '/api/batch-ticker?symbols=BTC/USDT,ETH/USDT,PEPE/USDT'
      }, { status: 400 });
    }

    // Parse symbols from comma-separated string
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one valid symbol is required'
      }, { status: 400 });
    }

    if (symbols.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Too many symbols requested',
        maxSymbols: 20,
        providedSymbols: symbols.length
      }, { status: 400 });
    }

    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkBatchRateLimit(clientId)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded for batch ticker API',
        retryAfter: 60,
        maxRequestsPerMinute: BATCH_RATE_LIMIT
      }, {
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    console.log(`[BATCH-TICKER] Fetching data for symbols: ${symbols.join(', ')}`);

    // Check cache first
    const cacheKey = CacheKeys.batchTicker(symbols);
    const cachedResult = priceCache.get(cacheKey);

    if (cachedResult) {
      console.log(`[BATCH-TICKER] Cache hit for ${symbols.join(', ')} (${Date.now() - startTime}ms)`);
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch all ticker data in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        // Check individual symbol cache first
        const symbolCacheKey = CacheKeys.ticker(symbol);
        const cachedPrice = priceCache.get(symbolCacheKey);

        if (cachedPrice) {
          return {
            symbol,
            success: true,
            data: cachedPrice,
            cached: true
          };
        }

        const data = await tradingApiService.getTickerData(symbol);

        // Cache individual symbol
        priceCache.set(symbolCacheKey, data, 3000); // 3 seconds for individual prices

        return {
          symbol,
          success: true,
          data,
          cached: false
        };
      } catch (error) {
        console.error(`[BATCH-TICKER] Error fetching ${symbol}:`, error);
        return {
          symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const cacheHits = results.filter(r => r.success && (r as any).cached).length;
    const apiCalls = results.filter(r => r.success && !(r as any).cached).length;

    console.log(`[BATCH-TICKER] Completed in ${endTime - startTime}ms (${cacheHits} cache hits, ${apiCalls} API calls)`);

    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: endTime - startTime,
      cacheHits,
      apiCalls,
      results: successful.map(r => ({
        symbol: r.symbol,
        data: r.data
      })),
      errors: failed.length > 0 ? failed.map(r => ({
        symbol: r.symbol,
        error: r.error
      })) : undefined
    };

    // Cache the batch result for 2 seconds
    priceCache.set(cacheKey, response, 2000);

    const responseTime = endTime - startTime;
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': responseTime.toString(),
        'Cache-Control': 'public, max-age=2'
      }
    });

  } catch (error) {
    console.error('[BATCH-TICKER] Unexpected error:', error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      responseTime
    }, {
      status: 500,
      headers: {
        'X-Response-Time': responseTime.toString()
      }
    });
  }
}
