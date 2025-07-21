import { supabase } from './supabase';
import {
  addTrailingStopToQueue,
  removeTrailingStopFromQueue,
  initializeTrailingStopQueue
} from './trailingStopQueue';
import { startFallbackMonitoring } from './trailingStopFallback';

export interface TrailingStopState {
    stateKey: string;
    isActive: boolean;
    status: 'pending_activation' | 'active' | 'triggered' | 'error';
    activationPrice?: number;
    symbol: string;
    entryPrice: number;
    highestPrice: number;
    trailingPercent: number;
    quantity: number;
    side: 'buy' | 'sell';
    triggerPrice?: number;
    triggeredAt?: number;
    buyOrderId?: string;  // ID của lệnh mua ban đầu
    sellOrderId?: string; // ID của lệnh bán khi trigger
    errorMessage?: string;
    strategy?: string;
    // Removed checkInterval as it's now handled by BullMQ
}

// Deprecated: Keep for backward compatibility but no longer used for state management
export const activeTrailingStops = new Map<string, TrailingStopState>();

// Create or update trailing stop state with BullMQ queue integration
export const updateTrailingStopState = async (key: string, state: TrailingStopState) => {
    try {
        // 1. Upsert state to Supabase (using lowercase column names)
        if (!supabase) {
            console.warn(`[TrailingStopState] Database not available for ${key}`);
            return;
        }

        const { data, error } = await supabase
            .from('trailing_stops')
            .upsert({
                statekey: key,
                isactive: state.isActive,
                status: state.status,
                activationprice: state.activationPrice,
                symbol: state.symbol,
                entryprice: state.entryPrice,
                highestprice: state.highestPrice,
                trailingpercent: state.trailingPercent,
                quantity: state.quantity,
                side: state.side,
                triggerprice: state.triggerPrice,
                triggeredat: state.triggeredAt,
                buyorderid: state.buyOrderId,
                sellorderid: state.sellOrderId,
                errormessage: state.errorMessage,
                strategy: state.strategy,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'statekey'
            })
            .select()
            .single();

        if (error) {
            console.error(`[TrailingStopState] Error upserting state for ${key}:`, error);
            throw error;
        }

        // 2. Add to BullMQ queue for monitoring (only for active/pending states)
        if (state.status === 'active' || state.status === 'pending_activation') {
            try {
                await addTrailingStopToQueue({
                    stateKey: key,
                    symbol: state.symbol,
                    entryPrice: state.entryPrice,
                    trailingPercent: state.trailingPercent,
                    quantity: state.quantity,
                    side: state.side,
                    activationPrice: state.activationPrice,
                    status: state.status,
                    strategy: state.strategy
                });
            } catch (bullmqError) {
                console.warn('[TrailingStopState] BullMQ not available, using fallback monitoring:', bullmqError);
                await startFallbackMonitoring(key);
            }
        }

        // 3. Update deprecated Map for backward compatibility
        activeTrailingStops.set(key, state);

        console.log(`[TrailingStopState] Successfully updated state for ${key} with status: ${state.status}`);
        return data;
    } catch (error) {
        console.error(`[TrailingStopState] Error updating state for ${key}:`, error);
        throw error;
    }
};

export const removeTrailingStopState = async (key: string) => {
    try {
        // 1. Remove from BullMQ queue
        await removeTrailingStopFromQueue(key);

        // 2. Remove from deprecated Map
        activeTrailingStops.delete(key);

        // 3. Update status in database to 'cancelled' instead of deleting
        if (supabase) {
            const { error } = await supabase
                .from('trailing_stops')
                .update({
                    status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('statekey', key);

            if (error) {
                console.error(`[TrailingStopState] Error cancelling trailing stop ${key}:`, error);
                throw error;
            }
        }

        console.log(`[TrailingStopState] Successfully cancelled trailing stop ${key}`);
    } catch (error) {
        console.error(`[TrailingStopState] Error removing trailing stop ${key}:`, error);
        throw error;
    }
};
// Helper function to convert database row to TrailingStopState
const mapDbRowToState = (row: any): TrailingStopState => ({
    stateKey: row.statekey,
    isActive: row.isactive,
    status: row.status,
    activationPrice: row.activationprice,
    symbol: row.symbol,
    entryPrice: row.entryprice,
    highestPrice: row.highestprice,
    trailingPercent: row.trailingpercent,
    quantity: row.quantity,
    side: row.side,
    triggerPrice: row.triggerprice,
    triggeredAt: row.triggeredat,
    buyOrderId: row.buyorderid,
    sellOrderId: row.sellorderid,
    errorMessage: row.errormessage,
    strategy: row.strategy
});

// Lấy danh sách trailing stops cho client
export const getActiveSimulationsForClient = async () => {
    try {
        // Check if Supabase is available
        if (!supabase) {
            console.warn('[TrailingStop] Supabase not available, using in-memory data only');
            return Array.from(activeTrailingStops.values()).filter(
                state => state.status === 'pending_activation' || state.status === 'active'
            );
        }

        const { data, error } = await supabase
            .from('trailing_stops')
            .select('*')
            .in('status', ['pending_activation', 'active']);

        if (error) {
            console.error('[TrailingStop] Supabase error:', error.message);
            // Fallback to in-memory data
            console.warn('[TrailingStop] Falling back to in-memory storage');
            return Array.from(activeTrailingStops.values()).filter(
                state => state.status === 'pending_activation' || state.status === 'active'
            );
        }

        console.log(`[TrailingStop] Successfully loaded ${data?.length || 0} simulations from Supabase`);
        // Map database rows to TrailingStopState objects
        return (data || []).map(mapDbRowToState);
    } catch (error: any) {
        console.error('[TrailingStop] Error in getActiveSimulationsForClient:', error.message || error);
        // Fallback to in-memory data
        console.warn('[TrailingStop] Network error, falling back to in-memory storage');
        return Array.from(activeTrailingStops.values()).filter(
            state => state.status === 'pending_activation' || state.status === 'active'
        );
    }
};

// Alias cho chart integration
export const getActiveTrailingStops = getActiveSimulationsForClient;

// Khôi phục các trailing stops từ Supabase khi khởi động server
export const restoreTrailingStopsFromDB = async () => {
    if (!supabase) {
        console.warn('[TrailingStopState] Database not available for restoration');
        return;
    }

    const { data, error } = await supabase
        .from('trailing_stops')
        .select('*')
        .in('status', ['pending_activation', 'active']);

    if (error) {
        console.error('Error restoring trailing stops:', error);
        return;
    }

    console.log(`Restored ${data.length} trailing stops from database`);

    for (const stop of data) {
        const { state_key, ...rest } = stop;

        // Recreate the trailing stop state
        const trailingStopState: TrailingStopState = {
            stateKey: state_key,
            ...rest,
        };

        // Add to the activeTrailingStops map
        activeTrailingStops.set(state_key, trailingStopState);

        // Restart the interval if the status is active
        if (trailingStopState.status === 'active') {
            (trailingStopState as any).checkInterval = setInterval(() => {
                // Add your logic to check and update the trailing stop here
                // console.log(`[${trailingStopState.stateKey}] Checking trailing stop...`);
            }, 1000); // Example interval of 1 second
        }
    }
};

export const initializeTrailingStopsTable = async () => {
    try {
        // Check if table exists by trying to select from it
        if (!supabase) {
            console.warn('[TrailingStopState] Database not available for initialization');
            return;
        }

        const { error } = await supabase
            .from('trailing_stops')
            .select('*')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            // Table doesn't exist, show SQL to create it
            console.log('[TrailingStopState] Table trailing_stops does not exist, needs to be created manually in Supabase Dashboard.');
            console.log('[TrailingStopState] SQL to create table with BullMQ support:');
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

-- Create indexes for better performance
CREATE INDEX idx_trailing_stops_status ON trailing_stops(status);
CREATE INDEX idx_trailing_stops_symbol ON trailing_stops(symbol);
CREATE INDEX idx_trailing_stops_created_at ON trailing_stops(created_at);
            `);
        } else if (error) {
            console.error('[TrailingStopState] Error checking trailing_stops table:', error);
        } else {
            console.log('[TrailingStopState] Table trailing_stops already exists.');
        }
    } catch (error) {
        console.error('[TrailingStopState] Error initializing table:', error);
    }
};

// Initialize function to be called during application startup
export const initializeTrailingStops = async () => {
    try {
        console.log('[TrailingStopState] Initializing trailing stop system...');

        // Initialize database table
        await initializeTrailingStopsTable();

        // Initialize BullMQ queue system (this will also restore active positions)
        await initializeTrailingStopQueue();

        console.log('[TrailingStopState] Trailing stop system initialized successfully');
    } catch (error) {
        console.error('[TrailingStopState] Error initializing trailing stop system:', error);
        throw error;
    }
};