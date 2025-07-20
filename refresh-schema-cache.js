#!/usr/bin/env node

/**
 * Refresh Schema Cache - Force Supabase to refresh schema cache
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create multiple client instances to force cache refresh
const supabase1 = createClient(supabaseUrl, supabaseKey);
const supabase2 = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  global: { headers: { 'Cache-Control': 'no-cache' } }
});

async function refreshSchemaCache() {
  console.log('🔄 Attempting to refresh Supabase schema cache...\n');

  try {
    // Method 1: Try to access table with different clients
    console.log('Method 1: Testing with different client configurations...');
    
    const clients = [supabase1, supabase2];
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      console.log(`Testing client ${i + 1}...`);
      
      try {
        const { data, error } = await client
          .from('trailing_stops')
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Client ${i + 1} error:`, error.message);
        } else {
          console.log(`✅ Client ${i + 1} works`);
        }
      } catch (err) {
        console.log(`❌ Client ${i + 1} exception:`, err.message);
      }
    }

    // Method 2: Try direct SQL query to refresh schema
    console.log('\nMethod 2: Attempting direct schema refresh...');
    
    try {
      // This might work if we have the right permissions
      const { data, error } = await supabase1.rpc('pg_notify', {
        channel: 'schema_cache_refresh',
        payload: 'refresh'
      });
      
      if (error) {
        console.log('❌ Direct refresh failed:', error.message);
      } else {
        console.log('✅ Direct refresh attempted');
      }
    } catch (err) {
      console.log('❌ Direct refresh exception:', err.message);
    }

    // Method 3: Test actual column access
    console.log('\nMethod 3: Testing column access...');
    
    const testRecord = {
      stateKey: 'cache-refresh-test-' + Date.now(),
      symbol: 'BTCUSDT',
      entryPrice: 50000,
      highestPrice: 50000,
      trailingPercent: 5,
      quantity: 0.001,
      side: 'sell',
      status: 'pending_activation',
      activationPrice: 51000
    };

    const { data: insertData, error: insertError } = await supabase1
      .from('trailing_stops')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert still failing:', insertError.message);
      console.log('Error code:', insertError.code);
      
      if (insertError.code === 'PGRST204') {
        console.log('\n🔧 SCHEMA CACHE ISSUE CONFIRMED');
        console.log('The schema cache needs more time to refresh or manual intervention.');
        console.log('\nPossible solutions:');
        console.log('1. Wait 5-10 minutes for Supabase to refresh cache automatically');
        console.log('2. Restart your Supabase project (if you have access)');
        console.log('3. Try the PostgREST schema cache refresh endpoint');
        console.log('4. Contact Supabase support if the issue persists');
        
        return false;
      }
    } else {
      console.log('✅ INSERT SUCCESSFUL! Schema cache has been refreshed.');
      console.log('Inserted data:', insertData[0]);
      
      // Clean up test data
      await supabase1
        .from('trailing_stops')
        .delete()
        .eq('stateKey', testRecord.stateKey);
      
      console.log('✅ Test data cleaned up');
      return true;
    }

  } catch (error) {
    console.error('❌ Refresh failed:', error.message);
    return false;
  }
}

// Run the refresh
refreshSchemaCache().then(success => {
  if (success) {
    console.log('\n🎉 Schema cache refresh successful!');
    console.log('You can now run: node test-database-schema.js');
  } else {
    console.log('\n⏳ Schema cache refresh may need more time.');
    console.log('Please wait a few minutes and try again.');
  }
});
