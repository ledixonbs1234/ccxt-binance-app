// Enhanced API Error Handler Service
// Provides retry mechanisms, circuit breaker pattern, and intelligent fallback strategies

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: number;
  timeout: number;
  threshold: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface ApiErrorMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retryAttempts: number;
  circuitBreakerTrips: number;
  averageResponseTime: number;
  lastError?: string;
  lastErrorTime?: number;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private lastSuccessfulPrices: Map<string, { price: number; timestamp: number }> = new Map();
  private metrics: Map<string, ApiErrorMetrics> = new Map();
  private requestTimes: Map<string, number[]> = new Map();

  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'rate limit', 'timeout']
  };

  private constructor() {}

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => T,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const startTime = Date.now();
    const breaker = this.getCircuitBreaker(key);
    const metrics = this.getMetrics(key);
    
    metrics.totalRequests++;

    // Check circuit breaker state
    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailure < breaker.timeout) {
        console.warn(`[Circuit Breaker] ${key} is OPEN, using fallback`);
        metrics.circuitBreakerTrips++;
        if (fallback) {
          const result = fallback();
          this.recordResponseTime(key, Date.now() - startTime);
          return result;
        }
        throw new Error(`Circuit breaker is OPEN for ${key}`);
      } else {
        breaker.state = 'HALF_OPEN';
        console.info(`[Circuit Breaker] ${key} transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await this.executeWithRetry(key, operation, config);
      this.onSuccess(key);
      metrics.successfulRequests++;
      this.recordResponseTime(key, Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(key, error);
      metrics.failedRequests++;
      metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      metrics.lastErrorTime = Date.now();
      
      if (fallback) {
        console.warn(`[Fallback] Using fallback for ${key}:`, error);
        const result = fallback();
        this.recordResponseTime(key, Date.now() - startTime);
        return result;
      }
      throw error;
    }
  }

  /**
   * Execute operation with retry and exponential backoff
   */
  private async executeWithRetry<T>(
    key: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        this.retryAttempts.delete(key);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.maxRetries) break;
        
        // Check if error is retryable
        if (!this.isRetryableError(error, retryConfig)) {
          throw error;
        }

        const delay = this.calculateBackoffDelay(attempt, retryConfig);
        console.warn(`[Retry] ${key} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, error);
        
        this.getMetrics(key).retryAttempts++;
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: any, config: RetryConfig): boolean {
    if (!error) return false;
    
    // Check error codes
    if (error.code && config.retryableErrors.some(code => 
      error.code.includes(code) || error.code === code
    )) {
      return true;
    }
    
    // Check HTTP status codes
    if (error.status && config.retryableStatuses.includes(error.status)) {
      return true;
    }
    
    // Check error messages
    if (error.message && config.retryableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType.toLowerCase())
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
    
    // Add jitter to prevent thundering herd (±10%)
    const jitter = Math.random() * 0.2 * delay - 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCircuitBreaker(key: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        timeout: 60000, // 1 minute
        threshold: 5
      });
    }
    return this.circuitBreakers.get(key)!;
  }

  private getMetrics(key: string): ApiErrorMetrics {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        retryAttempts: 0,
        circuitBreakerTrips: 0,
        averageResponseTime: 0
      });
    }
    return this.metrics.get(key)!;
  }

  private recordResponseTime(key: string, responseTime: number): void {
    if (!this.requestTimes.has(key)) {
      this.requestTimes.set(key, []);
    }
    
    const times = this.requestTimes.get(key)!;
    times.push(responseTime);
    
    // Keep only last 100 response times
    if (times.length > 100) {
      times.shift();
    }
    
    // Update average response time
    const metrics = this.getMetrics(key);
    metrics.averageResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private onSuccess(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failures = 0;
    breaker.state = 'CLOSED';
    this.retryAttempts.delete(key);
  }

  private onFailure(key: string, error: any): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'OPEN';
      console.warn(`[Circuit Breaker] ${key} opened due to ${breaker.failures} failures`);
    }
  }

  /**
   * Cache successful prices for intelligent fallback
   */
  cacheSuccessfulPrice(symbol: string, price: number): void {
    this.lastSuccessfulPrices.set(symbol, {
      price,
      timestamp: Date.now()
    });
  }

  /**
   * Get last successful price if available and recent
   */
  getLastSuccessfulPrice(symbol: string, maxAgeMs: number = 5 * 60 * 1000): number | null {
    const cached = this.lastSuccessfulPrices.get(symbol);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp < maxAgeMs) {
      return cached.price;
    }
    
    return null;
  }

  /**
   * Get metrics for a specific API key
   */
  getApiMetrics(key: string): ApiErrorMetrics | null {
    return this.metrics.get(key) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, ApiErrorMetrics> {
    const result: Record<string, ApiErrorMetrics> = {};
    this.metrics.forEach((metrics, key) => {
      result[key] = { ...metrics };
    });
    return result;
  }

  /**
   * Reset circuit breaker for a specific key
   */
  resetCircuitBreaker(key: string): void {
    const breaker = this.getCircuitBreaker(key);
    breaker.state = 'CLOSED';
    breaker.failures = 0;
    breaker.lastFailure = 0;
    console.info(`[Circuit Breaker] ${key} manually reset to CLOSED`);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.lastSuccessfulPrices.clear();
    this.retryAttempts.clear();
    this.requestTimes.clear();
    console.info('[ApiErrorHandler] All caches cleared');
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();
