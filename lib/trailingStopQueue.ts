import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { supabase } from './supabase';
import { TrailingStopState } from './trailingStopState';
import ccxt from 'ccxt';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis connection
const redis = new Redis(redisConfig);

// Create BullMQ queue for trailing stop monitoring
export const trailingStopQueue = new Queue('trailing-stop-monitor', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job data interface
interface TrailingStopJobData {
  stateKey: string;
  symbol: string;
  entryPrice: number;
  trailingPercent: number;
  quantity: number;
  side: 'buy' | 'sell';
  strategy?: string;
  activationPrice?: number;
  status: 'pending_activation' | 'active' | 'triggered' | 'error';
}

// Initialize Binance exchange for price monitoring
const exchange = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  sandbox: process.env.NODE_ENV !== 'production',
  enableRateLimit: true,
});

// Worker to process trailing stop monitoring jobs
export const trailingStopWorker = new Worker(
  'trailing-stop-monitor',
  async (job: Job<TrailingStopJobData>) => {
    const { stateKey, symbol, entryPrice, trailingPercent, quantity, side, activationPrice, status } = job.data;
    
    try {
      // Get current price from Binance
      const ticker = await exchange.fetchTicker(symbol);
      const currentPrice = ticker.last || ticker.close;
      
      if (!currentPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }

      // Get current state from Supabase
      const { data: currentState, error } = await supabase
        .from('trailing_stops')
        .select('*')
        .eq('stateKey', stateKey)
        .single();

      if (error) {
        console.error(`[TrailingStopWorker] Error fetching state for ${stateKey}:`, error);
        return;
      }

      if (!currentState || currentState.status === 'triggered' || currentState.status === 'error') {
        // Position already closed or errored, remove from queue
        await trailingStopQueue.removeRepeatableByKey(stateKey);
        return;
      }

      let updatedState = { ...currentState };
      let shouldTrigger = false;

      // Check activation for pending positions
      if (currentState.status === 'pending_activation' && activationPrice) {
        const shouldActivate = side === 'sell' 
          ? currentPrice >= activationPrice
          : currentPrice <= activationPrice;
          
        if (shouldActivate) {
          updatedState.status = 'active';
          updatedState.highestPrice = currentPrice;
          console.log(`[TrailingStopWorker] Position ${stateKey} activated at ${currentPrice}`);
        }
      }

      // Process active positions
      if (updatedState.status === 'active') {
        // Update highest/lowest price
        if (side === 'sell') {
          if (currentPrice > updatedState.highestPrice) {
            updatedState.highestPrice = currentPrice;
            // Calculate new trigger price
            updatedState.triggerPrice = currentPrice * (1 - trailingPercent / 100);
          }
          // Check if triggered
          shouldTrigger = currentPrice <= updatedState.triggerPrice;
        } else {
          if (currentPrice < updatedState.highestPrice) {
            updatedState.highestPrice = currentPrice;
            // Calculate new trigger price
            updatedState.triggerPrice = currentPrice * (1 + trailingPercent / 100);
          }
          // Check if triggered
          shouldTrigger = currentPrice >= updatedState.triggerPrice;
        }

        if (shouldTrigger) {
          updatedState.status = 'triggered';
          updatedState.triggeredAt = Date.now();
          console.log(`[TrailingStopWorker] Position ${stateKey} triggered at ${currentPrice}`);
          
          // Remove from queue since position is closed
          await trailingStopQueue.removeRepeatableByKey(stateKey);
        }
      }

      // Update state in Supabase
      const { error: updateError } = await supabase
        .from('trailing_stops')
        .update({
          ...updatedState,
          updated_at: new Date().toISOString()
        })
        .eq('stateKey', stateKey);

      if (updateError) {
        console.error(`[TrailingStopWorker] Error updating state for ${stateKey}:`, updateError);
      }

      return {
        stateKey,
        currentPrice,
        status: updatedState.status,
        triggered: shouldTrigger
      };

    } catch (error) {
      console.error(`[TrailingStopWorker] Error processing ${stateKey}:`, error);
      
      // Update error status in database
      await supabase
        .from('trailing_stops')
        .update({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('stateKey', stateKey);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process up to 10 jobs concurrently
  }
);

// Add a new trailing stop to the queue
export const addTrailingStopToQueue = async (jobData: TrailingStopJobData) => {
  try {
    // Add repeating job that runs every 2 seconds
    await trailingStopQueue.add(
      'monitor-trailing-stop',
      jobData,
      {
        repeat: {
          every: 2000, // Check every 2 seconds
        },
        jobId: jobData.stateKey, // Use stateKey as job ID for easy removal
      }
    );
    
    console.log(`[TrailingStopQueue] Added ${jobData.stateKey} to monitoring queue`);
  } catch (error) {
    console.error(`[TrailingStopQueue] Error adding ${jobData.stateKey} to queue:`, error);
    throw error;
  }
};

// Remove a trailing stop from the queue
export const removeTrailingStopFromQueue = async (stateKey: string) => {
  try {
    await trailingStopQueue.removeRepeatableByKey(stateKey);
    console.log(`[TrailingStopQueue] Removed ${stateKey} from monitoring queue`);
  } catch (error) {
    console.error(`[TrailingStopQueue] Error removing ${stateKey} from queue:`, error);
    throw error;
  }
};

// Get queue statistics
export const getQueueStats = async () => {
  try {
    const waiting = await trailingStopQueue.getWaiting();
    const active = await trailingStopQueue.getActive();
    const completed = await trailingStopQueue.getCompleted();
    const failed = await trailingStopQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length
    };
  } catch (error) {
    console.error('[TrailingStopQueue] Error getting queue stats:', error);
    return null;
  }
};

// Initialize queue and restore active positions
export const initializeTrailingStopQueue = async () => {
  try {
    console.log('[TrailingStopQueue] Initializing queue system...');
    
    // Clear any existing jobs to prevent duplicates
    await trailingStopQueue.obliterate({ force: true });
    
    // Restore active trailing stops from database
    const { data: activeStops, error } = await supabase
      .from('trailing_stops')
      .select('*')
      .in('status', ['pending_activation', 'active']);

    if (error) {
      console.error('[TrailingStopQueue] Error fetching active stops:', error);
      return;
    }

    if (activeStops && activeStops.length > 0) {
      console.log(`[TrailingStopQueue] Restoring ${activeStops.length} active trailing stops`);
      
      for (const stop of activeStops) {
        const jobData: TrailingStopJobData = {
          stateKey: stop.stateKey,
          symbol: stop.symbol,
          entryPrice: stop.entryPrice,
          trailingPercent: stop.trailingPercent,
          quantity: stop.quantity,
          side: stop.side || 'sell',
          activationPrice: stop.activationPrice,
          status: stop.status
        };
        
        await addTrailingStopToQueue(jobData);
      }
    }
    
    console.log('[TrailingStopQueue] Queue system initialized successfully');
  } catch (error) {
    console.error('[TrailingStopQueue] Error initializing queue:', error);
    throw error;
  }
};

// Graceful shutdown
export const shutdownTrailingStopQueue = async () => {
  try {
    console.log('[TrailingStopQueue] Shutting down queue system...');
    await trailingStopWorker.close();
    await trailingStopQueue.close();
    await redis.disconnect();
    console.log('[TrailingStopQueue] Queue system shut down successfully');
  } catch (error) {
    console.error('[TrailingStopQueue] Error during shutdown:', error);
  }
};
