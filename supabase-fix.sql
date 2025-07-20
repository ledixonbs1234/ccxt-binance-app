-- CCXT Binance Trading App - Database Schema Fix
-- Copy and paste this entire content into Supabase SQL Editor

-- Drop existing trailing_stops table if it has wrong structure
DROP TABLE IF EXISTS trailing_stops CASCADE;

-- Create trailing_stops table with correct structure
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

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create enhanced_trailing_positions table
CREATE TABLE IF NOT EXISTS enhanced_trailing_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  stop_price DECIMAL(20, 8) NOT NULL,
  strategy VARCHAR(20) NOT NULL DEFAULT 'percentage',
  strategy_params JSONB NOT NULL DEFAULT '{}',
  max_loss_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
  position_size_method VARCHAR(20) DEFAULT 'fixed',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  max_profit DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0,
  chart_data JSONB DEFAULT '{}'
);

-- Create performance_analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  strategy VARCHAR(50) NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  avg_win DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  largest_win DECIMAL(20, 8) DEFAULT 0,
  largest_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  profit_factor DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trailing_stops_status ON trailing_stops(status);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_symbol ON trailing_stops(symbol);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_created_at ON trailing_stops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_state_key ON trailing_stops(stateKey);
CREATE INDEX IF NOT EXISTS idx_trailing_stops_active ON trailing_stops(isActive) WHERE isActive = true;

CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_positions_status ON enhanced_trailing_positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON enhanced_trailing_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_symbol_status ON enhanced_trailing_positions(symbol, status);

CREATE INDEX IF NOT EXISTS idx_analytics_symbol_timeframe ON performance_analytics(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON performance_analytics(created_at DESC);

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
