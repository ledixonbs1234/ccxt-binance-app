#!/usr/bin/env node

/**
 * Test Database Schema - Kiểm tra lỗi activationPrice column
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

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema for trailing_stops table...\n');

  try {
    // Test 1: Check if table exists
    console.log('Test 1: Checking if trailing_stops table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('trailing_stops')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      console.log('Error code:', tableError.code);
      return;
    }
    console.log('✅ Table exists and accessible\n');

    // Test 2: Try to insert with activationPrice
    console.log('Test 2: Testing activationPrice column...');
    const testData = {
      stateKey: 'test-schema-' + Date.now(),
      symbol: 'BTCUSDT',
      entryPrice: 50000,
      highestPrice: 50000,
      trailingPercent: 5,
      quantity: 0.001,
      side: 'sell',
      activationPrice: 51000,
      status: 'pending_activation'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trailing_stops')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('Error code:', insertError.code);
      console.log('Error details:', insertError.details);
      
      if (insertError.message.includes('activationPrice') || insertError.message.includes('column')) {
        console.log('\n🔧 SCHEMA ISSUE DETECTED!');
        console.log('The activationPrice column may not exist or have wrong type.');
        console.log('\nSuggested fix: Run this SQL in Supabase Dashboard:');
        console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS activationPrice NUMERIC;');
      }
      return;
    }

    console.log('✅ Insert successful with activationPrice');
    console.log('Inserted data:', insertData[0]);

    // Test 3: Try to update activationPrice
    console.log('\nTest 3: Testing activationPrice update...');
    const { data: updateData, error: updateError } = await supabase
      .from('trailing_stops')
      .update({ activationPrice: 52000 })
      .eq('stateKey', testData.stateKey)
      .select();

    if (updateError) {
      console.log('❌ Update error:', updateError.message);
      return;
    }

    console.log('✅ Update successful');
    console.log('Updated data:', updateData[0]);

    // Test 4: Try to select with activationPrice
    console.log('\nTest 4: Testing activationPrice select...');
    const { data: selectData, error: selectError } = await supabase
      .from('trailing_stops')
      .select('stateKey, symbol, activationPrice, status')
      .eq('stateKey', testData.stateKey);

    if (selectError) {
      console.log('❌ Select error:', selectError.message);
      return;
    }

    console.log('✅ Select successful');
    console.log('Selected data:', selectData[0]);

    // Cleanup
    console.log('\nCleaning up test data...');
    await supabase
      .from('trailing_stops')
      .delete()
      .eq('stateKey', testData.stateKey);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Database schema is correct.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDatabaseSchema();
