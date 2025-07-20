// Test script để kiểm tra tích hợp API thực tế
// Chạy: node test-api-integration.js

const { tradingApiService } = require('../lib/tradingApiService');
const { enhancedTrailingStopService } = require('../lib/enhancedTrailingStopService');

async function testApiIntegration() {
  console.log('🚀 Bắt đầu test tích hợp API thực tế...\n');

  // Test 1: Kiểm tra API Health
  console.log('📊 Test 1: Kiểm tra API Health');
  try {
    const healthCheck = await enhancedTrailingStopService.checkApiHealth();
    console.log('✅ API Health Check:', healthCheck);
    
    if (!healthCheck.isHealthy) {
      console.log('⚠️  Cảnh báo: API không hoạt động tốt:', healthCheck.errors);
    }
  } catch (error) {
    console.log('❌ Lỗi API Health Check:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Test getCurrentPrice với các coins khác nhau
  console.log('💰 Test 2: Test getCurrentPrice');
  const testCoins = ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'];
  
  for (const coin of testCoins) {
    try {
      const price = await tradingApiService.getCurrentPrice(coin);
      console.log(`✅ ${coin}: $${price}`);
      
      // Validate price
      if (!price || isNaN(price) || price <= 0) {
        console.log(`❌ Giá không hợp lệ cho ${coin}: ${price}`);
      }
    } catch (error) {
      console.log(`❌ Lỗi lấy giá ${coin}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test calculateVolatility
  console.log('📈 Test 3: Test calculateVolatility');
  
  for (const coin of testCoins) {
    try {
      const volatility = await tradingApiService.calculateVolatility(coin);
      console.log(`✅ ${coin} Volatility:`, {
        atr: volatility.atr.toFixed(6),
        volatilityPercent: volatility.volatilityPercent.toFixed(2) + '%',
        trend: volatility.trend,
        strength: volatility.strength
      });
      
      // Validate volatility data
      if (!volatility.atr || isNaN(volatility.atr)) {
        console.log(`❌ ATR không hợp lệ cho ${coin}`);
      }
    } catch (error) {
      console.log(`❌ Lỗi tính volatility ${coin}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Test Position Creation với dữ liệu thực
  console.log('🎯 Test 4: Test Position Creation');
  
  try {
    const testPosition = await enhancedTrailingStopService.createPosition({
      symbol: 'BTC/USDT',
      side: 'sell',
      quantity: 0.001,
      trailingPercent: 2.0,
      strategy: 'percentage'
    });
    
    console.log('✅ Position tạo thành công:', {
      id: testPosition.id,
      symbol: testPosition.symbol,
      entryPrice: testPosition.entryPrice,
      currentStopPrice: testPosition.currentStopPrice,
      trailingPercent: testPosition.trailingPercent
    });
    
    // Test position sizing calculation
    if (testPosition.quantity !== 0.001) {
      console.log(`📊 Position size đã được điều chỉnh: ${testPosition.quantity}`);
    }
    
  } catch (error) {
    console.log('❌ Lỗi tạo position:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Test Service Statistics
  console.log('📊 Test 5: Test Service Statistics');
  
  try {
    const stats = enhancedTrailingStopService.getServiceStats();
    console.log('✅ Service Stats:', stats);
  } catch (error) {
    console.log('❌ Lỗi lấy stats:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Test Cache Performance
  console.log('⚡ Test 6: Test Cache Performance');
  
  try {
    console.log('🔄 Test cache performance cho BTC/USDT...');
    
    // First call (should fetch from API)
    const start1 = Date.now();
    const price1 = await tradingApiService.getCurrentPrice('BTC/USDT');
    const time1 = Date.now() - start1;
    
    // Second call (should use cache)
    const start2 = Date.now();
    const price2 = await tradingApiService.getCurrentPrice('BTC/USDT');
    const time2 = Date.now() - start2;
    
    console.log(`✅ Lần 1 (API): ${time1}ms - Price: $${price1}`);
    console.log(`✅ Lần 2 (Cache): ${time2}ms - Price: $${price2}`);
    console.log(`🚀 Cache speedup: ${(time1/time2).toFixed(1)}x faster`);
    
    if (price1 !== price2) {
      console.log('❌ Cache không nhất quán!');
    }
    
  } catch (error) {
    console.log('❌ Lỗi test cache:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 7: Test Error Handling
  console.log('🛡️  Test 7: Test Error Handling');
  
  try {
    // Test với symbol không tồn tại
    const invalidPrice = await tradingApiService.getCurrentPrice('INVALID/USDT');
    console.log('✅ Fallback price cho INVALID/USDT:', invalidPrice);
    
    // Test với volatility cho symbol không tồn tại
    const invalidVolatility = await tradingApiService.calculateVolatility('INVALID/USDT');
    console.log('✅ Fallback volatility cho INVALID/USDT:', {
      atr: invalidVolatility.atr,
      volatilityPercent: invalidVolatility.volatilityPercent
    });
    
  } catch (error) {
    console.log('❌ Lỗi test error handling:', error.message);
  }

  console.log('\n🎉 Hoàn thành test tích hợp API!');
  console.log('📝 Kiểm tra logs trên để xem kết quả chi tiết.');
}

// Chạy test
if (require.main === module) {
  testApiIntegration().catch(console.error);
}

module.exports = { testApiIntegration };
