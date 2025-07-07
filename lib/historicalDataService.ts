/**
 * Historical Data Service for Enhanced Backtesting System
 * Fetches and manages historical data from Binance API từ 2020 đến hiện tại
 */

import ccxt from 'ccxt';

// Types
export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: Date;
}

export interface DataQualityReport {
  totalCandles: number;
  missingCandles: number;
  dataCompleteness: number; // percentage
  anomalies: DataAnomaly[];
  recommendation: 'good' | 'acceptable' | 'poor';
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface DataAnomaly {
  type: 'missing_data' | 'price_spike' | 'zero_volume' | 'duplicate';
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface HistoricalDataRequest {
  symbol: string;
  timeframe: Timeframe;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

// Cache interface
interface CacheEntry {
  data: CandleData[];
  timestamp: number;
  expiresAt: number;
}

class HistoricalDataService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private readonly MAX_CANDLES_PER_REQUEST = 1000;
  private readonly RATE_LIMIT_DELAY = 100; // ms between requests

  /**
   * Fetch historical data từ Binance API
   */
  async fetchHistoricalData(params: HistoricalDataRequest): Promise<CandleData[]> {
    const { symbol, timeframe, startDate, endDate, limit } = params;
    
    try {
      console.log(`[HistoricalDataService] Fetching data for ${symbol} ${timeframe} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Check cache first
      const cachedData = await this.getCachedData(symbol, timeframe, startDate, endDate);
      if (cachedData) {
        console.log(`[HistoricalDataService] Using cached data for ${symbol} ${timeframe}`);
        return cachedData;
      }

      // Calculate time chunks để avoid rate limits
      const chunks = this.calculateTimeChunks(startDate, endDate, timeframe);
      let allCandles: CandleData[] = [];

      for (const chunk of chunks) {
        const chunkData = await this.fetchDataChunk(symbol, timeframe, chunk.start, chunk.end);
        allCandles = allCandles.concat(chunkData);
        
        // Rate limiting
        await this.delay(this.RATE_LIMIT_DELAY);
      }

      // Sort by timestamp
      allCandles.sort((a, b) => a.timestamp - b.timestamp);

      // Remove duplicates
      allCandles = this.removeDuplicates(allCandles);

      // Apply limit if specified
      if (limit && allCandles.length > limit) {
        allCandles = allCandles.slice(-limit);
      }

      // Cache the result
      await this.cacheHistoricalData(symbol, timeframe, startDate, endDate, allCandles);

      console.log(`[HistoricalDataService] Fetched ${allCandles.length} candles for ${symbol} ${timeframe}`);
      return allCandles;

    } catch (error) {
      console.error(`[HistoricalDataService] Error fetching data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch data chunk từ Binance API
   */
  private async fetchDataChunk(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<CandleData[]> {
    try {
      // Create CCXT Binance exchange instance
      const exchange = new ccxt.binance({
        // Use public API for historical data (no API keys needed)
        options: { adjustForTimeDifference: true },
        enableRateLimit: true,
      });

      // Convert timeframe to CCXT format
      const ccxtTimeframe = this.convertTimeframeToCCXT(timeframe);

      // Fetch OHLCV data
      const ohlcv = await exchange.fetchOHLCV(
        symbol,
        ccxtTimeframe,
        startDate.getTime(),
        this.MAX_CANDLES_PER_REQUEST
      );

      // Convert to CandleData format
      const candles: CandleData[] = ohlcv
        .filter(candle => {
          const candleTime = new Date(candle[0]);
          return candleTime >= startDate && candleTime <= endDate;
        })
        .map(candle => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
          date: new Date(candle[0])
        }));

      return candles;

    } catch (error) {
      console.error(`[HistoricalDataService] Error fetching chunk:`, error);
      return [];
    }
  }

  /**
   * Calculate time chunks để fetch data efficiently
   */
  private calculateTimeChunks(startDate: Date, endDate: Date, timeframe: Timeframe): Array<{start: Date, end: Date}> {
    const chunks: Array<{start: Date, end: Date}> = [];
    const timeframeMs = this.getTimeframeInMs(timeframe);
    const maxCandlesPerChunk = this.MAX_CANDLES_PER_REQUEST;
    const chunkDurationMs = maxCandlesPerChunk * timeframeMs;

    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + chunkDurationMs,
        endDate.getTime()
      ));
      
      chunks.push({
        start: new Date(currentStart),
        end: currentEnd
      });
      
      currentStart = new Date(currentEnd.getTime() + timeframeMs);
    }

    return chunks;
  }

  /**
   * Convert timeframe to milliseconds
   */
  private getTimeframeInMs(timeframe: Timeframe): number {
    const timeframes: Record<Timeframe, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe];
  }

  /**
   * Convert timeframe to CCXT format
   */
  private convertTimeframeToCCXT(timeframe: Timeframe): string {
    const mapping: Record<Timeframe, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    };
    return mapping[timeframe];
  }

  /**
   * Remove duplicate candles
   */
  private removeDuplicates(candles: CandleData[]): CandleData[] {
    const seen = new Set<number>();
    return candles.filter(candle => {
      if (seen.has(candle.timestamp)) {
        return false;
      }
      seen.add(candle.timestamp);
      return true;
    });
  }

  /**
   * Cache historical data
   */
  async cacheHistoricalData(
    symbol: string, 
    timeframe: Timeframe, 
    startDate: Date, 
    endDate: Date, 
    data: CandleData[]
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(symbol, timeframe, startDate, endDate);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
    
    this.cache.set(cacheKey, entry);
    console.log(`[HistoricalDataService] Cached ${data.length} candles for ${cacheKey}`);
  }

  /**
   * Get cached data
   */
  async getCachedData(
    symbol: string, 
    timeframe: Timeframe, 
    startDate: Date, 
    endDate: Date
  ): Promise<CandleData[] | null> {
    const cacheKey = this.generateCacheKey(symbol, timeframe, startDate, endDate);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(symbol: string, timeframe: Timeframe, startDate: Date, endDate: Date): string {
    return `${symbol}_${timeframe}_${startDate.getTime()}_${endDate.getTime()}`;
  }

  /**
   * Delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[HistoricalDataService] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; totalSize: number } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.data.length;
    }

    return {
      entries: this.cache.size,
      totalSize
    };
  }

  /**
   * Validate data quality
   */
  validateDataQuality(data: CandleData[]): DataQualityReport {
    const anomalies: DataAnomaly[] = [];
    let missingCandles = 0;

    if (data.length === 0) {
      return {
        totalCandles: 0,
        missingCandles: 0,
        dataCompleteness: 0,
        anomalies: [{
          type: 'missing_data',
          timestamp: Date.now(),
          description: 'No data available',
          severity: 'high'
        }],
        recommendation: 'poor',
        timeRange: {
          start: new Date(),
          end: new Date()
        }
      };
    }

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const timeRange = {
      start: sortedData[0].date,
      end: sortedData[sortedData.length - 1].date
    };

    // Check for missing candles (gaps in time series)
    for (let i = 1; i < sortedData.length; i++) {
      const currentCandle = sortedData[i];
      const previousCandle = sortedData[i - 1];
      const timeDiff = currentCandle.timestamp - previousCandle.timestamp;

      // Detect missing candles based on expected time interval
      const expectedInterval = this.detectTimeInterval(sortedData.slice(0, 10));
      if (timeDiff > expectedInterval * 1.5) {
        const missedCandles = Math.floor(timeDiff / expectedInterval) - 1;
        missingCandles += missedCandles;

        anomalies.push({
          type: 'missing_data',
          timestamp: previousCandle.timestamp,
          description: `Missing ${missedCandles} candles between ${previousCandle.date.toISOString()} and ${currentCandle.date.toISOString()}`,
          severity: missedCandles > 10 ? 'high' : missedCandles > 3 ? 'medium' : 'low'
        });
      }
    }

    // Check for price spikes (abnormal price movements)
    for (let i = 1; i < sortedData.length - 1; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];
      const next = sortedData[i + 1];

      const priceChange1 = Math.abs(current.close - previous.close) / previous.close;
      const priceChange2 = Math.abs(next.close - current.close) / current.close;

      // Detect price spikes (>20% change followed by reversal)
      if (priceChange1 > 0.2 && priceChange2 > 0.15) {
        anomalies.push({
          type: 'price_spike',
          timestamp: current.timestamp,
          description: `Price spike detected: ${(priceChange1 * 100).toFixed(2)}% change at ${current.date.toISOString()}`,
          severity: priceChange1 > 0.5 ? 'high' : 'medium'
        });
      }
    }

    // Check for zero volume
    const zeroVolumeCandles = sortedData.filter(candle => candle.volume === 0);
    zeroVolumeCandles.forEach(candle => {
      anomalies.push({
        type: 'zero_volume',
        timestamp: candle.timestamp,
        description: `Zero volume detected at ${candle.date.toISOString()}`,
        severity: 'low'
      });
    });

    // Calculate data completeness
    const expectedCandles = sortedData.length + missingCandles;
    const dataCompleteness = expectedCandles > 0 ? (sortedData.length / expectedCandles) * 100 : 0;

    // Determine recommendation
    let recommendation: 'good' | 'acceptable' | 'poor';
    if (dataCompleteness >= 95 && anomalies.filter(a => a.severity === 'high').length === 0) {
      recommendation = 'good';
    } else if (dataCompleteness >= 85 && anomalies.filter(a => a.severity === 'high').length <= 2) {
      recommendation = 'acceptable';
    } else {
      recommendation = 'poor';
    }

    return {
      totalCandles: sortedData.length,
      missingCandles,
      dataCompleteness,
      anomalies,
      recommendation,
      timeRange
    };
  }

  /**
   * Detect time interval from data sample
   */
  private detectTimeInterval(sample: CandleData[]): number {
    if (sample.length < 2) return 60000; // Default to 1 minute

    const intervals = [];
    for (let i = 1; i < sample.length; i++) {
      intervals.push(sample[i].timestamp - sample[i - 1].timestamp);
    }

    // Return most common interval
    const intervalCounts = new Map<number, number>();
    intervals.forEach(interval => {
      intervalCounts.set(interval, (intervalCounts.get(interval) || 0) + 1);
    });

    let mostCommonInterval = 60000;
    let maxCount = 0;
    for (const [interval, count] of intervalCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonInterval = interval;
      }
    }

    return mostCommonInterval;
  }

  /**
   * Fill missing data with interpolation
   */
  fillMissingData(data: CandleData[]): CandleData[] {
    if (data.length < 2) return data;

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const filledData: CandleData[] = [];
    const expectedInterval = this.detectTimeInterval(sortedData.slice(0, 10));

    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = sortedData[i];
      const next = sortedData[i + 1];

      filledData.push(current);

      const timeDiff = next.timestamp - current.timestamp;
      const missingCandles = Math.floor(timeDiff / expectedInterval) - 1;

      // Fill missing candles with interpolated data
      for (let j = 1; j <= missingCandles; j++) {
        const interpolatedTimestamp = current.timestamp + (j * expectedInterval);
        const ratio = j / (missingCandles + 1);

        const interpolatedCandle: CandleData = {
          timestamp: interpolatedTimestamp,
          open: current.close + (next.open - current.close) * ratio,
          high: Math.max(current.close, next.open) * (1 + Math.random() * 0.001),
          low: Math.min(current.close, next.open) * (1 - Math.random() * 0.001),
          close: current.close + (next.open - current.close) * ratio,
          volume: (current.volume + next.volume) / 2,
          date: new Date(interpolatedTimestamp)
        };

        filledData.push(interpolatedCandle);
      }
    }

    // Add the last candle
    filledData.push(sortedData[sortedData.length - 1]);

    return filledData;
  }

  /**
   * Get popular cryptocurrency symbols for backtesting
   */
  getPopularSymbols(): string[] {
    return [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT',
      'SOL/USDT', 'DOT/USDT', 'DOGE/USDT', 'AVAX/USDT', 'SHIB/USDT',
      'MATIC/USDT', 'LTC/USDT', 'UNI/USDT', 'LINK/USDT', 'ATOM/USDT',
      'ETC/USDT', 'XLM/USDT', 'BCH/USDT', 'ALGO/USDT', 'VET/USDT'
    ];
  }

  /**
   * Get available timeframes
   */
  getAvailableTimeframes(): Timeframe[] {
    return ['1m', '5m', '15m', '1h', '4h', '1d'];
  }

  /**
   * Get recommended date ranges for backtesting
   */
  getRecommendedDateRanges(): Array<{name: string, start: Date, end: Date}> {
    const now = new Date();
    return [
      {
        name: 'Last 30 Days',
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      },
      {
        name: 'Last 3 Months',
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: now
      },
      {
        name: 'Last 6 Months',
        start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        end: now
      },
      {
        name: 'Last Year',
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        end: now
      },
      {
        name: '2023 Full Year',
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      },
      {
        name: '2022 Full Year',
        start: new Date('2022-01-01'),
        end: new Date('2022-12-31')
      },
      {
        name: 'Since 2020',
        start: new Date('2020-01-01'),
        end: now
      }
    ];
  }
}

// Export singleton instance
export const historicalDataService = new HistoricalDataService();
