import { NextRequest, NextResponse } from 'next/server';
import { tradingApiService } from '@/lib/tradingApiService';
import { apiErrorHandler } from '@/lib/apiErrorHandler';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status':
        return getHealthStatus();
      
      case 'metrics':
        return getDetailedMetrics();
      
      case 'reset':
        return resetCircuitBreakers(searchParams);
      
      case 'test':
        return runHealthTest(searchParams);
      
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['status', 'metrics', 'reset', 'test'],
          usage: {
            status: 'Get overall API health status',
            metrics: 'Get detailed metrics for all API operations',
            reset: 'Reset circuit breakers (use ?operation=xxx&symbol=xxx)',
            test: 'Run health test for specific symbol (use ?symbol=xxx)'
          }
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[API Health] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getHealthStatus() {
  const healthStatus = tradingApiService.getHealthStatus();
  const allMetrics = apiErrorHandler.getAllMetrics();
  
  // Calculate overall statistics
  const totalRequests = Object.values(allMetrics).reduce((sum, m) => sum + m.totalRequests, 0);
  const totalSuccessful = Object.values(allMetrics).reduce((sum, m) => sum + m.successfulRequests, 0);
  const totalFailed = Object.values(allMetrics).reduce((sum, m) => sum + m.failedRequests, 0);
  const totalRetries = Object.values(allMetrics).reduce((sum, m) => sum + m.retryAttempts, 0);
  const totalCircuitBreakerTrips = Object.values(allMetrics).reduce((sum, m) => sum + m.circuitBreakerTrips, 0);
  
  const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 100;
  const avgResponseTime = Object.values(allMetrics).reduce((sum, m) => sum + m.averageResponseTime, 0) / Math.max(Object.keys(allMetrics).length, 1);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    overall: healthStatus.overall,
    summary: {
      totalRequests,
      successfulRequests: totalSuccessful,
      failedRequests: totalFailed,
      successRate: Math.round(overallSuccessRate * 100) / 100,
      retryAttempts: totalRetries,
      circuitBreakerTrips: totalCircuitBreakerTrips,
      averageResponseTime: Math.round(avgResponseTime)
    },
    services: healthStatus.details,
    recommendations: generateRecommendations(healthStatus, allMetrics)
  });
}

async function getDetailedMetrics() {
  const allMetrics = apiErrorHandler.getAllMetrics();
  const healthStatus = tradingApiService.getHealthStatus();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    overall: healthStatus.overall,
    metrics: allMetrics,
    circuitBreakers: getCircuitBreakerStatus(),
    cacheStats: getCacheStatistics()
  });
}

async function resetCircuitBreakers(searchParams: URLSearchParams) {
  const operation = searchParams.get('operation');
  const symbol = searchParams.get('symbol');
  
  if (!operation) {
    return NextResponse.json({
      error: 'Operation parameter is required',
      example: '/api/api-health?action=reset&operation=getCurrentPrice&symbol=BTC/USDT'
    }, { status: 400 });
  }

  try {
    tradingApiService.resetCircuitBreaker(operation, symbol);
    
    return NextResponse.json({
      success: true,
      message: `Circuit breaker reset for ${operation}${symbol ? `_${symbol}` : ''}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset circuit breaker'
    }, { status: 500 });
  }
}

async function runHealthTest(searchParams: URLSearchParams) {
  const symbol = searchParams.get('symbol') || 'BTC/USDT';
  const testResults: any = {
    symbol,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test getCurrentPrice
    const priceStart = Date.now();
    try {
      const price = await tradingApiService.getCurrentPrice(symbol);
      testResults.tests.getCurrentPrice = {
        success: true,
        responseTime: Date.now() - priceStart,
        result: price
      };
    } catch (error) {
      testResults.tests.getCurrentPrice = {
        success: false,
        responseTime: Date.now() - priceStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test getTickerData
    const tickerStart = Date.now();
    try {
      const ticker = await tradingApiService.getTickerData(symbol);
      testResults.tests.getTickerData = {
        success: true,
        responseTime: Date.now() - tickerStart,
        result: {
          symbol: ticker.symbol,
          last: ticker.last,
          volume: ticker.volume
        }
      };
    } catch (error) {
      testResults.tests.getTickerData = {
        success: false,
        responseTime: Date.now() - tickerStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test getCandleData
    const candleStart = Date.now();
    try {
      const candles = await tradingApiService.getCandleData(symbol, '1h', 10);
      testResults.tests.getCandleData = {
        success: true,
        responseTime: Date.now() - candleStart,
        result: {
          candleCount: candles.length,
          latestCandle: candles[candles.length - 1]
        }
      };
    } catch (error) {
      testResults.tests.getCandleData = {
        success: false,
        responseTime: Date.now() - candleStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Calculate overall test result
    const successfulTests = Object.values(testResults.tests).filter((test: any) => test.success).length;
    const totalTests = Object.keys(testResults.tests).length;
    
    testResults.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: Math.round((successfulTests / totalTests) * 100),
      overallStatus: successfulTests === totalTests ? 'healthy' : successfulTests > 0 ? 'degraded' : 'critical'
    };

    return NextResponse.json({
      success: true,
      ...testResults
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health test failed',
      partialResults: testResults
    }, { status: 500 });
  }
}

function generateRecommendations(healthStatus: any, metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (healthStatus.overall === 'critical') {
    recommendations.push('🚨 Critical: Multiple API services are failing. Check network connectivity and API keys.');
  } else if (healthStatus.overall === 'degraded') {
    recommendations.push('⚠️ Warning: Some API services are experiencing issues. Monitor closely.');
  }

  const totalRequests = Object.values(metrics).reduce((sum: number, m: any) => sum + m.totalRequests, 0);
  const totalRetries = Object.values(metrics).reduce((sum: number, m: any) => sum + m.retryAttempts, 0);
  
  if (totalRequests > 0 && (totalRetries / totalRequests) > 0.1) {
    recommendations.push('🔄 High retry rate detected. Consider implementing longer delays or checking API rate limits.');
  }

  const circuitBreakerTrips = Object.values(metrics).reduce((sum: number, m: any) => sum + m.circuitBreakerTrips, 0);
  if (circuitBreakerTrips > 0) {
    recommendations.push('⚡ Circuit breakers have been triggered. Check for persistent API issues.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating normally.');
  }

  return recommendations;
}

function getCircuitBreakerStatus(): Record<string, string> {
  // This would need to be implemented in apiErrorHandler to expose circuit breaker states
  return {
    note: 'Circuit breaker status monitoring not yet implemented'
  };
}

function getCacheStatistics(): Record<string, any> {
  return {
    note: 'Cache statistics monitoring not yet implemented',
    recommendation: 'Implement cache hit/miss ratio tracking'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clearCache':
        tradingApiService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'All caches cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'resetAllCircuitBreakers':
        // This would need to be implemented in apiErrorHandler
        return NextResponse.json({
          success: false,
          message: 'Reset all circuit breakers not yet implemented'
        }, { status: 501 });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['clearCache', 'resetAllCircuitBreakers']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
