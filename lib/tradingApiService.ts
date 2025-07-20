// Trading API Service - Utility for real market data
import { apiErrorHandler } from './apiErrorHandler';

export interface TickerData {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  percentage: number;
  timestamp: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketVolatilityData {
  symbol: string;
  atr: number;
  volatilityPercent: number;
  trend: 'bullish' | 'bearish' | 'sideways';
  strength: number;
  supportLevel?: number;
  resistanceLevel?: number;
}

export class TradingApiService {
  private static instance: TradingApiService;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private volatilityCache: Map<string, { data: MarketVolatilityData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache
  private readonly VOLATILITY_CACHE_DURATION = 30000; // 30 seconds cache for volatility

  private constructor() {}

  static getInstance(): TradingApiService {
    if (!TradingApiService.instance) {
      TradingApiService.instance = new TradingApiService();
    }
    return TradingApiService.instance;
  }

  /**
   * Lấy giá hiện tại của symbol từ API ticker với enhanced error handling
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    // Kiểm tra cache trước
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    const operation = async (): Promise<number> => {
      // Sử dụng API route nội bộ của Next.js
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ticker?symbol=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        const error = new Error(`API ticker error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const tickerData: TickerData = await response.json();

      if (!tickerData.last || isNaN(tickerData.last)) {
        throw new Error(`Invalid price data for ${symbol}`);
      }

      // Lưu vào cache và cache successful price
      this.priceCache.set(symbol, {
        price: tickerData.last,
        timestamp: Date.now()
      });

      // Cache successful price for intelligent fallback
      apiErrorHandler.cacheSuccessfulPrice(symbol, tickerData.last);

      return tickerData.last;
    };

    const fallback = (): number => {
      // Try to get last successful price first
      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      if (lastSuccessfulPrice !== null) {
        console.info(`[Fallback] Using last successful price for ${symbol}: ${lastSuccessfulPrice}`);
        return lastSuccessfulPrice;
      }

      // Fallback to default price
      console.warn(`[Fallback] Using default price for ${symbol}`);
      return this.getFallbackPrice(symbol);
    };

    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getCurrentPrice_${symbol}`,
        operation,
        fallback
      );
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      return fallback();
    }
  }

  /**
   * Lấy dữ liệu ticker đầy đủ với enhanced error handling
   */
  async getTickerData(symbol: string): Promise<TickerData> {
    const operation = async (): Promise<TickerData> => {
      // Sử dụng API route nội bộ của Next.js
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      const response = await fetch(`${baseUrl}/api/ticker?symbol=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        const error = new Error(`API ticker error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const rawTickerData = await response.json();

      // Map CCXT ticker data to our TickerData interface
      const tickerData: TickerData = {
        symbol: rawTickerData.symbol,
        last: rawTickerData.last || rawTickerData.close,
        bid: rawTickerData.bid || 0,
        ask: rawTickerData.ask || 0,
        high: rawTickerData.high || 0,
        low: rawTickerData.low || 0,
        volume: rawTickerData.baseVolume || 0,
        quoteVolume: rawTickerData.quoteVolume || 0,
        percentage: rawTickerData.percentage || 0,
        timestamp: rawTickerData.timestamp || Date.now()
      };

      // Cache successful price
      if (tickerData.last && !isNaN(tickerData.last)) {
        apiErrorHandler.cacheSuccessfulPrice(symbol, tickerData.last);
      }

      return tickerData;
    };

    const fallback = (): TickerData => {
      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      const fallbackPrice = lastSuccessfulPrice || this.getFallbackPrice(symbol);

      console.warn(`[Fallback] Using fallback ticker data for ${symbol} with price: ${fallbackPrice}`);

      return {
        symbol,
        last: fallbackPrice,
        bid: fallbackPrice * 0.999,
        ask: fallbackPrice * 1.001,
        high: fallbackPrice * 1.05,
        low: fallbackPrice * 0.95,
        volume: 1000000,
        quoteVolume: 1000000 * fallbackPrice,
        percentage: 0,
        timestamp: Date.now()
      };
    };

    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getTickerData_${symbol}`,
        operation,
        fallback
      );
    } catch (error) {
      console.error(`Error fetching ticker data for ${symbol}:`, error);
      return fallback();
    }
  }

  /**
   * Lấy dữ liệu nến (OHLCV) từ API với enhanced error handling
   */
  async getCandleData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<CandleData[]> {
    const operation = async (): Promise<CandleData[]> => {
      // Sử dụng API route nội bộ của Next.js
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      const response = await fetch(
        `${baseUrl}/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`
      );

      if (!response.ok) {
        const error = new Error(`API candles error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const responseData = await response.json();

      // Handle API response format: { data: [...], cached: boolean, timestamp: string }
      let rawData: number[][];
      if (responseData.data && Array.isArray(responseData.data)) {
        rawData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Fallback for direct array response
        rawData = responseData;
      } else {
        throw new Error(`Invalid candle data format received for ${symbol}`);
      }

      // Validate that rawData is an array
      if (!Array.isArray(rawData)) {
        throw new Error(`Expected array of candles for ${symbol}, got ${typeof rawData}`);
      }

      // Chuyển đổi từ format CCXT [timestamp, open, high, low, close, volume]
      const candleData: CandleData[] = rawData.map((candle, index) => {
        if (!Array.isArray(candle) || candle.length < 6) {
          throw new Error(`Invalid candle data at index ${index} for ${symbol}: expected array with 6 elements, got ${candle}`);
        }

        return {
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        };
      });

      return candleData;
    };

    const fallback = (): CandleData[] => {
      console.warn(`[Fallback] Generating synthetic candle data for ${symbol}`);

      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      const basePrice = lastSuccessfulPrice || this.getFallbackPrice(symbol);
      const now = Date.now();
      const timeframeMs = this.getTimeframeMs(timeframe);

      // Generate synthetic candle data
      const candles: CandleData[] = [];
      for (let i = limit - 1; i >= 0; i--) {
        const timestamp = now - (i * timeframeMs);
        const volatility = 0.02; // 2% volatility
        const randomFactor = (Math.random() - 0.5) * volatility;

        const open = basePrice * (1 + randomFactor);
        const close = open * (1 + (Math.random() - 0.5) * volatility);
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        const volume = 1000 + Math.random() * 9000;

        candles.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume
        });
      }

      return candles;
    };

    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getCandleData_${symbol}_${timeframe}`,
        operation,
        fallback
      );
    } catch (error) {
      console.error(`Error fetching candle data for ${symbol}:`, error);
      return fallback();
    }
  }

  /**
   * Convert timeframe string to milliseconds
   */
  private getTimeframeMs(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };

    return timeframes[timeframe] || timeframes['1h'];
  }

  /**
   * Tính toán volatility từ dữ liệu thực tế với enhanced error handling
   */
  async calculateVolatility(symbol: string): Promise<MarketVolatilityData> {
    // Kiểm tra cache
    const cached = this.volatilityCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.VOLATILITY_CACHE_DURATION) {
      return cached.data;
    }

    const operation = async (): Promise<MarketVolatilityData> => {
      // Lấy dữ liệu nến 1 giờ cho 100 periods gần nhất
      const candles = await this.getCandleData(symbol, '1h', 100);

      if (candles.length < 14) {
        throw new Error(`Insufficient candle data for ${symbol}: got ${candles.length}, need at least 14`);
      }

      // Tính ATR (Average True Range)
      const atr = this.calculateATR(candles);

      // Tính volatility percentage từ standard deviation của returns
      const volatilityPercent = this.calculateVolatilityPercent(candles);

      // Xác định trend và strength
      const { trend, strength } = this.analyzeTrend(candles);

      // Tính support và resistance levels
      const { supportLevel, resistanceLevel } = this.calculateSupportResistance(candles);

      const volatilityData: MarketVolatilityData = {
        symbol,
        atr,
        volatilityPercent,
        trend,
        strength,
        supportLevel,
        resistanceLevel
      };

      // Lưu vào cache
      this.volatilityCache.set(symbol, {
        data: volatilityData,
        timestamp: Date.now()
      });

      return volatilityData;
    };

    const fallback = (): MarketVolatilityData => {
      console.warn(`[Fallback] Using fallback volatility data for ${symbol}`);
      return this.getFallbackVolatility(symbol);
    };

    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `calculateVolatility_${symbol}`,
        operation,
        fallback
      );
    } catch (error) {
      console.error(`Error calculating volatility for ${symbol}:`, error);
      return fallback();
    }
  }

  /**
   * Tính ATR (Average True Range) từ dữ liệu nến
   */
  private calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) {
      throw new Error('Insufficient data for ATR calculation');
    }

    const trueRanges: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Tính ATR bằng SMA của True Range
    const recentTRs = trueRanges.slice(-period);
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / period;
  }

  /**
   * Tính volatility percentage từ standard deviation
   */
  private calculateVolatilityPercent(candles: CandleData[]): number {
    if (candles.length < 2) return 3.0; // Default fallback

    // Tính returns
    const returns: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const returnValue = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(returnValue);
    }

    // Tính standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Chuyển đổi sang percentage và annualize (giả sử 24 periods per day)
    return stdDev * Math.sqrt(24) * 100;
  }

  /**
   * Phân tích trend và strength
   */
  private analyzeTrend(candles: CandleData[]): { trend: 'bullish' | 'bearish' | 'sideways'; strength: number } {
    if (candles.length < 20) {
      return { trend: 'sideways', strength: 50 };
    }

    const recent = candles.slice(-20);
    const firstPrice = recent[0].close;
    const lastPrice = recent[recent.length - 1].close;
    const priceChange = (lastPrice - firstPrice) / firstPrice;

    // Tính SMA 10 và 20
    const sma10 = recent.slice(-10).reduce((sum, c) => sum + c.close, 0) / 10;
    const sma20 = recent.reduce((sum, c) => sum + c.close, 0) / 20;

    let trend: 'bullish' | 'bearish' | 'sideways';
    let strength: number;

    if (priceChange > 0.02 && sma10 > sma20) {
      trend = 'bullish';
      strength = Math.min(100, 50 + Math.abs(priceChange) * 1000);
    } else if (priceChange < -0.02 && sma10 < sma20) {
      trend = 'bearish';
      strength = Math.min(100, 50 + Math.abs(priceChange) * 1000);
    } else {
      trend = 'sideways';
      strength = 50 - Math.abs(priceChange) * 500;
    }

    return { trend, strength: Math.max(0, Math.min(100, strength)) };
  }

  /**
   * Tính support và resistance levels
   */
  private calculateSupportResistance(candles: CandleData[]): { supportLevel: number; resistanceLevel: number } {
    if (candles.length < 20) {
      const currentPrice = candles[candles.length - 1].close;
      return {
        supportLevel: currentPrice * 0.95,
        resistanceLevel: currentPrice * 1.05
      };
    }

    const recent = candles.slice(-50); // Lấy 50 nến gần nhất
    const highs = recent.map(c => c.high).sort((a, b) => b - a);
    const lows = recent.map(c => c.low).sort((a, b) => a - b);

    // Support: trung bình của 10% giá thấp nhất
    const supportCount = Math.max(1, Math.floor(lows.length * 0.1));
    const supportLevel = lows.slice(0, supportCount).reduce((sum, low) => sum + low, 0) / supportCount;

    // Resistance: trung bình của 10% giá cao nhất
    const resistanceCount = Math.max(1, Math.floor(highs.length * 0.1));
    const resistanceLevel = highs.slice(0, resistanceCount).reduce((sum, high) => sum + high, 0) / resistanceCount;

    return { supportLevel, resistanceLevel };
  }

  /**
   * Fallback price khi API không khả dụng
   */
  private getFallbackPrice(symbol: string): number {
    const baseCurrency = symbol.split('/')[0];
    
    const fallbackPrices: Record<string, number> = {
      'BTC': 109000,  // Updated to current market price ~$109k
      'ETH': 3800,    // Updated to current market price
      'PEPE': 0.00002,
      'DOGE': 0.08,
      'SHIB': 0.000012,
      'ADA': 0.45,
      'SOL': 100,
      'MATIC': 1.0
    };

    return fallbackPrices[baseCurrency] || 100;
  }

  /**
   * Intelligent fallback volatility với cached successful prices
   */
  private getFallbackVolatility(symbol: string): MarketVolatilityData {
    const baseCurrency = symbol.split('/')[0];

    // Try to get last successful price first
    const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
    const currentPrice = lastSuccessfulPrice || this.getFallbackPrice(symbol);

    const fallbackProfiles: Record<string, { baseVolatility: number; atrMultiplier: number; strength: number }> = {
      'BTC': { baseVolatility: 2.5, atrMultiplier: 0.02, strength: 75 },
      'ETH': { baseVolatility: 3.0, atrMultiplier: 0.025, strength: 70 },
      'PEPE': { baseVolatility: 8.0, atrMultiplier: 0.15, strength: 45 },
      'DOGE': { baseVolatility: 6.0, atrMultiplier: 0.08, strength: 50 },
      'SHIB': { baseVolatility: 7.5, atrMultiplier: 0.12, strength: 40 },
      'ADA': { baseVolatility: 4.5, atrMultiplier: 0.06, strength: 65 },
      'SOL': { baseVolatility: 5.0, atrMultiplier: 0.07, strength: 70 },
      'MATIC': { baseVolatility: 5.5, atrMultiplier: 0.08, strength: 60 }
    };

    const profile = fallbackProfiles[baseCurrency] || { baseVolatility: 4.0, atrMultiplier: 0.05, strength: 60 };

    return {
      symbol,
      atr: currentPrice * profile.atrMultiplier,
      volatilityPercent: profile.baseVolatility,
      trend: 'sideways' as const,
      strength: profile.strength,
      supportLevel: currentPrice * 0.95,
      resistanceLevel: currentPrice * 1.05
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.priceCache.clear();
    this.volatilityCache.clear();
    apiErrorHandler.clearCache();
  }

  /**
   * Get API error handling metrics
   */
  getApiMetrics(): Record<string, any> {
    return apiErrorHandler.getAllMetrics();
  }

  /**
   * Reset circuit breaker for a specific operation
   */
  resetCircuitBreaker(operation: string, symbol?: string): void {
    const key = symbol ? `${operation}_${symbol}` : operation;
    apiErrorHandler.resetCircuitBreaker(key);
  }

  /**
   * Get health status of API operations
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'critical';
    details: Record<string, any>;
  } {
    const metrics = this.getApiMetrics();
    let healthyCount = 0;
    let totalCount = 0;
    const details: Record<string, any> = {};

    Object.entries(metrics).forEach(([key, metric]) => {
      totalCount++;
      const successRate = metric.totalRequests > 0
        ? (metric.successfulRequests / metric.totalRequests) * 100
        : 100;

      details[key] = {
        successRate: Math.round(successRate * 100) / 100,
        totalRequests: metric.totalRequests,
        averageResponseTime: Math.round(metric.averageResponseTime),
        circuitBreakerTrips: metric.circuitBreakerTrips,
        lastError: metric.lastError
      };

      if (successRate >= 90) healthyCount++;
    });

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (totalCount > 0) {
      const healthPercentage = (healthyCount / totalCount) * 100;
      if (healthPercentage < 50) {
        overall = 'critical';
      } else if (healthPercentage < 80) {
        overall = 'degraded';
      }
    }

    return { overall, details };
  }
}

// Export singleton instance
export const tradingApiService = TradingApiService.getInstance();
