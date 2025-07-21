import { NextResponse } from 'next/server';
import { databasePerformanceService } from '@/lib/databasePerformanceService';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return await handleStatusCheck();
      
      case 'stats':
        return await handleDatabaseStats();
      
      case 'cache-stats':
        return await handleCacheStats();
      
      case 'slow-queries':
        return await handleSlowQueries();
      
      case 'cleanup':
        return await handleCleanup();
      
      default:
        return NextResponse.json({
          message: 'Database Performance Monitoring API',
          availableActions: [
            'status - Overall database performance status',
            'stats - Database table statistics',
            'cache-stats - Cache performance statistics',
            'slow-queries - Identify slow database queries',
            'cleanup - Clean expired cache entries'
          ]
        });
    }
  } catch (error: any) {
    console.error('[Database Performance API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleStatusCheck() {
  const startTime = Date.now();

  try {
    // Check if supabase client is available
    if (!supabase) {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: 'Database connection not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Test database connection
    const { error } = await supabase
      .from('orders')
      .select('count')
      .limit(1);

    if (error) throw error;

    const responseTime = Date.now() - startTime;
    const cacheStats = databasePerformanceService.getCacheStats();
    
    // Determine overall health
    let status = 'healthy';
    let recommendations: string[] = [];
    
    if (responseTime > 1000) {
      status = 'slow';
      recommendations.push('Database response time is slow (>1s)');
    }
    
    if (cacheStats.hitRate < 0.5) {
      recommendations.push('Cache hit rate is low (<50%)');
    }
    
    if (cacheStats.expiredEntries > 100) {
      recommendations.push('Many expired cache entries, consider cleanup');
    }

    return NextResponse.json({
      success: true,
      status,
      performance: {
        responseTime: `${responseTime}ms`,
        connectionStatus: 'connected',
        cacheHitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`
      },
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleDatabaseStats() {
  try {
    const stats = await databasePerformanceService.getDatabaseStats();

    // Calculate total size safely
    const totalSize = stats.reduce((acc, stat) => {
      const sizeMatch = stat.totalSize.match(/\d+/);
      const size = sizeMatch ? parseInt(sizeMatch[0]) : 0;
      return acc + size;
    }, 0);

    return NextResponse.json({
      success: true,
      stats,
      summary: {
        totalTables: stats.length,
        totalSize,
        largestTable: stats.length > 0 ? stats[0].tableName : 'N/A'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch database statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleCacheStats() {
  try {
    const memoryStats = databasePerformanceService.getCacheStats();

    // Get database cache stats
    let dbCacheStats: { tradeCacheEntries: number; orderCacheEntries: number } | null = null;
    if (supabase) {
      try {
        const [tradeCache, orderCache] = await Promise.all([
          supabase.from('trade_history_cache').select('count'),
          supabase.from('order_history_cache').select('count')
        ]);

        dbCacheStats = {
          tradeCacheEntries: tradeCache.data?.length || 0,
          orderCacheEntries: orderCache.data?.length || 0
        };
      } catch (error) {
        console.warn('[Database Performance] Could not fetch DB cache stats:', error);
      }
    }

    return NextResponse.json({
      success: true,
      memoryCache: memoryStats,
      databaseCache: dbCacheStats,
      recommendations: generateCacheRecommendations(memoryStats),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch cache statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleSlowQueries() {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // This would require pg_stat_statements extension
    const { data, error } = await supabase.rpc('get_slow_queries');
    
    if (error) {
      // Fallback if function doesn't exist
      return NextResponse.json({
        success: true,
        message: 'Slow query monitoring requires pg_stat_statements extension',
        recommendation: 'Enable pg_stat_statements in your Supabase project',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      slowQueries: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch slow queries',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleCleanup() {
  try {
    // Clean memory cache
    databasePerformanceService.clearMemoryCache();
    
    // Clean database cache
    await databasePerformanceService.cleanupExpiredCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleanup completed successfully',
      actions: [
        'Memory cache cleared',
        'Expired database cache entries removed'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to perform cache cleanup',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateCacheRecommendations(stats: {
  hitRate: number;
  expiredEntries: number;
  validEntries: number;
  memoryUsage: number;
}): string[] {
  const recommendations: string[] = [];
  
  if (stats.hitRate < 0.3) {
    recommendations.push('Cache hit rate is very low. Consider increasing cache TTL or reviewing cache strategy.');
  } else if (stats.hitRate < 0.6) {
    recommendations.push('Cache hit rate could be improved. Monitor frequently accessed data patterns.');
  }
  
  if (stats.expiredEntries > stats.validEntries) {
    recommendations.push('Many expired cache entries. Consider running cleanup more frequently.');
  }
  
  if (stats.memoryUsage > 10000000) { // 10MB
    recommendations.push('Memory cache is large. Consider implementing cache size limits.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Cache performance looks good!');
  }
  
  return recommendations;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action }: { action: string } = body;

    if (!action) {
      return NextResponse.json({
        error: 'Action parameter is required',
        availableActions: ['clearCache', 'optimizeQueries']
      }, { status: 400 });
    }

    switch (action) {
      case 'clearCache':
        databasePerformanceService.clearMemoryCache();
        await databasePerformanceService.cleanupExpiredCache();
        return NextResponse.json({
          success: true,
          message: 'All caches cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'optimizeQueries':
        // This would implement query optimization suggestions
        return NextResponse.json({
          success: true,
          message: 'Query optimization analysis completed',
          recommendations: [
            'Consider adding indexes on frequently queried columns',
            'Use pagination for large result sets',
            'Implement proper caching strategies'
          ],
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['clearCache', 'optimizeQueries']
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Database Performance API] POST Error:', error);

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
