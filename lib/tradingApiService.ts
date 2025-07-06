// Trading API Service - Utility for real market data
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
   * Lấy giá hiện tại của symbol từ API ticker
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Kiểm tra cache trước
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.price;
      }

      const response = await fetch(`/api/ticker?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error(`API ticker error: ${response.status} ${response.statusText}`);
      }

      const tickerData: TickerData = await response.json();
      
      if (!tickerData.last || isNaN(tickerData.last)) {
        throw new Error(`Invalid price data for ${symbol}`);
      }

      // Lưu vào cache
      this.priceCache.set(symbol, {
        price: tickerData.last,
        timestamp: Date.now()
      });

      return tickerData.last;
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      
      // Fallback với giá mặc định dựa trên symbol
      return this.getFallbackPrice(symbol);
    }
  }

  /**
   * Lấy dữ liệu ticker đầy đủ
   */
  async getTickerData(symbol: string): Promise<TickerData> {
    try {
      const response = await fetch(`/api/ticker?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error(`API ticker error: ${response.status} ${response.statusText}`);
      }

      const tickerData: TickerData = await response.json();
      return tickerData;
    } catch (error) {
      console.error(`Error fetching ticker data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu nến (OHLCV) từ API
   */
  async getCandleData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<CandleData[]> {
    try {
      const response = await fetch(
        `/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API candles error: ${response.status} ${response.statusText}`);
      }

      const rawData: number[][] = await response.json();
      
      // Chuyển đổi từ format CCXT [timestamp, open, high, low, close, volume]
      const candleData: CandleData[] = rawData.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

      return candleData;
    } catch (error) {
      console.error(`Error fetching candle data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Tính toán volatility từ dữ liệu thực tế
   */
  async calculateVolatility(symbol: string): Promise<MarketVolatilityData> {
    try {
      // Kiểm tra cache
      const cached = this.volatilityCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.VOLATILITY_CACHE_DURATION) {
        return cached.data;
      }

      // Lấy dữ liệu nến 1 giờ cho 100 periods gần nhất
      const candles = await this.getCandleData(symbol, '1h', 100);
      
      if (candles.length < 14) {
        throw new Error(`Insufficient candle data for ${symbol}`);
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
    } catch (error) {
      console.error(`Error calculating volatility for ${symbol}:`, error);
      
      // Fallback với dữ liệu mặc định
      return this.getFallbackVolatility(symbol);
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
      'BTC': 45000,
      'ETH': 3200,
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
   * Fallback volatility khi không thể tính toán
   */
  private getFallbackVolatility(symbol: string): MarketVolatilityData {
    const baseCurrency = symbol.split('/')[0];
    const currentPrice = this.getFallbackPrice(symbol);
    
    const fallbackProfiles: Record<string, { baseVolatility: number; atrMultiplier: number; strength: number }> = {
      'BTC': { baseVolatility: 2.5, atrMultiplier: 0.02, strength: 75 },
      'ETH': { baseVolatility: 3.0, atrMultiplier: 0.025, strength: 70 },
      'PEPE': { baseVolatility: 8.0, atrMultiplier: 0.15, strength: 45 },
      'DOGE': { baseVolatility: 6.0, atrMultiplier: 0.08, strength: 50 },
      'SHIB': { baseVolatility: 7.5, atrMultiplier: 0.12, strength: 40 }
    };

    const profile = fallbackProfiles[baseCurrency] || { baseVolatility: 4.0, atrMultiplier: 0.05, strength: 60 };

    return {
      symbol,
      atr: currentPrice * profile.atrMultiplier,
      volatilityPercent: profile.baseVolatility,
      trend: 'sideways',
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
  }
}

// Export singleton instance
export const tradingApiService = TradingApiService.getInstance();
