// Only import BullMQ on server-side to avoid client-side issues
let Queue: any, Worker: any, Job: any, Redis: any;

if (typeof window === 'undefined') {
  // Server-side imports
  const bullmq = require('bullmq');
  Queue = bullmq.Queue;
  Worker = bullmq.Worker;
  Job = bullmq.Job;
  Redis = require('ioredis').default;
}

import { supabase } from './supabase';
import { TrailingStopState } from './trailingStopState';
import ccxt from 'ccxt';

// Job data interface
interface TrailingStopJobData {
  stateKey: string;
  symbol: string;
  entryPrice: number;
  trailingPercent: number;
  quantity: number;
  side: 'buy' | 'sell';
  activationPrice?: number;
  status: string;
  strategy?: string;
}

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
};

// Global variables
let redis: typeof Redis | null = null;
let isRedisAvailable = false;
let trailingStopQueue: typeof Queue | null = null;
let trailingStopWorker: Worker | null = null;

// Initialize Redis connection
async function initializeRedis() {
  try {
    redis = new Redis(redisConfig);
    await redis.ping();
    isRedisAvailable = true;
    console.log('[TrailingStopQueue] Redis connection established');
    return true;
  } catch (error) {
    console.warn('[TrailingStopQueue] Redis not available, falling back to database-only mode:', error instanceof Error ? error.message : error);
    isRedisAvailable = false;
    // Properly disconnect and cleanup Redis instance
    if (redis) {
      try {
        await redis.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
      redis = null;
    }
    return false;
  }
}

// Initialize BullMQ queue
async function initializeBullMQ() {
  if (!isRedisAvailable || !redis) {
    console.log('[TrailingStopQueue] Skipping BullMQ initialization - Redis not available');
    return false;
  }

  try {
    trailingStopQueue = new Queue('trailing-stop-monitor', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    console.log('[TrailingStopQueue] BullMQ queue initialized');
    return true;
  } catch (error) {
    console.error('[TrailingStopQueue] Failed to initialize BullMQ:', error);
    return false;
  }
}



// Initialize Binance exchange for price monitoring
const exchange = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  sandbox: process.env.NODE_ENV !== 'production',
  enableRateLimit: true,
});

// Worker initialization function
async function initializeWorker() {
  if (!isRedisAvailable || !redis || !trailingStopQueue) {
    console.log('[TrailingStopQueue] Skipping worker initialization - dependencies not available');
    return false;
  }

  try {
    trailingStopWorker = new Worker(
      'trailing-stop-monitor',
      async (job: any) => {
    const { stateKey, symbol, entryPrice, trailingPercent, quantity, side, activationPrice, status } = job.data;
    
    try {
      // Get current price from Binance
      const ticker = await exchange.fetchTicker(symbol);
      const currentPrice = ticker.last || ticker.close;
      
      if (!currentPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }

      // Get current state from Supabase
      if (!supabase) {
        console.warn(`[TrailingStopWorker] Database not available for ${stateKey}`);
        return;
      }

      const { data: currentState, error } = await supabase
        .from('trailing_stops')
        .select('*')
        .eq('statekey', stateKey)
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
          if (trailingStopQueue) {
            await trailingStopQueue.removeRepeatableByKey(stateKey);
          }
        }
      }

      // Update state in Supabase (convert to lowercase column names)
      const { error: updateError } = await supabase
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
      if (supabase) {
        await supabase
          .from('trailing_stops')
          .update({
            status: 'error',
          errormessage: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('statekey', stateKey);
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process up to 10 jobs concurrently
  }
);

    console.log('[TrailingStopQueue] Worker initialized');
    return true;
  } catch (error) {
    console.error('[TrailingStopQueue] Failed to initialize worker:', error);
    return false;
  }
}

// Add a new trailing stop to the queue
export const addTrailingStopToQueue = async (jobData: TrailingStopJobData) => {
  if (!trailingStopQueue) {
    throw new Error('BullMQ queue not initialized');
  }

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
  if (!trailingStopQueue) {
    console.warn('[TrailingStopQueue] Queue not initialized, cannot remove job');
    return;
  }

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
  if (!trailingStopQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      system: 'fallback'
    };
  }

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
      total: waiting.length + active.length,
      system: 'bullmq'
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

    // Initialize Redis connection
    const redisInitialized = await initializeRedis();
    if (!redisInitialized) {
      throw new Error('Redis connection failed');
    }

    // Initialize BullMQ queue
    const bullmqInitialized = await initializeBullMQ();
    if (!bullmqInitialized) {
      throw new Error('BullMQ initialization failed');
    }

    // Initialize worker
    const workerInitialized = await initializeWorker();
    if (!workerInitialized) {
      throw new Error('Worker initialization failed');
    }

    // Clear any existing jobs to prevent duplicates
    await trailingStopQueue!.obliterate({ force: true });
    
    // Restore active trailing stops from database
    if (!supabase) {
      console.warn('[TrailingStopQueue] Database not available for restoration');
      return;
    }

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

    if (trailingStopWorker && typeof (trailingStopWorker as any).close === 'function') {
      await (trailingStopWorker as any).close();
    }

    if (trailingStopQueue) {
      await trailingStopQueue.close();
    }

    if (redis) {
      await redis.disconnect();
    }

    console.log('[TrailingStopQueue] Queue system shut down successfully');
  } catch (error) {
    console.error('[TrailingStopQueue] Error during shutdown:', error);
  }
};
