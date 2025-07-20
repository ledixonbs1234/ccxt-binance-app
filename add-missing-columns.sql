-- Add missing columns to existing trailing_stops table
-- Run this in Supabase SQL Editor

-- Add activationPrice column
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS activationPrice NUMERIC;

-- Add other missing columns that might be needed
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS stateKey TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS entryPrice NUMERIC;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS highestPrice NUMERIC;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS trailingPercent NUMERIC;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS symbol TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS side TEXT DEFAULT 'sell';
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_activation';
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS strategy TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS triggerPrice NUMERIC;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS triggeredAt BIGINT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS buyOrderId TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS sellOrderId TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS errorMessage TEXT;
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE trailing_stops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints
ALTER TABLE trailing_stops DROP CONSTRAINT IF EXISTS trailing_stops_side_check;
ALTER TABLE trailing_stops ADD CONSTRAINT trailing_stops_side_check CHECK (side IN ('buy', 'sell'));

ALTER TABLE trailing_stops DROP CONSTRAINT IF EXISTS trailing_stops_status_check;
ALTER TABLE trailing_stops ADD CONSTRAINT trailing_stops_status_check CHECK (status IN ('pending_activation', 'active', 'triggered', 'error', 'cancelled'));

-- Make stateKey unique if it's not already
ALTER TABLE trailing_stops DROP CONSTRAINT IF EXISTS trailing_stops_stateKey_key;
ALTER TABLE trailing_stops ADD CONSTRAINT trailing_stops_stateKey_key UNIQUE (stateKey);

-- Add NOT NULL constraints for required columns
ALTER TABLE trailing_stops ALTER COLUMN stateKey SET NOT NULL;
ALTER TABLE trailing_stops ALTER COLUMN symbol SET NOT NULL;
ALTER TABLE trailing_stops ALTER COLUMN entryPrice SET NOT NULL;
ALTER TABLE trailing_stops ALTER COLUMN highestPrice SET NOT NULL;
ALTER TABLE trailing_stops ALTER COLUMN trailingPercent SET NOT NULL;
ALTER TABLE trailing_stops ALTER COLUMN quantity SET NOT NULL;
