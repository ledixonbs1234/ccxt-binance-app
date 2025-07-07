// Advanced caching service for cryptocurrency data
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 30000) { // 30 seconds default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key
    };

    this.cache.set(key, entry);
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      entries: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`[CacheService] Cleaned up ${toDelete.length} expired entries`);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[CacheService] Evicted oldest entry: ${oldestKey}`);
    }
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; age: number; ttl: number; size: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      size: JSON.stringify(entry.data).length
    }));
  }
}

// Create global cache instances with different TTLs
export const priceCache = new CacheService(500, 5000);    // 5 seconds for prices
export const candleCache = new CacheService(200, 30000);  // 30 seconds for candles  
export const balanceCache = new CacheService(50, 10000);  // 10 seconds for balance
export const generalCache = new CacheService(1000, 60000); // 1 minute for general data

// Cache key generators
export const CacheKeys = {
  ticker: (symbol: string) => `ticker:${symbol}`,
  batchTicker: (symbols: string[]) => `batch-ticker:${symbols.sort().join(',')}`,
  candles: (symbol: string, timeframe: string, limit: number) => 
    `candles:${symbol}:${timeframe}:${limit}`,
  balance: () => 'balance:current',
  orderHistory: (limit?: number) => `orders:${limit || 'all'}`,
  activeSimulations: () => 'simulations:active'
};

export default CacheService;
