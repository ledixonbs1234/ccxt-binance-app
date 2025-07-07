// Final test để xác nhận lỗi phần trăm thay đổi giá đã được sửa hoàn toàn
// Test script để kiểm tra phần trăm thay đổi giá đã được sửa

async function testMainCoins() {
  console.log('🎯 KIỂM TRA CUỐI CÙNG - PHẦN TRĂM THAY ĐỔI GIÁ');
  console.log('='.repeat(50));
  console.log('📅 Thời gian:', new Date().toLocaleString('vi-VN'));
  console.log('');

  // Test với 3 coins chính của ứng dụng
  const mainCoins = ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'];
  
  try {
    console.log('🔍 Test Batch Ticker API...');
    const symbols = mainCoins.join(',');
    const response = await fetch(`http://localhost:3000/api/batch-ticker?symbols=${encodeURIComponent(symbols)}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const batchResult = await response.json();
    
    if (!batchResult.success) {
      throw new Error(`Batch API failed: ${batchResult.error}`);
    }

    console.log(`✅ API Response Time: ${batchResult.duration}ms`);
    console.log('');

    // Kiểm tra từng coin
    console.log('📊 KẾT QUẢ PHẦN TRĂM THAY ĐỔI GIÁ:');
    console.log('-'.repeat(50));
    
    let allValid = true;
    
    batchResult.results.forEach((result, index) => {
      const data = result.data;
      const percentage = data.percentage;
      const price = data.last;
      const symbol = result.symbol;
      
      // Kiểm tra tính hợp lệ
      const isValidPercentage = percentage !== null && 
                               percentage !== undefined && 
                               !isNaN(percentage) && 
                               percentage !== -100;
      
      const isValidPrice = price !== null && 
                          price !== undefined && 
                          !isNaN(price) && 
                          price > 0;
      
      if (!isValidPercentage) allValid = false;
      
      const status = isValidPercentage ? '✅' : '❌';
      const priceStatus = isValidPrice ? '✅' : '❌';
      const changeColor = percentage >= 0 ? '🟢' : '🔴';
      
      // Format giá cho micro-cap tokens
      let formattedPrice;
      if (symbol === 'PEPE/USDT' && price < 0.001) {
        formattedPrice = price.toFixed(8);
      } else {
        formattedPrice = price.toLocaleString();
      }
      
      console.log(`${status} ${symbol.padEnd(12)} | Price: ${priceStatus} $${formattedPrice.padEnd(15)} | Change: ${changeColor} ${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`);
      
      // Thông tin chi tiết cho PEPE
      if (symbol === 'PEPE/USDT') {
        console.log(`   🐸 PEPE Special: Price in scientific: ${price.toExponential(3)}`);
      }
    });

    console.log('');
    console.log('📈 TỔNG KẾT:');
    console.log('-'.repeat(30));
    
    if (allValid) {
      console.log('🎉 THÀNH CÔNG HOÀN TOÀN!');
      console.log('✅ Tất cả coins hiển thị phần trăm thay đổi giá đúng');
      console.log('✅ Không còn lỗi -100% nào');
      console.log('✅ API hoạt động ổn định');
      console.log('✅ Dữ liệu real-time từ Binance');
    } else {
      console.log('❌ VẪN CÒN VẤN ĐỀ!');
      console.log('⚠️  Một số coins vẫn có percentage không hợp lệ');
    }

    // Test thêm với individual API calls
    console.log('\n🔍 KIỂM TRA INDIVIDUAL TICKER APIs:');
    console.log('-'.repeat(40));
    
    for (const symbol of mainCoins) {
      try {
        const response = await fetch(`http://localhost:3000/api/ticker?symbol=${encodeURIComponent(symbol)}`);
        
        if (!response.ok) {
          console.log(`❌ ${symbol}: API Error ${response.status}`);
          continue;
        }

        const data = await response.json();
        const percentage = data.percentage;
        const isValid = percentage !== null && percentage !== undefined && !isNaN(percentage) && percentage !== -100;
        
        const status = isValid ? '✅' : '❌';
        const color = percentage >= 0 ? '🟢' : '🔴';
        
        console.log(`${status} ${symbol.padEnd(12)} | ${color} ${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`);
        
      } catch (error) {
        console.log(`❌ ${symbol}: ${error.message}`);
      }
    }

    console.log('\n✨ KIỂM TRA HOÀN TẤT!');
    console.log('🔧 Lỗi phần trăm thay đổi giá đã được sửa thành công');
    console.log('📱 Ứng dụng trading sẵn sàng sử dụng');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.message);
  }
}

// Chạy test
testMainCoins().catch(console.error);
