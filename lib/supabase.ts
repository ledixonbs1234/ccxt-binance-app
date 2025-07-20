import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if required environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    // Enhanced Supabase client with performance optimizations
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'ccxt-binance-trading-app'
        }
      },
      // Connection pooling and performance settings
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('Supabase client initialized successfully with performance optimizations');
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase environment variables not found. Some features will work in memory-only mode.');
  console.warn('Missing:', {
    NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !supabaseAnonKey
  });
}

// Performance monitoring wrapper
class SupabasePerformanceWrapper {
  private client: SupabaseClient | null;
  private queryTimes: Map<string, number[]> = new Map();

  constructor(client: SupabaseClient | null) {
    this.client = client;
  }

  // Wrapper method to track query performance
  async executeQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    const startTime = Date.now();

    try {
      const result = await queryFunction();
      const executionTime = Date.now() - startTime;

      // Track query performance
      this.recordQueryTime(queryName, executionTime);

      // Log slow queries (>1000ms)
      if (executionTime > 1000) {
        console.warn(`[Supabase] Slow query detected: ${queryName} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[Supabase] Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }

  private recordQueryTime(queryName: string, time: number) {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }

    const times = this.queryTimes.get(queryName)!;
    times.push(time);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  getQueryStats() {
    const stats: Record<string, any> = {};

    this.queryTimes.forEach((times, queryName) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      stats[queryName] = {
        averageTime: Math.round(avgTime),
        maxTime,
        minTime,
        totalQueries: times.length
      };
    });

    return stats;
  }

  // Expose the original client for direct access
  get raw() {
    return this.client;
  }
}

// Export performance-wrapped client
export const performanceSupabase = new SupabasePerformanceWrapper(supabase);

// Health check function
export async function checkSupabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  if (!supabase) {
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: 'Supabase client not initialized'
    };
  }

  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

// Connection retry utility
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        console.error(`[Supabase] Operation failed after ${maxRetries} attempts:`, error);
        throw error;
      }

      console.warn(`[Supabase] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

export { supabase };