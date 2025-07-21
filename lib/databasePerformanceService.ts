/**
 * Database Performance Service
 * Handles database optimization, caching, and performance monitoring
 */

import { supabase } from './supabase';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
}

export interface DatabaseStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

export interface QueryPerformance {
  query: string;
  meanTime: number;
  calls: number;
  totalTime: number;
}

class DatabasePerformanceService {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_CACHE_TTL = 300; // 5 minutes

  /**
   * Get paginated data with optimized queries
   */
  async getPaginatedData(
    tableName: string,
    options: PaginationOptions = {},
    filters: Record<string, any> = {}
  ) {
    // Check if supabase client is available
    if (!supabase) {
      console.warn('[DatabasePerformance] Supabase not available, returning empty result');
      return {
        data: [],
        pagination: {
          page: 1,
          limit: this.DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    const {
      page = 1,
      limit = this.DEFAULT_PAGE_SIZE,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Validate pagination parameters
    const validatedLimit = Math.min(Math.max(1, limit), this.MAX_PAGE_SIZE);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    try {
      // Build query with filters
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply sorting and pagination
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + validatedLimit - 1);

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validatedLimit),
          hasNext: validatedPage * validatedLimit < (count || 0),
          hasPrev: validatedPage > 1
        }
      };
    } catch (error) {
      console.error(`[DatabasePerformance] Error getting paginated data from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data or fetch from database
   */
  async getCachedData<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_CACHE_TTL } = options;
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > now) {
      return cached.data;
    }

    try {
      // Fetch fresh data
      const data = await fetchFunction();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        expires: now + (ttl * 1000)
      });

      return data;
    } catch (error) {
      // If fetch fails and we have expired cache, return it
      if (cached) {
        console.warn(`[DatabasePerformance] Using expired cache for ${cacheKey} due to fetch error:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get optimized orders with pagination
   */
  async getOrdersOptimized(
    userId?: string,
    options: PaginationOptions = {},
    filters: Record<string, any> = {}
  ) {
    const cacheKey = `orders_${userId || 'all'}_${JSON.stringify({ options, filters })}`;
    
    return this.getCachedData(cacheKey, async () => {
      const allFilters = userId ? { ...filters, user_id: userId } : filters;
      return this.getPaginatedData('orders', options, allFilters);
    }, { ttl: 60 }); // Cache for 1 minute
  }

  /**
   * Get optimized trailing positions with pagination
   */
  async getTrailingPositionsOptimized(
    userId?: string,
    options: PaginationOptions = {},
    filters: Record<string, any> = {}
  ) {
    const cacheKey = `positions_${userId || 'all'}_${JSON.stringify({ options, filters })}`;
    
    return this.getCachedData(cacheKey, async () => {
      const allFilters = userId ? { ...filters, user_id: userId } : filters;
      return this.getPaginatedData('enhanced_trailing_positions', options, allFilters);
    }, { ttl: 30 }); // Cache for 30 seconds
  }

  /**
   * Get performance analytics with caching
   */
  async getPerformanceAnalytics(
    userId?: string,
    symbol?: string,
    strategy?: string
  ) {
    const cacheKey = `analytics_${userId || 'all'}_${symbol || 'all'}_${strategy || 'all'}`;
    
    return this.getCachedData(cacheKey, async () => {
      const filters: Record<string, any> = {};
      if (userId) filters.user_id = userId;
      if (symbol) filters.symbol = symbol;
      if (strategy) filters.strategy = strategy;

      return this.getPaginatedData('performance_analytics', {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 50
      }, filters);
    }, { ttl: 300 }); // Cache for 5 minutes
  }

  /**
   * Cache trade history data
   */
  async cacheTradeHistory(userId: string, symbol: string, tradeData: any[]) {
    if (!supabase) {
      console.warn('[DatabasePerformance] Supabase not available, skipping cache');
      return;
    }

    try {
      const { error } = await supabase
        .from('trade_history_cache')
        .upsert({
          user_id: userId,
          symbol,
          trade_data: tradeData,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        }, {
          onConflict: 'user_id,symbol'
        });

      if (error) throw error;
    } catch (error) {
      console.error('[DatabasePerformance] Error caching trade history:', error);
    }
  }

  /**
   * Get cached trade history
   */
  async getCachedTradeHistory(userId: string, symbol: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('trade_history_cache')
        .select('trade_data, cached_at')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.trade_data;
    } catch (error) {
      console.error('[DatabasePerformance] Error getting cached trade history:', error);
      return null;
    }
  }

  /**
   * Cache order history data
   */
  async cacheOrderHistory(userId: string, symbol: string, orderData: any[]) {
    if (!supabase) {
      console.warn('[DatabasePerformance] Supabase not available, skipping cache');
      return;
    }

    try {
      const { error } = await supabase
        .from('order_history_cache')
        .upsert({
          user_id: userId,
          symbol,
          order_data: orderData,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        }, {
          onConflict: 'user_id,symbol'
        });

      if (error) throw error;
    } catch (error) {
      console.error('[DatabasePerformance] Error caching order history:', error);
    }
  }

  /**
   * Get cached order history
   */
  async getCachedOrderHistory(userId: string, symbol: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('order_history_cache')
        .select('order_data, cached_at')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.order_data;
    } catch (error) {
      console.error('[DatabasePerformance] Error getting cached order history:', error);
      return null;
    }
  }

  /**
   * Get database performance statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase.rpc('get_db_performance_stats');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[DatabasePerformance] Error getting database stats:', error);
      return [];
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanupExpiredCache() {
    if (!supabase) return;

    try {
      await supabase.rpc('cleanup_expired_cache');
      console.log('[DatabasePerformance] Expired cache entries cleaned up');
    } catch (error) {
      console.error('[DatabasePerformance] Error cleaning up expired cache:', error);
    }
  }

  /**
   * Clear in-memory cache
   */
  clearMemoryCache() {
    this.cache.clear();
    console.log('[DatabasePerformance] Memory cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const validEntries = entries.filter(([_, value]) => value.expires > now);
    const expiredEntries = entries.filter(([_, value]) => value.expires <= now);

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      hitRate: validEntries.length / Math.max(entries.length, 1),
      memoryUsage: JSON.stringify(this.cache).length
    };
  }
}

// Export singleton instance
export const databasePerformanceService = new DatabasePerformanceService();
export default databasePerformanceService;
