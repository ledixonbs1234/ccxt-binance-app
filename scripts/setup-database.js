#!/usr/bin/env node

/**
 * Database Setup Script
 * Sets up database schema, indexes, and initial data for CCXT Binance Trading App
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Try alternative method if rpc doesn't work
      const { error: directError } = await supabase.from('_').select('*').limit(0);
      if (directError && directError.message.includes('relation "_" does not exist')) {
        console.log(`⚠️  Cannot execute SQL directly. Please run this SQL manually in Supabase SQL Editor:`);
        console.log('---');
        console.log(sql);
        console.log('---');
        return;
      }
      throw error;
    }
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    console.log(`📝 Please run this SQL manually in Supabase SQL Editor:`);
    console.log('---');
    console.log(sql);
    console.log('---');
  }
}

async function setupDatabase() {
  console.log('🚀 Starting database setup for CCXT Binance Trading App...\n');

  // Read the main schema file
  const schemaPath = path.join(__dirname, '..', 'sql', 'database-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = schemaSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;

    // Determine statement type for better logging
    let description = `Statement ${i + 1}`;
    if (statement.toUpperCase().includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE[^(]*(\w+)/i);
      description = `Creating table: ${match ? match[1] : 'unknown'}`;
    } else if (statement.toUpperCase().includes('CREATE INDEX')) {
      const match = statement.match(/CREATE INDEX[^(]*(\w+)/i);
      description = `Creating index: ${match ? match[1] : 'unknown'}`;
    } else if (statement.toUpperCase().includes('CREATE FUNCTION')) {
      const match = statement.match(/CREATE[^(]*FUNCTION[^(]*(\w+)/i);
      description = `Creating function: ${match ? match[1] : 'unknown'}`;
    } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
      const match = statement.match(/CREATE TRIGGER[^(]*(\w+)/i);
      description = `Creating trigger: ${match ? match[1] : 'unknown'}`;
    } else if (statement.toUpperCase().includes('ALTER TABLE')) {
      description = 'Setting up Row Level Security';
    } else if (statement.toUpperCase().includes('CREATE POLICY')) {
      description = 'Creating RLS policy';
    }

    await executeSQL(statement + ';', description);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 Database setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify all tables and indexes were created in Supabase dashboard');
  console.log('2. Test the database performance monitoring: /database-performance-demo');
  console.log('3. Run the application and check for any database-related errors');
  console.log('4. Monitor query performance using the performance dashboard');
}

async function checkDatabaseHealth() {
  console.log('🔍 Checking database health...\n');

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.log('⚠️  Database connection test failed:', connectionError.message);
      console.log('This might be normal if tables don\'t exist yet.');
    } else {
      console.log('✅ Database connection successful');
    }

    // Check if main tables exist
    const tables = ['orders', 'enhanced_trailing_positions', 'trailing_stops', 'performance_analytics'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--health-check') || args.includes('-h')) {
    await checkDatabaseHealth();
  } else if (args.includes('--setup') || args.includes('-s') || args.length === 0) {
    await setupDatabase();
  } else {
    console.log('Usage:');
    console.log('  node setup-database.js --setup     # Setup database schema and indexes');
    console.log('  node setup-database.js --health    # Check database health');
    console.log('  node setup-database.js             # Default: setup database');
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
