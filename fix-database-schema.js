#!/usr/bin/env node

/**
 * Fix Database Schema - Thêm cột activationPrice vào bảng trailing_stops
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

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema for trailing_stops table...\n');

  try {
    // Kiểm tra cấu trúc hiện tại của bảng
    console.log('Step 1: Checking current table structure...');
    
    // Thử insert một record đơn giản để xem cấu trúc hiện tại
    const testRecord = {
      stateKey: 'structure-test-' + Date.now(),
      symbol: 'BTCUSDT',
      entryPrice: 50000,
      highestPrice: 50000,
      trailingPercent: 5,
      quantity: 0.001,
      side: 'sell',
      status: 'pending_activation'
    };

    const { data: testData, error: testError } = await supabase
      .from('trailing_stops')
      .insert(testRecord)
      .select();

    if (testError) {
      console.log('❌ Basic insert failed:', testError.message);
      return;
    }

    console.log('✅ Basic structure works');
    
    // Xóa test record
    await supabase
      .from('trailing_stops')
      .delete()
      .eq('stateKey', testRecord.stateKey);

    // Bây giờ thử thêm activationPrice
    console.log('\nStep 2: Testing activationPrice column...');
    
    const testWithActivation = {
      stateKey: 'activation-test-' + Date.now(),
      symbol: 'BTCUSDT',
      entryPrice: 50000,
      highestPrice: 50000,
      trailingPercent: 5,
      quantity: 0.001,
      side: 'sell',
      status: 'pending_activation',
      activationPrice: 51000
    };

    const { data: activationData, error: activationError } = await supabase
      .from('trailing_stops')
      .insert(testWithActivation)
      .select();

    if (activationError && activationError.code === 'PGRST204') {
      console.log('❌ activationPrice column missing, as expected');
      console.log('\nStep 3: Manual schema update required...');
      
      console.log('\n📋 MANUAL FIX REQUIRED:');
      console.log('Please run the following SQL commands in your Supabase Dashboard SQL Editor:');
      console.log('\n--- SQL Commands to Run ---');
      console.log('-- Add missing columns to trailing_stops table');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS activationPrice NUMERIC;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS side TEXT DEFAULT \'sell\' CHECK (side IN (\'buy\', \'sell\'));');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS strategy TEXT;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS triggerPrice NUMERIC;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS triggeredAt BIGINT;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS buyOrderId TEXT;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS sellOrderId TEXT;');
      console.log('ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS errorMessage TEXT;');
      console.log('');
      console.log('-- Update status constraint to include cancelled');
      console.log('ALTER TABLE trailing_stops DROP CONSTRAINT IF EXISTS trailing_stops_status_check;');
      console.log('ALTER TABLE trailing_stops ADD CONSTRAINT trailing_stops_status_check');
      console.log('  CHECK (status IN (\'pending_activation\', \'active\', \'triggered\', \'error\', \'cancelled\'));');
      console.log('\n--- End SQL Commands ---\n');
      
      console.log('🔗 How to run these commands:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL commands above');
      console.log('4. Click "Run" to execute');
      console.log('5. Run this script again to verify the fix');
      
      return;
    }

    if (activationError) {
      console.log('❌ Unexpected error:', activationError.message);
      return;
    }

    console.log('✅ activationPrice column works correctly!');
    console.log('Schema is already up to date.');
    
    // Cleanup
    await supabase
      .from('trailing_stops')
      .delete()
      .eq('stateKey', testWithActivation.stateKey);

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixDatabaseSchema();
