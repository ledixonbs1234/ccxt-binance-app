import { CandleData } from './historicalDataService';
import { TrailingStopStrategy, TrailingStopPosition } from '@/types/trailingStop';

export interface MarketCondition {
  trend: 'bullish' | 'bearish' | 'sideways';
  trendStrength: number; // 0-1
  volatility: 'low' | 'medium' | 'high';
  volatilityValue: number;
  volume: 'low' | 'medium' | 'high';
  volumeProfile: VolumeProfile;
  supportResistance: SupportResistanceLevel[];
  marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  confidence: number; // 0-1
}

export interface VolumeProfile {
  valueAreaHigh: number;
  valueAreaLow: number;
  pointOfControl: number;
  volumeNodes: VolumeNode[];
}

export interface VolumeNode {
  price: number;
  volume: number;
  significance: 'high' | 'medium' | 'low';
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-1
  touches: number;
  lastTouch: number;
}

export interface StrategyOptimization {
  recommendedStrategy: TrailingStopStrategy;
  confidence: number;
  parameters: {
    trailingPercent?: number;
    atrMultiplier?: number;
    lookbackPeriod?: number;
    volatilityThreshold?: number;
  };
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MarketAnalysisResult {
  symbol: string;
  timestamp: number;
  marketCondition: MarketCondition;
  strategyOptimization: StrategyOptimization;
  alerts: MarketAlert[];
}

export interface MarketAlert {
  type: 'trend_change' | 'volatility_spike' | 'volume_anomaly' | 'support_break' | 'resistance_break';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  data?: any;
}

export class MarketAnalysisService {
  private analysisCache = new Map<string, MarketAnalysisResult>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Analyze market conditions for a symbol
   */
  async analyzeMarket(symbol: string, candles: CandleData[]): Promise<MarketAnalysisResult> {
    const cacheKey = `${symbol}_${Date.now()}`;
    const cached = this.analysisCache.get(symbol);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached;
    }

    const marketCondition = this.analyzeMarketCondition(candles);
    const strategyOptimization = this.optimizeStrategy(marketCondition, candles);
    const alerts = this.generateAlerts(marketCondition, candles);

    const result: MarketAnalysisResult = {
      symbol,
      timestamp: Date.now(),
      marketCondition,
      strategyOptimization,
      alerts
    };

    this.analysisCache.set(symbol, result);
    return result;
  }

  /**
   * Analyze current market condition
   */
  private analyzeMarketCondition(candles: CandleData[]): MarketCondition {
    if (candles.length < 50) {
      throw new Error('Insufficient data for market analysis');
    }

    const trend = this.analyzeTrend(candles);
    const volatility = this.analyzeVolatility(candles);
    const volume = this.analyzeVolume(candles);
    const supportResistance = this.findSupportResistanceLevels(candles);
    const volumeProfile = this.calculateVolumeProfile(candles);
    const marketPhase = this.determineMarketPhase(candles, trend, volume);

    // Calculate overall confidence based on signal alignment
    const confidence = this.calculateConfidence(trend, volatility, volume);

    return {
      trend: trend.direction,
      trendStrength: trend.strength,
      volatility: volatility.level,
      volatilityValue: volatility.value,
      volume: volume.level,
      volumeProfile,
      supportResistance,
      marketPhase,
      confidence
    };
  }

  /**
   * Analyze trend direction and strength
   */
  private analyzeTrend(candles: CandleData[]): { direction: 'bullish' | 'bearish' | 'sideways', strength: number } {
    const closes = candles.map(c => c.close);
    const period = Math.min(20, closes.length);
    
    // Simple Moving Average trend
    const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const sma50 = closes.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
    const currentPrice = closes[closes.length - 1];

    // Linear regression for trend strength
    const { slope, rSquared } = this.calculateLinearRegression(closes.slice(-period));
    
    let direction: 'bullish' | 'bearish' | 'sideways';
    if (slope > 0.001 && currentPrice > sma20 && sma20 > sma50) {
      direction = 'bullish';
    } else if (slope < -0.001 && currentPrice < sma20 && sma20 < sma50) {
      direction = 'bearish';
    } else {
      direction = 'sideways';
    }

    const strength = Math.min(1, Math.abs(slope) * 1000 * rSquared);

    return { direction, strength };
  }

  /**
   * Analyze volatility
   */
  private analyzeVolatility(candles: CandleData[]): { level: 'low' | 'medium' | 'high', value: number } {
    const closes = candles.map(c => c.close);
    const returns = [];
    
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    let level: 'low' | 'medium' | 'high';
    if (volatility < 0.2) level = 'low';
    else if (volatility < 0.5) level = 'medium';
    else level = 'high';

    return { level, value: volatility };
  }

  /**
   * Analyze volume patterns
   */
  private analyzeVolume(candles: CandleData[]): { level: 'low' | 'medium' | 'high', trend: 'increasing' | 'decreasing' | 'stable' } {
    const volumes = candles.map(c => c.volume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentVolume = volumes.slice(-10).reduce((sum, v) => sum + v, 0) / 10;

    const volumeRatio = recentVolume / avgVolume;
    
    let level: 'low' | 'medium' | 'high';
    if (volumeRatio < 0.8) level = 'low';
    else if (volumeRatio < 1.5) level = 'medium';
    else level = 'high';

    // Volume trend
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    let trend: 'increasing' | 'decreasing' | 'stable';
    const trendRatio = secondAvg / firstAvg;
    if (trendRatio > 1.1) trend = 'increasing';
    else if (trendRatio < 0.9) trend = 'decreasing';
    else trend = 'stable';

    return { level, trend };
  }

  /**
   * Find support and resistance levels
   */
  private findSupportResistanceLevels(candles: CandleData[]): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const lookback = 10;

    // Find local highs (resistance)
    for (let i = lookback; i < highs.length - lookback; i++) {
      const isLocalHigh = highs.slice(i - lookback, i).every(h => h <= highs[i]) &&
                         highs.slice(i + 1, i + lookback + 1).every(h => h <= highs[i]);
      
      if (isLocalHigh) {
        const touches = this.countTouches(highs, highs[i], 0.001);
        levels.push({
          price: highs[i],
          type: 'resistance',
          strength: Math.min(1, touches / 5),
          touches,
          lastTouch: candles[i].timestamp
        });
      }
    }

    // Find local lows (support)
    for (let i = lookback; i < lows.length - lookback; i++) {
      const isLocalLow = lows.slice(i - lookback, i).every(l => l >= lows[i]) &&
                        lows.slice(i + 1, i + lookback + 1).every(l => l >= lows[i]);
      
      if (isLocalLow) {
        const touches = this.countTouches(lows, lows[i], 0.001);
        levels.push({
          price: lows[i],
          type: 'support',
          strength: Math.min(1, touches / 5),
          touches,
          lastTouch: candles[i].timestamp
        });
      }
    }

    // Sort by strength and return top levels
    return levels.sort((a, b) => b.strength - a.strength).slice(0, 10);
  }

  /**
   * Calculate volume profile
   */
  private calculateVolumeProfile(candles: CandleData[]): VolumeProfile {
    const priceVolumeMap = new Map<number, number>();
    
    candles.forEach(candle => {
      const priceRange = candle.high - candle.low;
      const priceStep = priceRange / 10; // Divide into 10 price levels
      
      for (let i = 0; i < 10; i++) {
        const price = Math.round((candle.low + i * priceStep) * 10000) / 10000;
        const volumeAtLevel = candle.volume / 10;
        priceVolumeMap.set(price, (priceVolumeMap.get(price) || 0) + volumeAtLevel);
      }
    });

    const volumeNodes: VolumeNode[] = Array.from(priceVolumeMap.entries())
      .map(([price, volume]) => ({
        price,
        volume,
        significance: (volume > 1000 ? 'high' : volume > 500 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      }))
      .sort((a, b) => b.volume - a.volume);

    const totalVolume = volumeNodes.reduce((sum, node) => sum + node.volume, 0);
    const valueAreaVolume = totalVolume * 0.7; // 70% of volume
    
    let accumulatedVolume = 0;
    const valueAreaNodes = [];
    
    for (const node of volumeNodes) {
      if (accumulatedVolume < valueAreaVolume) {
        valueAreaNodes.push(node);
        accumulatedVolume += node.volume;
      } else {
        break;
      }
    }

    const valueAreaPrices = valueAreaNodes.map(n => n.price).sort((a, b) => a - b);
    const pointOfControl = volumeNodes[0]?.price || 0;

    return {
      valueAreaHigh: valueAreaPrices[valueAreaPrices.length - 1] || 0,
      valueAreaLow: valueAreaPrices[0] || 0,
      pointOfControl,
      volumeNodes: volumeNodes.slice(0, 20) // Top 20 volume nodes
    };
  }

  /**
   * Determine market phase
   */
  private determineMarketPhase(
    candles: CandleData[], 
    trend: { direction: string, strength: number }, 
    volume: { level: string, trend: string }
  ): 'accumulation' | 'markup' | 'distribution' | 'markdown' {
    if (trend.direction === 'sideways' && volume.level === 'high') {
      return 'accumulation';
    } else if (trend.direction === 'bullish' && trend.strength > 0.6) {
      return 'markup';
    } else if (trend.direction === 'sideways' && volume.level === 'medium') {
      return 'distribution';
    } else if (trend.direction === 'bearish' && trend.strength > 0.6) {
      return 'markdown';
    }
    
    return 'accumulation'; // Default
  }

  /**
   * Optimize strategy based on market conditions
   */
  private optimizeStrategy(marketCondition: MarketCondition, candles: CandleData[]): StrategyOptimization {
    const reasoning: string[] = [];
    let recommendedStrategy: TrailingStopStrategy;
    let parameters: any = {};
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    // Strategy selection logic
    if (marketCondition.trend === 'bullish' && marketCondition.trendStrength > 0.7) {
      recommendedStrategy = 'atr';
      parameters = { atrMultiplier: 2.0, lookbackPeriod: 14 };
      reasoning.push('Strong bullish trend detected - ATR strategy recommended');
      riskLevel = 'medium';
    } else if (marketCondition.trend === 'bearish' && marketCondition.trendStrength > 0.7) {
      recommendedStrategy = 'atr';
      parameters = { atrMultiplier: 1.5, lookbackPeriod: 14 };
      reasoning.push('Strong bearish trend detected - Tight ATR strategy recommended');
      riskLevel = 'high';
    } else if (marketCondition.trend === 'sideways') {
      recommendedStrategy = 'support_resistance';
      parameters = { lookbackPeriod: 20 };
      reasoning.push('Sideways market - Support/Resistance strategy recommended');
      riskLevel = 'low';
    } else if (marketCondition.volatility === 'high') {
      recommendedStrategy = 'bollinger_bands';
      parameters = { lookbackPeriod: 20, stdDev: 2.0 };
      reasoning.push('High volatility detected - Bollinger Bands strategy recommended');
      riskLevel = 'high';
    } else {
      recommendedStrategy = 'dynamic';
      parameters = { adaptivePeriod: true };
      reasoning.push('Mixed market conditions - Dynamic strategy recommended');
      riskLevel = 'medium';
    }

    // Adjust parameters based on volatility
    if (marketCondition.volatility === 'high') {
      if (parameters.trailingPercent) {
        parameters.trailingPercent *= 1.5;
      }
      reasoning.push('Increased trailing distance due to high volatility');
    }

    return {
      recommendedStrategy,
      confidence: marketCondition.confidence,
      parameters,
      reasoning,
      riskLevel
    };
  }

  /**
   * Generate market alerts
   */
  private generateAlerts(marketCondition: MarketCondition, candles: CandleData[]): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    const currentPrice = candles[candles.length - 1].close;

    // Volatility spike alert
    if (marketCondition.volatility === 'high' && marketCondition.volatilityValue > 0.6) {
      alerts.push({
        type: 'volatility_spike',
        severity: 'high',
        message: `High volatility detected: ${(marketCondition.volatilityValue * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // Support/Resistance break alerts
    marketCondition.supportResistance.forEach(level => {
      const priceDistance = Math.abs(currentPrice - level.price) / level.price;
      if (priceDistance < 0.005) { // Within 0.5%
        alerts.push({
          type: level.type === 'support' ? 'support_break' : 'resistance_break',
          severity: level.strength > 0.7 ? 'high' : 'medium',
          message: `Price approaching ${level.type} level at ${level.price.toFixed(4)}`,
          timestamp: Date.now(),
          data: level
        });
      }
    });

    return alerts;
  }

  // Helper methods
  private calculateLinearRegression(values: number[]): { slope: number, rSquared: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = values.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, rSquared: Math.max(0, rSquared) };
  }

  private countTouches(prices: number[], level: number, tolerance: number): number {
    return prices.filter(price => Math.abs(price - level) / level <= tolerance).length;
  }

  private calculateConfidence(
    trend: { strength: number }, 
    volatility: { value: number }, 
    volume: { level: string }
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher trend strength increases confidence
    confidence += trend.strength * 0.3;

    // Moderate volatility is preferred
    if (volatility.value > 0.1 && volatility.value < 0.4) {
      confidence += 0.1;
    }

    // High volume increases confidence
    if (volume.level === 'high') {
      confidence += 0.1;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Get optimization recommendations for existing position
   */
  async getPositionOptimization(position: TrailingStopPosition, candles: CandleData[]): Promise<{
    shouldAdjust: boolean;
    newParameters?: any;
    reasoning: string[];
    riskAssessment: 'low' | 'medium' | 'high';
  }> {
    const analysis = await this.analyzeMarket(position.symbol, candles);
    const currentStrategy = position.strategy;
    const recommendedStrategy = analysis.strategyOptimization.recommendedStrategy;

    const shouldAdjust = currentStrategy !== recommendedStrategy ||
                        analysis.marketCondition.confidence < 0.6;

    const reasoning: string[] = [];
    let newParameters: any = {};

    if (shouldAdjust) {
      if (currentStrategy !== recommendedStrategy) {
        reasoning.push(`Strategy change recommended: ${currentStrategy} → ${recommendedStrategy}`);
      }

      if (analysis.marketCondition.volatility === 'high') {
        reasoning.push('Increased volatility requires parameter adjustment');
        newParameters.trailingPercent = (position.trailingPercent || 2) * 1.3;
      }

      if (analysis.marketCondition.trend === 'sideways') {
        reasoning.push('Sideways market - tighter stops recommended');
        newParameters.trailingPercent = (position.trailingPercent || 2) * 0.8;
      }
    }

    return {
      shouldAdjust,
      newParameters: shouldAdjust ? newParameters : undefined,
      reasoning,
      riskAssessment: analysis.strategyOptimization.riskLevel
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// Export singleton instance
export const marketAnalysisService = new MarketAnalysisService();
