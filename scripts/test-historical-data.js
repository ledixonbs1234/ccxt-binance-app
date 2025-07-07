// Test Historical Data Service
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testHistoricalDataService() {
  console.log('🧪 Testing Historical Data Service...\n');

  try {
    // Test 1: Get available symbols
    console.log('1️⃣ Testing available symbols...');
    const symbolsResponse = await fetch(`${BASE_URL}/api/historical-data?action=symbols`);
    const symbolsData = await symbolsResponse.json();
    console.log('✅ Symbols:', symbolsData.symbols.slice(0, 5), '...');
    console.log('');

    // Test 2: Get available timeframes
    console.log('2️⃣ Testing available timeframes...');
    const timeframesResponse = await fetch(`${BASE_URL}/api/historical-data?action=timeframes`);
    const timeframesData = await timeframesResponse.json();
    console.log('✅ Timeframes:', timeframesData.timeframes);
    console.log('');

    // Test 3: Get recommended date ranges
    console.log('3️⃣ Testing recommended date ranges...');
    const rangesResponse = await fetch(`${BASE_URL}/api/historical-data?action=date-ranges`);
    const rangesData = await rangesResponse.json();
    console.log('✅ Date ranges:', rangesData.ranges.map(r => r.name));
    console.log('');

    // Test 4: Fetch small historical data sample
    console.log('4️⃣ Testing historical data fetch (small sample)...');
    const fetchRequest = {
      action: 'fetch',
      symbol: 'BTC/USDT',
      timeframe: '1h',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-02T00:00:00.000Z',
      limit: 24
    };

    const fetchResponse = await fetch(`${BASE_URL}/api/historical-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fetchRequest)
    });

    const fetchData = await fetchResponse.json();
    
    if (fetchData.success) {
      console.log('✅ Historical data fetched successfully!');
      console.log(`   📊 Candles: ${fetchData.data.count}`);
      console.log(`   ⏱️  Fetch time: ${fetchData.performance.fetchTimeMs}ms`);
      console.log(`   📈 Quality: ${fetchData.qualityReport.recommendation}`);
      console.log(`   🎯 Completeness: ${fetchData.qualityReport.dataCompleteness.toFixed(2)}%`);
      
      if (fetchData.data.candles.length > 0) {
        const firstCandle = fetchData.data.candles[0];
        const lastCandle = fetchData.data.candles[fetchData.data.candles.length - 1];
        console.log(`   📅 Time range: ${new Date(firstCandle.timestamp).toISOString()} to ${new Date(lastCandle.timestamp).toISOString()}`);
        console.log(`   💰 Price range: $${firstCandle.close.toFixed(2)} to $${lastCandle.close.toFixed(2)}`);
      }
    } else {
      console.log('❌ Failed to fetch historical data:', fetchData.message);
    }
    console.log('');

    // Test 5: Data validation
    if (fetchData.success && fetchData.data.candles.length > 0) {
      console.log('5️⃣ Testing data validation...');
      const validateRequest = {
        action: 'validate',
        data: fetchData.data.candles.slice(0, 10) // Test with first 10 candles
      };

      const validateResponse = await fetch(`${BASE_URL}/api/historical-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validateRequest)
      });

      const validateData = await validateResponse.json();
      
      if (validateData.success) {
        console.log('✅ Data validation completed!');
        console.log(`   📊 Quality: ${validateData.qualityReport.recommendation}`);
        console.log(`   🔍 Anomalies: ${validateData.qualityReport.anomalies.length}`);
        console.log(`   💡 Recommendations:`, validateData.recommendations);
      } else {
        console.log('❌ Data validation failed:', validateData.message);
      }
      console.log('');
    }

    // Test 6: Cache statistics
    console.log('6️⃣ Testing cache statistics...');
    const cacheResponse = await fetch(`${BASE_URL}/api/historical-data?action=cache-stats`);
    const cacheData = await cacheResponse.json();
    console.log('✅ Cache stats:', cacheData.stats);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testHistoricalDataService();
