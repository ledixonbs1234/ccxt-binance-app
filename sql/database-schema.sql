-- =====================================================
-- CCXT Binance Trading App - Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configure timezone
SET timezone = 'UTC';

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Orders table for local order management
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  stop_price DECIMAL(20, 8),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'filled', 'cancelled', 'rejected')),
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  average_price DECIMAL(20, 8),
  commission DECIMAL(20, 8) DEFAULT 0,
  commission_asset VARCHAR(10),
  external_order_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced Trailing Stop Positions
CREATE TABLE IF NOT EXISTS enhanced_trailing_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  stop_price DECIMAL(20, 8) NOT NULL,
  
  -- Strategy Configuration
  strategy VARCHAR(20) NOT NULL DEFAULT 'percentage',
  strategy_params JSONB NOT NULL DEFAULT '{}',
  
  -- Risk Management
  max_loss_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
  position_size_method VARCHAR(20) DEFAULT 'fixed',
  
  -- Status & Timestamps
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance Tracking
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  max_profit DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0,
  
  -- Chart Data
  chart_data JSONB DEFAULT '{}'
);

-- BullMQ Trailing Stops (existing table)
CREATE TABLE IF NOT EXISTS trailing_stops (
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

-- Performance Analytics
CREATE TABLE IF NOT EXISTS performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  strategy VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  
  -- Performance Metrics
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- P&L Metrics
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  avg_win DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0,
  
  -- Risk Metrics
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  sortino_ratio DECIMAL(10, 4) DEFAULT 0,
  calmar_ratio DECIMAL(10, 4) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Alerts
CREATE TABLE IF NOT EXISTS market_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  condition_type VARCHAR(20) NOT NULL,
  target_value DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8),
  
  -- Alert Configuration
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  trigger_count INTEGER DEFAULT 0,
  max_triggers INTEGER DEFAULT 1,
  
  -- Notification Settings
  notification_methods JSONB DEFAULT '["browser", "email"]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Trade History Cache (for performance)
CREATE TABLE IF NOT EXISTS trade_history_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  trade_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Order History Cache (for performance)
CREATE TABLE IF NOT EXISTS order_history_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  order_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_symbol_status ON orders(user_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON orders(external_order_id) WHERE external_order_id IS NOT NULL;

-- Enhanced trailing positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_user_symbol ON enhanced_trailing_positions(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON enhanced_trailing_positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON enhanced_trailing_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON enhanced_trailing_positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_symbol_status ON enhanced_trailing_positions(symbol, status);

-- Trailing stops indexes (BullMQ)
CREATE INDEX IF NOT EXISTS idx_trailing_stops_status ON trailing_stops(status);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_symbol ON trailing_stops(symbol);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_created_at ON trailing_stops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_state_key ON trailing_stops(stateKey);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_active ON trailing_stops(isActive) WHERE isActive = true;

-- Performance analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user_strategy ON performance_analytics(user_id, strategy);
CREATE INDEX IF NOT EXISTS idx_analytics_symbol_timeframe ON performance_analytics(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON performance_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_symbol ON performance_analytics(user_id, symbol);

-- Market alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON market_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol_active ON market_alerts(symbol, is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON market_alerts(is_triggered, triggered_at);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON market_alerts(expires_at) WHERE expires_at IS NOT NULL;

-- Cache tables indexes
CREATE INDEX IF NOT EXISTS idx_trade_cache_user_symbol ON trade_history_cache(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trade_cache_expires ON trade_history_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_cache_user_symbol ON order_history_cache(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_order_cache_expires ON order_history_cache(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_trailing_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own positions" ON enhanced_trailing_positions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own analytics" ON performance_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own alerts" ON market_alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own trade cache" ON trade_history_cache
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own order cache" ON order_history_cache
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON enhanced_trailing_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trailing_stops_updated_at BEFORE UPDATE ON trailing_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON performance_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM trade_history_cache WHERE expires_at < NOW();
    DELETE FROM order_history_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get database performance stats
CREATE OR REPLACE FUNCTION get_db_performance_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text,
    total_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname||'.'||tablename as table_name,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;
