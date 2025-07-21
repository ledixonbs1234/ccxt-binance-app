/**
 * Utility functions for handling micro-cap tokens with very small prices
 * Specialized for tokens like PEPE, SHIB, etc. with prices < 0.001
 * Optimized with caching and memoization for high performance
 */

export interface MicroCapToken {
  symbol: string;
  price: number;
  decimals: number;
  isMicroCap: boolean;
  formatType: 'scientific' | 'decimal' | 'standard';
}

// Performance optimization: Caching for expensive calculations
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class PerformanceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 1000, ttl = 60000) { // 1 minute TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Clean up expired entries and maintain size limit
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global caches for different types of calculations
const formatCache = new PerformanceCache<string>(500, 30000); // 30 seconds for formatting
const calculationCache = new PerformanceCache<number>(300, 60000); // 1 minute for calculations
const formatTypeCache = new PerformanceCache<'scientific' | 'decimal' | 'standard'>(300, 60000); // 1 minute for format types
const analysisCache = new PerformanceCache<any>(200, 120000); // 2 minutes for analysis

// Memoization decorator for expensive functions
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  cache: PerformanceCache<ReturnType<T>>,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Detect if a token is micro-cap based on price
 * Optimized with simple range check (no caching needed for simple boolean)
 */
export function isMicroCapToken(price: number): boolean {
  return price > 0 && price < 0.001;
}

/**
 * Get optimal decimal places for micro-cap token
 * Memoized for performance optimization
 */
export const getMicroCapDecimals = memoize(
  (price: number): number => {
    if (price === 0) return 8;

    // For very small prices, use more decimals
    if (price < 0.0000001) return 10;
    if (price < 0.000001) return 9;
    if (price < 0.00001) return 8;
    if (price < 0.0001) return 7;
    if (price < 0.001) return 6;

    return 4; // Standard decimals
  },
  calculationCache,
  (price: number) => `decimals_${price}`
);

/**
 * Determine best format type for micro-cap token
 * Memoized for performance optimization
 */
export const getMicroCapFormatType = memoize(
  (price: number): 'scientific' | 'decimal' | 'standard' => {
    if (price === 0) return 'standard';

    // Use scientific notation for extremely small prices
    if (price < 0.0000001) return 'scientific';

    // Use decimal for small but readable prices
    if (price < 0.001) return 'decimal';

    return 'standard';
  },
  formatTypeCache,
  (price: number) => `format_type_${price}`
);

/**
 * Format micro-cap token price with optimal precision
 * Heavily optimized with caching for frequently called function
 */
export const formatMicroCapPrice = memoize(
  (price: number, options?: {
    forceFormat?: 'scientific' | 'decimal' | 'standard';
    maxDecimals?: number;
    minDecimals?: number;
  }): string => {
    if (price === 0) return '0.00000000';

    const formatType = options?.forceFormat || getMicroCapFormatType(price);
    const decimals = Math.min(
      options?.maxDecimals || getMicroCapDecimals(price),
      options?.minDecimals || 2
    );

    switch (formatType) {
      case 'scientific':
        return price.toExponential(4);

      case 'decimal':
        // Remove trailing zeros but keep minimum decimals
        const formatted = price.toFixed(decimals);
        const trimmed = formatted.replace(/\.?0+$/, '');
        const minDecimals = options?.minDecimals || 2;

        if (trimmed.includes('.')) {
          const decimalPart = trimmed.split('.')[1];
          if (decimalPart.length < minDecimals) {
            return price.toFixed(minDecimals);
          }
        }

        return trimmed;

      case 'standard':
      default:
        return price.toFixed(decimals);
    }
  },
  formatCache,
  (price: number, options?: any) => `price_${price}_${JSON.stringify(options || {})}`
);

/**
 * Format micro-cap token percentage change
 * Optimized with caching for frequently displayed values
 */
export const formatMicroCapPercentage = memoize(
  (change: number): string => {
    if (Math.abs(change) < 0.01) {
      // For very small changes, show more precision
      return change.toFixed(4) + '%';
    }

    return change.toFixed(2) + '%';
  },
  formatCache,
  (change: number) => `percentage_${change}`
);

/**
 * Calculate percentage change with high precision for micro-cap tokens
 * Memoized for performance optimization
 */
export const calculateMicroCapPercentageChange = memoize(
  (oldPrice: number, newPrice: number): number => {
    if (oldPrice === 0) return 0;

    // Use high precision calculation for micro-cap tokens
    const change = ((newPrice - oldPrice) / oldPrice) * 100;

    // Round to avoid floating point precision issues
    return Math.round(change * 10000) / 10000;
  },
  calculationCache,
  (oldPrice: number, newPrice: number) => `change_${oldPrice}_${newPrice}`
);

/**
 * Format micro-cap token volume
 * Optimized with caching for frequently displayed volume values
 */
export const formatMicroCapVolume = memoize(
  (volume: number): string => {
    if (volume >= 1e12) {
      return (volume / 1e12).toFixed(2) + 'T';
    } else if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    }

    return volume.toLocaleString(undefined, { maximumFractionDigits: 0 });
  },
  formatCache,
  (volume: number) => `volume_${volume}`
);

/**
 * Calculate position size for micro-cap tokens with proper precision
 * Memoized for performance optimization in trading calculations
 */
export const calculateMicroCapPositionSize = memoize(
  (
    accountBalance: number,
    riskPercent: number,
    entryPrice: number,
    stopLossPrice: number
  ): number => {
    if (entryPrice === 0 || stopLossPrice === 0) return 0;

    const riskAmount = accountBalance * (riskPercent / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);

    if (priceRisk === 0) return 0;

    const positionSize = riskAmount / priceRisk;

    // Round to appropriate precision for micro-cap tokens
    if (isMicroCapToken(entryPrice)) {
      return Math.round(positionSize);
    }

    return Math.round(positionSize * 100) / 100;
  },
  calculationCache,
  (accountBalance: number, riskPercent: number, entryPrice: number, stopLossPrice: number) =>
    `position_${accountBalance}_${riskPercent}_${entryPrice}_${stopLossPrice}`
);

/**
 * Validate micro-cap token price input
 */
export function validateMicroCapPrice(price: string | number): {
  isValid: boolean;
  error?: string;
  normalizedPrice?: number;
} {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Giá không hợp lệ' };
  }
  
  if (numPrice < 0) {
    return { isValid: false, error: 'Giá không thể âm' };
  }
  
  if (numPrice === 0) {
    return { isValid: true, normalizedPrice: 0 };
  }
  
  // Check for extremely small prices that might cause precision issues
  if (numPrice < 1e-12) {
    return { isValid: false, error: 'Giá quá nhỏ, có thể gây lỗi tính toán' };
  }
  
  return { isValid: true, normalizedPrice: numPrice };
}

/**
 * Get micro-cap token analysis
 * Memoized for performance optimization in analysis operations
 */
export const analyzeMicroCapToken = memoize(
  (price: number, volume: number): MicroCapToken => {
    return {
      symbol: '', // Will be set by caller
      price,
      decimals: getMicroCapDecimals(price),
      isMicroCap: isMicroCapToken(price),
      formatType: getMicroCapFormatType(price)
    };
  },
  analysisCache,
  (price: number, volume: number) => `analysis_${price}_${volume}`
);

/**
 * Format micro-cap token for display in different contexts
 * Heavily optimized with caching for UI rendering performance
 */
export const formatMicroCapForContext = memoize(
  (
    price: number,
    context: 'chart' | 'table' | 'tooltip' | 'input'
  ): string => {
    switch (context) {
      case 'chart':
        // Chart needs compact format
        if (isMicroCapToken(price)) {
          return formatMicroCapPrice(price, { forceFormat: 'decimal', maxDecimals: 6 });
        }
        return price.toFixed(4);

      case 'table':
        // Table needs readable format
        return formatMicroCapPrice(price, { maxDecimals: 8 });

      case 'tooltip':
        // Tooltip can show full precision
        return formatMicroCapPrice(price, { maxDecimals: 10 });

      case 'input':
        // Input needs editable format
        if (isMicroCapToken(price)) {
          return price.toString();
        }
        return price.toFixed(8);

      default:
        return formatMicroCapPrice(price);
    }
  },
  formatCache,
  (price: number, context: string) => `context_${price}_${context}`
);

/**
 * Convert micro-cap price to different units for better readability
 */
export function convertMicroCapUnits(price: number): {
  original: number;
  inSatoshis?: number;
  inGwei?: number;
  multiplier: number;
  unit: string;
} {
  const result: {
    original: number;
    inSatoshis?: number;
    inGwei?: number;
    multiplier: number;
    unit: string;
  } = {
    original: price,
    multiplier: 1,
    unit: 'standard'
  };

  if (price < 0.000001) {
    // Convert to satoshis (1e-8)
    result.inSatoshis = price * 1e8;
    result.multiplier = 1e8;
    result.unit = 'satoshis';
  } else if (price < 0.001) {
    // Convert to gwei (1e-9)
    result.inGwei = price * 1e9;
    result.multiplier = 1e9;
    result.unit = 'gwei';
  }

  return result;
}

// Performance monitoring and cache management utilities
export const MicroCapPerformance = {
  /**
   * Get cache statistics for performance monitoring
   */
  getCacheStats(): {
    formatCache: { size: number; maxSize: number };
    calculationCache: { size: number; maxSize: number };
    analysisCache: { size: number; maxSize: number };
  } {
    return {
      formatCache: { size: formatCache.size(), maxSize: 500 },
      calculationCache: { size: calculationCache.size(), maxSize: 300 },
      analysisCache: { size: analysisCache.size(), maxSize: 200 }
    };
  },

  /**
   * Clear all caches to free memory
   */
  clearAllCaches(): void {
    formatCache.clear();
    calculationCache.clear();
    analysisCache.clear();
  },

  /**
   * Warm up cache with common values for better performance
   */
  warmUpCache(): void {
    // Common PEPE price ranges
    const commonPrices = [
      0.00000667, 0.00000700, 0.00000634, 0.00000800,
      0.00001234, 0.00001000, 0.00001500, 0.00002000
    ];

    // Common contexts
    const contexts: Array<'chart' | 'table' | 'tooltip' | 'input'> = ['chart', 'table', 'tooltip', 'input'];

    // Pre-calculate common formatting operations
    commonPrices.forEach(price => {
      formatMicroCapPrice(price);
      getMicroCapDecimals(price);
      getMicroCapFormatType(price);

      contexts.forEach(context => {
        formatMicroCapForContext(price, context);
      });
    });

    // Pre-calculate common percentage changes
    for (let i = 0; i < commonPrices.length - 1; i++) {
      calculateMicroCapPercentageChange(commonPrices[i], commonPrices[i + 1]);
    }

    // Pre-calculate common volumes
    const commonVolumes = [1000, 10000, 100000, 1000000, 10000000];
    commonVolumes.forEach(volume => {
      formatMicroCapVolume(volume);
    });
  },

  /**
   * Performance benchmark for micro-cap operations
   */
  benchmark(): {
    formatPrice: number;
    calculateChange: number;
    formatVolume: number;
    contextFormat: number;
    cacheHitRate: number;
  } {
    const iterations = 1000;
    const testPrice = 0.00000667;
    const testVolume = 1000000;

    // Benchmark formatMicroCapPrice
    const formatStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatMicroCapPrice(testPrice + i * 0.00000001);
    }
    const formatTime = performance.now() - formatStart;

    // Benchmark calculateMicroCapPercentageChange
    const changeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      calculateMicroCapPercentageChange(testPrice, testPrice + i * 0.00000001);
    }
    const changeTime = performance.now() - changeStart;

    // Benchmark formatMicroCapVolume
    const volumeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatMicroCapVolume(testVolume + i * 1000);
    }
    const volumeTime = performance.now() - volumeStart;

    // Benchmark formatMicroCapForContext
    const contextStart = performance.now();
    const contexts: Array<'chart' | 'table' | 'tooltip' | 'input'> = ['chart', 'table', 'tooltip', 'input'];
    for (let i = 0; i < iterations; i++) {
      const context = contexts[i % contexts.length];
      formatMicroCapForContext(testPrice + i * 0.00000001, context);
    }
    const contextTime = performance.now() - contextStart;

    // Calculate cache hit rate (approximate)
    const stats = this.getCacheStats();
    const totalCacheSize = stats.formatCache.size + stats.calculationCache.size + stats.analysisCache.size;
    const cacheHitRate = Math.min(100, (totalCacheSize / (iterations * 4)) * 100);

    return {
      formatPrice: formatTime,
      calculateChange: changeTime,
      formatVolume: volumeTime,
      contextFormat: contextTime,
      cacheHitRate
    };
  }
};
