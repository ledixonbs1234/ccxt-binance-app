import { initializeTrailingStops } from './trailingStopState';
import { shutdownTrailingStopQueue } from './trailingStopQueue';
import { initializeFallbackSystem, shutdownFallbackSystem } from './trailingStopFallback';

let isInitialized = false;
let usingFallbackSystem = false;

// Initialize queue system on server startup
export const initializeQueueSystem = async () => {
  if (isInitialized) {
    console.log('[QueueInitializer] Queue system already initialized');
    return;
  }

  try {
    console.log('[QueueInitializer] Starting queue system initialization...');
    
    // Check if we're in server environment
    if (typeof window !== 'undefined') {
      console.log('[QueueInitializer] Skipping queue initialization in browser environment');
      return;
    }

    // Try to initialize trailing stop system with BullMQ first
    try {
      await initializeTrailingStops();
      console.log('[QueueInitializer] BullMQ system initialized successfully');
      usingFallbackSystem = false;
    } catch (bullmqError) {
      console.warn('[QueueInitializer] BullMQ initialization failed, falling back to database polling:', bullmqError);

      // Initialize fallback system
      await initializeFallbackSystem();
      console.log('[QueueInitializer] Fallback system initialized successfully');
      usingFallbackSystem = true;
    }

    isInitialized = true;
    console.log(`[QueueInitializer] Queue system initialized successfully (using ${usingFallbackSystem ? 'fallback' : 'BullMQ'} system)`);
    
    // Setup graceful shutdown handlers
    setupShutdownHandlers();
    
  } catch (error) {
    console.error('[QueueInitializer] Failed to initialize queue system:', error);
    throw error;
  }
};

// Setup graceful shutdown handlers
const setupShutdownHandlers = () => {
  const gracefulShutdown = async (signal: string) => {
    console.log(`[QueueInitializer] Received ${signal}, shutting down gracefully...`);
    
    try {
      if (usingFallbackSystem) {
        shutdownFallbackSystem();
        console.log('[QueueInitializer] Fallback system shut down successfully');
      } else {
        await shutdownTrailingStopQueue();
        console.log('[QueueInitializer] BullMQ system shut down successfully');
      }
      process.exit(0);
    } catch (error) {
      console.error('[QueueInitializer] Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[QueueInitializer] Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[QueueInitializer] Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
};

// Check if queue system is initialized
export const isQueueSystemInitialized = () => isInitialized;

// Force re-initialization (for development/testing)
export const reinitializeQueueSystem = async () => {
  isInitialized = false;
  await initializeQueueSystem();
};
