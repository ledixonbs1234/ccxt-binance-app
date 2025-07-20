#!/usr/bin/env node

/**
 * Check Tables - Kiểm tra tình trạng các bảng sau khi chạy SQL
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

async function checkTables() {
  console.log('🔍 Checking table status after SQL execution...\n');

  try {
    // Check if backup table exists
    console.log('Step 1: Checking for backup table...');
    const { data: backupData, error: backupError } = await supabase
      .from('trailing_stops_backup')
      .select('*')
      .limit(1);
    
    if (backupError) {
      if (backupError.code === 'PGRST116') {
        console.log('❌ No backup table found - SQL may not have executed properly');
      } else {
        console.log('❌ Backup table error:', backupError.message);
      }
    } else {
      console.log('✅ Backup table exists');
    }

    // Check current trailing_stops table structure
    console.log('\nStep 2: Checking current trailing_stops table...');
    
    // Try to get table info using a different approach
    const testColumns = [
      'id',
      'statekey', // lowercase
      'stateKey', // camelCase  
      'activationprice', // lowercase
      'activationPrice', // camelCase
      'symbol',
      'entryprice', // lowercase
      'entryPrice', // camelCase
      'created_at'
    ];

    console.log('Testing column names (case sensitivity)...');
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('trailing_stops')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ '${column}': ${error.message}`);
        } else {
          console.log(`✅ '${column}': exists`);
        }
      } catch (err) {
        console.log(`❌ '${column}': ${err.message}`);
      }
    }

    // Try a direct insert to see what's actually required
    console.log('\nStep 3: Testing what columns are actually required...');
    
    const testRecord = {
      // Try with lowercase first
      statekey: 'test-' + Date.now(),
      symbol: 'BTCUSDT'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trailing_stops')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert with lowercase failed:', insertError.message);
      
      // Try with camelCase
      const testRecord2 = {
        stateKey: 'test-' + Date.now(),
        symbol: 'BTCUSDT'
      };

      const { data: insertData2, error: insertError2 } = await supabase
        .from('trailing_stops')
        .insert(testRecord2)
        .select();

      if (insertError2) {
        console.log('❌ Insert with camelCase failed:', insertError2.message);
        console.log('\n🔧 DIAGNOSIS:');
        console.log('The table structure is not what we expected.');
        console.log('The SQL execution may have failed or been incomplete.');
      } else {
        console.log('✅ Insert with camelCase works!');
        console.log('Data:', insertData2[0]);
        
        // Clean up
        await supabase
          .from('trailing_stops')
          .delete()
          .eq('stateKey', testRecord2.stateKey);
      }
    } else {
      console.log('✅ Insert with lowercase works!');
      console.log('Data:', insertData[0]);
      
      // Clean up
      await supabase
        .from('trailing_stops')
        .delete()
        .eq('statekey', testRecord.statekey);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTables();
