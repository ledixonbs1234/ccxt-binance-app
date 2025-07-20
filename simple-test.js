#!/usr/bin/env node

/**
 * Simple Test - Test database without relying on schema cache
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

async function simpleTest() {
  console.log('🧪 Running simple database test...\n');

  try {
    // Test 1: Basic table access
    console.log('Test 1: Basic table access...');
    const { data: basicData, error: basicError } = await supabase
      .from('trailing_stops')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic access failed:', basicError.message);
      return;
    }
    console.log('✅ Basic access works');

    // Test 2: Try to insert with minimal data first
    console.log('\nTest 2: Minimal insert test...');
    const minimalData = {
      id: Math.floor(Math.random() * 1000000) // Use random ID instead of stateKey
    };

    const { data: minimalResult, error: minimalError } = await supabase
      .from('trailing_stops')
      .insert(minimalData)
      .select();

    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
      console.log('This suggests the table structure is still not correct.');
    } else {
      console.log('✅ Minimal insert works');
      // Clean up
      await supabase
        .from('trailing_stops')
        .delete()
        .eq('id', minimalResult[0].id);
    }

    // Test 3: Check what columns actually exist by trying different approaches
    console.log('\nTest 3: Column detection...');
    
    // Try different column combinations
    const testColumns = [
      'id',
      'stateKey', 
      'activationPrice',
      'symbol',
      'entryPrice',
      'created_at'
    ];

    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('trailing_stops')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ Column '${column}': ${error.message}`);
        } else {
          console.log(`✅ Column '${column}': exists`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}': ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
simpleTest();
