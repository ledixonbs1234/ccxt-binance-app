import { supabase } from './supabase';
import {
  addTrailingStopToQueue,
  removeTrailingStopFromQueue,
  initializeTrailingStopQueue
} from './trailingStopQueue';

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
        // 1. Upsert state to Supabase
        const { data, error } = await supabase
            .from('trailing_stops')
            .upsert({
                ...state,
                stateKey: key,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'stateKey'
            })
            .select()
            .single();

        if (error) {
            console.error(`[TrailingStopState] Error upserting state for ${key}:`, error);
            throw error;
        }

        // 2. Add to BullMQ queue for monitoring (only for active/pending states)
        if (state.status === 'active' || state.status === 'pending_activation') {
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
        const { error } = await supabase
            .from('trailing_stops')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('stateKey', key);

        if (error) {
            console.error(`[TrailingStopState] Error cancelling trailing stop ${key}:`, error);
            throw error;
        }

        console.log(`[TrailingStopState] Successfully cancelled trailing stop ${key}`);
    } catch (error) {
        console.error(`[TrailingStopState] Error removing trailing stop ${key}:`, error);
        throw error;
    }
};
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
        return data || [];
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
            trailingStopState.checkInterval = setInterval(() => {
                // Add your logic to check and update the trailing stop here
                // console.log(`[${trailingStopState.stateKey}] Checking trailing stop...`);
            }, 1000); // Example interval of 1 second
        }
    }
};

export const initializeTrailingStopsTable = async () => {
    try {
        const { error } = await supabase.rpc('check_or_create_trailing_stops_table');
        if (error) {
            console.error('Error initializing trailing_stops table:', error.message);
        } else {
            console.log('Trailing stops table initialized successfully.');
        }
    } catch (error) {
        console.error('Unexpected error while initializing trailing_stops table:', error);
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