-- Inspect actual table structure
-- Run this in Supabase SQL Editor to see what columns actually exist

-- Get column information for trailing_stops table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trailing_stops' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
