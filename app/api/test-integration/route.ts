// API endpoint để test tích hợp dữ liệu thực tế
import { NextRequest, NextResponse } from 'next/server';
import { tradingApiService } from '../../../lib/tradingApiService';
import { enhancedTrailingStopService } from '../../../lib/enhancedTrailingStopService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('test') || 'all';

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      results: {}
    };

    // Test 1: API Health Check
    if (testType === 'all' || testType === 'health') {
      console.log('🔍 Testing API Health...');
      try {
        const healthCheck = await enhancedTrailingStopService.checkApiHealth();
        results.results.healthCheck = {
          status: 'success',
          data: healthCheck
        };
      } catch (error) {
        results.results.healthCheck = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 2: Price API
    if (testType === 'all' || testType === 'price') {
      console.log('💰 Testing Price API...');
      const testCoins = ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'];
      results.results.priceTest = {};

      for (const coin of testCoins) {
        try {
          const price = await tradingApiService.getCurrentPrice(coin);
          results.results.priceTest[coin] = {
            status: 'success',
            price,
            isValid: !!(price && !isNaN(price) && price > 0)
          };
        } catch (error) {
          results.results.priceTest[coin] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    // Test 3: Volatility Calculation
    if (testType === 'all' || testType === 'volatility') {
      console.log('📈 Testing Volatility Calculation...');
      const testCoins = ['BTC/USDT', 'ETH/USDT'];
      results.results.volatilityTest = {};

      for (const coin of testCoins) {
        try {
          const volatility = await tradingApiService.calculateVolatility(coin);
          results.results.volatilityTest[coin] = {
            status: 'success',
            data: {
              atr: volatility.atr,
              volatilityPercent: volatility.volatilityPercent,
              trend: volatility.trend,
              strength: volatility.strength
            },
            isValid: !!(volatility.atr && !isNaN(volatility.atr))
          };
        } catch (error) {
          results.results.volatilityTest[coin] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    // Test 4: Position Creation
    if (testType === 'all' || testType === 'position') {
      console.log('🎯 Testing Position Creation...');
      try {
        const testPosition = await enhancedTrailingStopService.createPosition({
          symbol: 'BTC/USDT',
          side: 'sell',
          quantity: 0.001,
          trailingPercent: 2.0,
          strategy: 'percentage'
        });

        results.results.positionTest = {
          status: 'success',
          data: {
            id: testPosition.id,
            symbol: testPosition.symbol,
            entryPrice: testPosition.entryPrice,
            currentStopPrice: testPosition.currentStopPrice,
            trailingPercent: testPosition.trailingPercent,
            quantity: testPosition.quantity
          }
        };
      } catch (error) {
        results.results.positionTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 5: Service Statistics
    if (testType === 'all' || testType === 'stats') {
      console.log('📊 Testing Service Statistics...');
      try {
        const stats = enhancedTrailingStopService.getServiceStats();
        results.results.statsTest = {
          status: 'success',
          data: stats
        };
      } catch (error) {
        results.results.statsTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 6: Cache Performance
    if (testType === 'all' || testType === 'cache') {
      console.log('⚡ Testing Cache Performance...');
      try {
        // First call (API)
        const start1 = Date.now();
        const price1 = await tradingApiService.getCurrentPrice('BTC/USDT');
        const time1 = Date.now() - start1;

        // Second call (Cache)
        const start2 = Date.now();
        const price2 = await tradingApiService.getCurrentPrice('BTC/USDT');
        const time2 = Date.now() - start2;

        results.results.cacheTest = {
          status: 'success',
          data: {
            firstCall: { time: time1, price: price1 },
            secondCall: { time: time2, price: price2 },
            speedup: time1 > 0 ? (time1 / Math.max(time2, 1)).toFixed(1) + 'x' : 'N/A',
            consistent: price1 === price2
          }
        };
      } catch (error) {
        results.results.cacheTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 7: Error Handling
    if (testType === 'all' || testType === 'error') {
      console.log('🛡️ Testing Error Handling...');
      try {
        const invalidPrice = await tradingApiService.getCurrentPrice('INVALID/USDT');
        const invalidVolatility = await tradingApiService.calculateVolatility('INVALID/USDT');

        results.results.errorHandlingTest = {
          status: 'success',
          data: {
            fallbackPrice: invalidPrice,
            fallbackVolatility: {
              atr: invalidVolatility.atr,
              volatilityPercent: invalidVolatility.volatilityPercent
            }
          }
        };
      } catch (error) {
        results.results.errorHandlingTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Test integration error:', error);
    return NextResponse.json({
      error: 'Test integration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clearCache') {
      enhancedTrailingStopService.clearApiCache();
      return NextResponse.json({ 
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'updateSettings') {
      const { settings } = body;
      enhancedTrailingStopService.updateSettings(settings);
      return NextResponse.json({ 
        message: 'Settings updated successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action',
      availableActions: ['clearCache', 'updateSettings']
    }, { status: 400 });

  } catch (error) {
    console.error('Test integration POST error:', error);
    return NextResponse.json({
      error: 'POST request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
