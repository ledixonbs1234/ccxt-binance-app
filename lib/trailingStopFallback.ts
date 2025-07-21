import { supabase } from './supabase';
import ccxt from 'ccxt';

// Fallback system for when Redis/BullMQ is not available
// Uses database polling with intervals

interface FallbackJob {
  stateKey: string;
  intervalId: NodeJS.Timeout;
  isActive: boolean;
}

const activeFallbackJobs = new Map<string, FallbackJob>();
const POLLING_INTERVAL = 3000; // 3 seconds

// Initialize Binance exchange for price monitoring
const exchange = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  sandbox: process.env.NODE_ENV !== 'production',
  enableRateLimit: true,
});

// Start fallback monitoring for a trailing stop
export const startFallbackMonitoring = async (stateKey: string) => {
  if (activeFallbackJobs.has(stateKey)) {
    console.log(`[TrailingStopFallback] Already monitoring ${stateKey}`);
    return;
  }

  console.log(`[TrailingStopFallback] Starting fallback monitoring for ${stateKey}`);

  const intervalId = setInterval(async () => {
    try {
      await processFallbackJob(stateKey);
    } catch (error) {
      console.error(`[TrailingStopFallback] Error processing ${stateKey}:`, error);
    }
  }, POLLING_INTERVAL);

  activeFallbackJobs.set(stateKey, {
    stateKey,
    intervalId,
    isActive: true
  });
};

// Stop fallback monitoring for a trailing stop
export const stopFallbackMonitoring = (stateKey: string) => {
  const job = activeFallbackJobs.get(stateKey);
  if (job) {
    clearInterval(job.intervalId);
    activeFallbackJobs.delete(stateKey);
    console.log(`[TrailingStopFallback] Stopped monitoring ${stateKey}`);
  }
};

// Process a single trailing stop (similar to BullMQ worker logic)
const processFallbackJob = async (stateKey: string) => {
  try {
    // Check if supabase is available
    if (!supabase) {
      console.warn(`[TrailingStopFallback] Database not available for ${stateKey}`);
      return;
    }

    // Get current state from database
    const { data: currentState, error } = await supabase!
      .from('trailing_stops')
      .select('*')
      .eq('statekey', stateKey)
      .single();

    if (error) {
      console.error(`[TrailingStopFallback] Error fetching state for ${stateKey}:`, error);
      return;
    }

    if (!currentState || currentState.status === 'triggered' || currentState.status === 'error' || currentState.status === 'cancelled') {
      // Position closed or errored, stop monitoring
      stopFallbackMonitoring(stateKey);
      return;
    }

    // Get current price from Binance
    const ticker = await exchange.fetchTicker(currentState.symbol);
    const currentPrice = ticker.last || ticker.close;

    if (!currentPrice) {
      throw new Error(`Unable to fetch price for ${currentState.symbol}`);
    }

    let updatedState = { ...currentState };
    let shouldTrigger = false;

    // Check activation for pending positions
    if (currentState.status === 'pending_activation' && currentState.activationPrice) {
      const shouldActivate = currentState.side === 'sell' 
        ? currentPrice >= currentState.activationPrice
        : currentPrice <= currentState.activationPrice;
        
      if (shouldActivate) {
        updatedState.status = 'active';
        updatedState.highestPrice = currentPrice;
        console.log(`[TrailingStopFallback] Position ${stateKey} activated at ${currentPrice}`);
      }
    }

    // Process active positions
    if (updatedState.status === 'active') {
      const side = currentState.side || 'sell';
      
      // Update highest/lowest price
      if (side === 'sell') {
        if (currentPrice > updatedState.highestPrice) {
          updatedState.highestPrice = currentPrice;
          // Calculate new trigger price
          updatedState.triggerPrice = currentPrice * (1 - currentState.trailingPercent / 100);
        }
        // Check if triggered
        shouldTrigger = currentPrice <= updatedState.triggerPrice;
      } else {
        if (currentPrice < updatedState.highestPrice) {
          updatedState.highestPrice = currentPrice;
          // Calculate new trigger price
          updatedState.triggerPrice = currentPrice * (1 + currentState.trailingPercent / 100);
        }
        // Check if triggered
        shouldTrigger = currentPrice >= updatedState.triggerPrice;
      }

      if (shouldTrigger) {
        updatedState.status = 'triggered';
        updatedState.triggeredAt = Date.now();
        console.log(`[TrailingStopFallback] Position ${stateKey} triggered at ${currentPrice}`);
        
        // Stop monitoring since position is closed
        stopFallbackMonitoring(stateKey);
      }
    }

    // Update state in database (convert to lowercase column names)
    const { error: updateError } = await supabase!
      .from('trailing_stops')
      .update({
        status: updatedState.status,
        highestprice: updatedState.highestPrice,
        triggerprice: updatedState.triggerPrice,
        triggeredat: updatedState.triggeredAt,
        updated_at: new Date().toISOString()
      })
      .eq('statekey', stateKey);

    if (updateError) {
      console.error(`[TrailingStopFallback] Error updating state for ${stateKey}:`, updateError);
    }

  } catch (error) {
    console.error(`[TrailingStopFallback] Error processing ${stateKey}:`, error);
    
    // Update error status in database
    if (supabase) {
      await supabase!
        .from('trailing_stops')
        .update({
          status: 'error',
        errormessage: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('statekey', stateKey);
    }

    // Stop monitoring on error
    stopFallbackMonitoring(stateKey);
  }
};

// Initialize fallback system by restoring active positions
export const initializeFallbackSystem = async () => {
  try {
    console.log('[TrailingStopFallback] Initializing fallback monitoring system...');

    if (!supabase) {
      console.warn('[TrailingStopFallback] Database not available for initialization');
      return;
    }

    // Get active trailing stops from database
    const { data: activeStops, error } = await supabase!
      .from('trailing_stops')
      .select('*')
      .in('status', ['pending_activation', 'active']);

    if (error) {
      console.error('[TrailingStopFallback] Error fetching active stops:', error);
      return;
    }

    if (activeStops && activeStops.length > 0) {
      console.log(`[TrailingStopFallback] Restoring ${activeStops.length} active trailing stops`);
      
      for (const stop of activeStops) {
        await startFallbackMonitoring(stop.stateKey);
      }
    }
    
    console.log('[TrailingStopFallback] Fallback system initialized successfully');
  } catch (error) {
    console.error('[TrailingStopFallback] Error initializing fallback system:', error);
    throw error;
  }
};

// Get fallback system statistics
export const getFallbackStats = () => {
  return {
    activeJobs: activeFallbackJobs.size,
    pollingInterval: POLLING_INTERVAL,
    jobs: Array.from(activeFallbackJobs.keys())
  };
};

// Shutdown fallback system
export const shutdownFallbackSystem = () => {
  console.log('[TrailingStopFallback] Shutting down fallback system...');
  
  for (const [, job] of activeFallbackJobs) {
    clearInterval(job.intervalId);
  }
  
  activeFallbackJobs.clear();
  console.log('[TrailingStopFallback] Fallback system shut down successfully');
};
