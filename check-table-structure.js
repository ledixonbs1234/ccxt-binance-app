#!/usr/bin/env node

/**
 * Check Table Structure - Kiểm tra cấu trúc bảng trailing_stops
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

async function checkTableStructure() {
  console.log('🔍 Checking table structure...\n');

  try {
    // Kiểm tra tất cả các bảng có sẵn
    console.log('Step 1: Checking available tables...');
    
    const tables = ['orders', 'enhanced_trailing_positions', 'trailing_stops', 'performance_analytics'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message} (Code: ${error.code})`);
        } else {
          console.log(`✅ Table '${table}': Accessible`);
          if (data && data.length > 0) {
            console.log(`   Sample columns:`, Object.keys(data[0]));
          } else {
            console.log(`   Table is empty`);
          }
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }

    console.log('\nStep 2: Detailed check for trailing_stops...');
    
    // Thử các cách khác nhau để kiểm tra bảng trailing_stops
    console.log('Trying basic select...');
    const { data: basicData, error: basicError } = await supabase
      .from('trailing_stops')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic select failed:', basicError.message);
      console.log('Error code:', basicError.code);
      
      if (basicError.code === 'PGRST116') {
        console.log('\n🔧 TABLE DOES NOT EXIST!');
        console.log('The trailing_stops table needs to be created.');
        console.log('\nSQL to create the table:');
        console.log(`
CREATE TABLE trailing_stops (
  id SERIAL PRIMARY KEY,
  stateKey TEXT UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'triggered', 'error', 'cancelled')),
  activationPrice NUMERIC,
  symbol TEXT NOT NULL,
  entryPrice NUMERIC NOT NULL,
  highestPrice NUMERIC NOT NULL,
  trailingPercent NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  side TEXT DEFAULT 'sell' CHECK (side IN ('buy', 'sell')),
  strategy TEXT,
  triggerPrice NUMERIC,
  triggeredAt BIGINT,
  buyOrderId TEXT,
  sellOrderId TEXT,
  errorMessage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trailing_stops_status ON trailing_stops(status);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_symbol ON trailing_stops(symbol);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_created_at ON trailing_stops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_state_key ON trailing_stops(stateKey);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_active ON trailing_stops(isActive) WHERE isActive = true;
        `);
      }
      return;
    }

    console.log('✅ Basic select works');
    console.log('Data:', basicData);

    // Thử insert một record đơn giản nhất có thể
    console.log('\nStep 3: Testing minimal insert...');
    const minimalRecord = {
      stateKey: 'minimal-test-' + Date.now()
    };

    const { data: minimalData, error: minimalError } = await supabase
      .from('trailing_stops')
      .insert(minimalRecord)
      .select();

    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
      console.log('This suggests the table has required columns that are missing.');
    } else {
      console.log('✅ Minimal insert works');
      // Cleanup
      await supabase
        .from('trailing_stops')
        .delete()
        .eq('stateKey', minimalRecord.stateKey);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTableStructure();
