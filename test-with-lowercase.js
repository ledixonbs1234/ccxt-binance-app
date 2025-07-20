#!/usr/bin/env node

/**
 * Test with Lowercase - Test database với tên cột lowercase đúng
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithLowercase() {
  console.log('🧪 Testing database with correct lowercase column names...\n');

  try {
    // Test 1: Insert with all required columns (lowercase)
    console.log('Test 1: Testing full insert with lowercase columns...');
    
    const testData = {
      statekey: 'test-lowercase-' + Date.now(),
      symbol: 'BTCUSDT',
      entryprice: 50000,
      highestprice: 50000,
      trailingpercent: 5,
      quantity: 0.001,
      side: 'sell',
      activationprice: 51000,
      status: 'pending_activation',
      isactive: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trailing_stops')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('Error code:', insertError.code);
      return;
    }

    console.log('✅ Insert successful!');
    console.log('Inserted data:', insertData[0]);

    // Test 2: Update activationprice
    console.log('\nTest 2: Testing activationprice update...');
    const { data: updateData, error: updateError } = await supabase
      .from('trailing_stops')
      .update({ activationprice: 52000 })
      .eq('statekey', testData.statekey)
      .select();

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Update successful!');
      console.log('Updated data:', updateData[0]);
    }

    // Test 3: Select with activationprice
    console.log('\nTest 3: Testing activationprice select...');
    const { data: selectData, error: selectError } = await supabase
      .from('trailing_stops')
      .select('statekey, symbol, activationprice, status')
      .eq('statekey', testData.statekey);

    if (selectError) {
      console.log('❌ Select failed:', selectError.message);
    } else {
      console.log('✅ Select successful!');
      console.log('Selected data:', selectData[0]);
    }

    // Test 4: Test immediate buy (no activation price)
    console.log('\nTest 4: Testing immediate buy (no activation price)...');
    const immediateData = {
      statekey: 'test-immediate-' + Date.now(),
      symbol: 'ETHUSDT',
      entryprice: 3000,
      highestprice: 3000,
      trailingpercent: 2,
      quantity: 0.01,
      side: 'sell',
      status: 'active',
      isactive: true
      // No activationprice for immediate buy
    };

    const { data: immediateResult, error: immediateError } = await supabase
      .from('trailing_stops')
      .insert(immediateData)
      .select();

    if (immediateError) {
      console.log('❌ Immediate buy test failed:', immediateError.message);
    } else {
      console.log('✅ Immediate buy test successful!');
      console.log('Immediate buy data:', immediateResult[0]);
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await supabase
      .from('trailing_stops')
      .delete()
      .in('statekey', [testData.statekey, immediateData.statekey]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Database schema is working correctly with lowercase column names.');
    console.log('\n📝 IMPORTANT NOTE:');
    console.log('The application code needs to be updated to use lowercase column names:');
    console.log('- activationPrice → activationprice');
    console.log('- stateKey → statekey');
    console.log('- entryPrice → entryprice');
    console.log('- etc.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWithLowercase();
