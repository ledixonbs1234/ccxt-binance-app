-- Create a new trailing_stops table with correct structure
-- Run this in Supabase SQL Editor

-- First, rename the old table as backup
ALTER TABLE trailing_stops RENAME TO trailing_stops_backup;

-- Create new table with correct structure
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trailing_stops_updated_at BEFORE UPDATE ON trailing_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: The old table is now renamed to trailing_stops_backup
-- You can drop it later if everything works: DROP TABLE trailing_stops_backup;
