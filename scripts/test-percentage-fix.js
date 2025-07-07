// Test script để kiểm tra phần trăm thay đổi giá đã được sửa
// Sử dụng fetch built-in của Node.js (v18+)

const COIN_PAIRS = {
  'BTC': 'BTC/USDT',
  'ETH': 'ETH/USDT',
  'PEPE': 'PEPE/USDT',
  'DOGE': 'DOGE/USDT',
  'SHIB': 'SHIB/USDT',
  'ADA': 'ADA/USDT',
  'SOL': 'SOL/USDT',
  'POL': 'POL/USDT'  // MATIC đã được đổi thành POL
};

async function testPercentageChanges() {
  console.log('🔍 KIỂM TRA PHẦN TRĂM THAY ĐỔI GIÁ');
  console.log('=====================================\n');

  try {
    // Test batch ticker API
    const symbols = Object.values(COIN_PAIRS).join(',');
    const response = await fetch(`http://localhost:3000/api/batch-ticker?symbols=${encodeURIComponent(symbols)}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const batchResult = await response.json();
    
    if (!batchResult.success) {
      throw new Error(`Batch API failed: ${batchResult.error}`);
    }

    console.log(`✅ Batch API thành công - Duration: ${batchResult.duration}ms`);
    console.log(`📊 Cache hits: ${batchResult.cacheHits}, API calls: ${batchResult.apiCalls}\n`);

    // Kiểm tra từng coin
    console.log('📈 PHẦN TRĂM THAY ĐỔI GIÁ CỦA TỪNG COIN:');
    console.log('-'.repeat(60));
    
    batchResult.results.forEach(result => {
      const coin = Object.keys(COIN_PAIRS).find(
        key => COIN_PAIRS[key] === result.symbol
      );
      
      const data = result.data;
      const percentage = data.percentage;
      const price = data.last;

      // Kiểm tra xem percentage có hợp lệ không
      const isValidPercentage = percentage !== null &&
                               percentage !== undefined &&
                               !isNaN(percentage) &&
                               percentage !== -100;

      const status = isValidPercentage ? '✅' : '❌';
      const color = percentage >= 0 ? '🟢' : '🔴';

      // Format price safely
      const formattedPrice = price && !isNaN(price) ? price.toLocaleString() : 'N/A';
      const formattedPercentage = percentage && !isNaN(percentage) ? percentage.toFixed(4) : 'N/A';

      console.log(`${status} ${coin.padEnd(6)} | Price: $${formattedPrice.padEnd(12)} | Change: ${color} ${percentage >= 0 ? '+' : ''}${formattedPercentage}%`);
      
      if (!isValidPercentage) {
        console.log(`   ⚠️  Lỗi: Percentage không hợp lệ cho ${coin}`);
      }
    });

    // Tính thống kê
    const validPercentages = batchResult.results.filter(r => {
      const p = r.data.percentage;
      return p !== null && p !== undefined && !isNaN(p) && p !== -100;
    });

    const invalidPercentages = batchResult.results.length - validPercentages.length;
    
    console.log('\n📊 THỐNG KÊ:');
    console.log('-'.repeat(30));
    console.log(`✅ Coins có percentage hợp lệ: ${validPercentages.length}/${batchResult.results.length}`);
    console.log(`❌ Coins có percentage không hợp lệ: ${invalidPercentages}`);
    
    if (invalidPercentages === 0) {
      console.log('\n🎉 THÀNH CÔNG! Tất cả coins đều hiển thị phần trăm thay đổi giá đúng!');
    } else {
      console.log('\n⚠️  VẪN CÒN LỖI! Một số coins vẫn hiển thị percentage không đúng.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi test:', error.message);
  }
}

// Test individual ticker API
async function testIndividualTickers() {
  console.log('\n\n🔍 KIỂM TRA API TICKER RIÊNG LẺ');
  console.log('=================================\n');

  for (const [coin, symbol] of Object.entries(COIN_PAIRS)) {
    try {
      const response = await fetch(`http://localhost:3000/api/ticker?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        console.log(`❌ ${coin}: API Error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const percentage = data.percentage;
      const isValid = percentage !== null && percentage !== undefined && !isNaN(percentage) && percentage !== -100;
      
      const status = isValid ? '✅' : '❌';
      const color = percentage >= 0 ? '🟢' : '🔴';

      // Format safely
      const formattedPrice = data.last && !isNaN(data.last) ? data.last.toLocaleString() : 'N/A';
      const formattedPercentage = percentage && !isNaN(percentage) ? percentage.toFixed(4) : 'N/A';

      console.log(`${status} ${coin.padEnd(6)} | ${color} ${percentage >= 0 ? '+' : ''}${formattedPercentage}% | Price: $${formattedPrice}`);
      
    } catch (error) {
      console.log(`❌ ${coin}: ${error.message}`);
    }
  }
}

// Chạy tests
async function runAllTests() {
  await testPercentageChanges();
  await testIndividualTickers();
  
  console.log('\n✨ Test hoàn thành!');
}

runAllTests().catch(console.error);
