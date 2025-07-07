import { TrailingStopStrategy } from '../types/trailingStop';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyCalculationParams {
  strategy: TrailingStopStrategy;
  currentPrice: number;
  candles: CandleData[];
  entryPrice: number;
  isLong: boolean;
  
  // Strategy-specific parameters
  trailingPercent: number;
  atrMultiplier?: number;
  atrPeriod?: number;
  fibonacciLevel?: number;
  fibonacciLookback?: number;
  bollingerPeriod?: number;
  bollingerStdDev?: number;
  volumeProfilePeriod?: number;
  valueAreaPercent?: number;
  smartMoneyStructure?: 'bos' | 'choch' | 'liquidity';
  orderBlockPeriod?: number;
  ichimokuTenkan?: number;
  ichimokuKijun?: number;
  ichimokuSenkou?: number;
  pivotType?: 'standard' | 'fibonacci' | 'woodie' | 'camarilla';
  pivotPeriod?: 'daily' | 'weekly' | 'monthly';
}

export interface StrategyCalculationResult {
  stopLoss: number;
  supportLevel?: number;
  resistanceLevel?: number;
  confidence: number; // 0-1
  indicators?: {
    atr?: number;
    fibonacciLevels?: number[];
    bollingerBands?: { upper: number; middle: number; lower: number };
    volumeProfile?: { poc: number; valueAreaHigh: number; valueAreaLow: number };
    pivotPoints?: { pivot: number; r1: number; r2: number; s1: number; s2: number };
    ichimoku?: { tenkan: number; kijun: number; senkouA: number; senkouB: number };
  };
}

// Utility functions
function calculateATR(candles: CandleData[], period: number): number {
  if (candles.length < period + 1) return 0;
  
  let trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
}

function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return 0;
  const slice = values.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateStandardDeviation(values: number[], period: number): number {
  if (values.length < period) return 0;
  const slice = values.slice(-period);
  const mean = slice.reduce((sum, val) => sum + val, 0) / period;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  return Math.sqrt(variance);
}

function findSwingHighLow(candles: CandleData[], lookback: number): { high: number; low: number; highIndex: number; lowIndex: number } {
  if (candles.length < lookback) {
    return { high: 0, low: 0, highIndex: -1, lowIndex: -1 };
  }
  
  const recentCandles = candles.slice(-lookback);
  let high = recentCandles[0].high;
  let low = recentCandles[0].low;
  let highIndex = 0;
  let lowIndex = 0;
  
  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > high) {
      high = recentCandles[i].high;
      highIndex = i;
    }
    if (recentCandles[i].low < low) {
      low = recentCandles[i].low;
      lowIndex = i;
    }
  }
  
  return { high, low, highIndex, lowIndex };
}

// Strategy calculation functions
function calculatePercentageStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, entryPrice, isLong, trailingPercent } = params;
  
  const trailingDistance = currentPrice * (trailingPercent / 100);
  const stopLoss = isLong 
    ? currentPrice - trailingDistance
    : currentPrice + trailingDistance;
  
  return {
    stopLoss,
    confidence: 0.7
  };
}

function calculateATRStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, atrMultiplier = 2, atrPeriod = 14 } = params;

  const atr = calculateATR(candles, atrPeriod);
  const trailingDistance = atr * atrMultiplier;

  const stopLoss = isLong
    ? currentPrice - trailingDistance
    : currentPrice + trailingDistance;

  return {
    stopLoss,
    confidence: 0.8,
    indicators: { atr }
  };
}

function calculateDynamicStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, entryPrice } = params;

  if (candles.length < 50) {
    return calculatePercentageStrategy(params);
  }

  // Analyze market conditions dynamically
  const marketAnalysis = analyzeMarketConditions(candles);
  const volatility = calculateVolatility(candles, 20);
  const trend = analyzeTrend(candles, 20);
  const volume = analyzeVolumeProfile(candles, 20);

  // Dynamic strategy selection based on market conditions
  let selectedStrategy: TrailingStopStrategy;
  let confidence = 0.75;

  if (marketAnalysis.condition === 'trending' && trend.strength > 0.7) {
    // Strong trend - use ATR with tighter stops
    selectedStrategy = 'atr';
    const atr = calculateATR(candles, 14);
    const dynamicMultiplier = Math.max(1.5, Math.min(3.0, 2.0 - trend.strength));
    const trailingDistance = atr * dynamicMultiplier;

    const stopLoss = isLong
      ? currentPrice - trailingDistance
      : currentPrice + trailingDistance;

    confidence = 0.85;
    return {
      stopLoss,
      confidence,
      indicators: {
        atr,
        trendStrength: trend.strength,
        selectedStrategy: 'atr',
        dynamicMultiplier
      }
    };

  } else if (marketAnalysis.condition === 'ranging' || volatility.normalized < 0.3) {
    // Ranging market - use support/resistance levels
    selectedStrategy = 'support_resistance';
    const levels = findSupportResistanceLevels(candles, 20);

    const stopLoss = isLong
      ? Math.max(...levels.support.filter(s => s < currentPrice))
      : Math.min(...levels.resistance.filter(r => r > currentPrice));

    confidence = 0.8;
    return {
      stopLoss: stopLoss || (isLong ? currentPrice * 0.98 : currentPrice * 1.02),
      confidence,
      supportLevel: isLong ? stopLoss : undefined,
      resistanceLevel: !isLong ? stopLoss : undefined,
      indicators: {
        supportLevels: levels.support,
        resistanceLevels: levels.resistance,
        selectedStrategy: 'support_resistance'
      }
    };

  } else if (volatility.normalized > 0.7) {
    // High volatility - use Bollinger Bands
    selectedStrategy = 'bollinger_bands';
    const bb = calculateBollingerBands(candles, 20, 2);

    const stopLoss = isLong
      ? Math.max(bb.lower, currentPrice * 0.95)
      : Math.min(bb.upper, currentPrice * 1.05);

    confidence = 0.82;
    return {
      stopLoss,
      confidence,
      indicators: {
        bollingerBands: bb,
        volatility: volatility.normalized,
        selectedStrategy: 'bollinger_bands'
      }
    };

  } else {
    // Mixed conditions - use hybrid approach
    selectedStrategy = 'hybrid';
    const atrResult = calculateATRStrategy(params);
    const fibResult = calculateFibonacciStrategy(params);

    // Weight based on market conditions
    const atrWeight = trend.strength * 0.6;
    const fibWeight = (1 - trend.strength) * 0.4;

    const combinedStopLoss = (
      atrResult.stopLoss * atrWeight +
      fibResult.stopLoss * fibWeight
    );

    confidence = 0.88;
    return {
      stopLoss: combinedStopLoss,
      confidence,
      indicators: {
        atr: atrResult.indicators?.atr,
        fibonacciLevels: fibResult.indicators?.fibonacciLevels,
        selectedStrategy: 'hybrid',
        weights: { atr: atrWeight, fibonacci: fibWeight }
      }
    };
  }
}

// Helper functions for dynamic strategy
function analyzeMarketConditions(candles: CandleData[]): {
  condition: 'trending' | 'ranging' | 'volatile';
  strength: number;
} {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Calculate trend strength using linear regression
  const trendStrength = calculateTrendStrength(closes);

  // Calculate range vs trend ratio
  const avgRange = candles.reduce((sum, c) => sum + (c.high - c.low), 0) / candles.length;
  const priceRange = Math.max(...highs) - Math.min(...lows);
  const rangeRatio = avgRange / priceRange;

  if (trendStrength > 0.6) {
    return { condition: 'trending', strength: trendStrength };
  } else if (rangeRatio > 0.7) {
    return { condition: 'ranging', strength: rangeRatio };
  } else {
    return { condition: 'volatile', strength: 1 - Math.min(trendStrength, rangeRatio) };
  }
}

function calculateTrendStrength(prices: number[]): number {
  if (prices.length < 10) return 0;

  // Simple linear regression to determine trend strength
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);

  const rSquared = 1 - (ssRes / ssTot);
  return Math.max(0, Math.min(1, rSquared));
}

function analyzeTrend(candles: CandleData[], period: number): {
  direction: 'up' | 'down' | 'sideways';
  strength: number;
} {
  const closes = candles.slice(-period).map(c => c.close);
  const strength = calculateTrendStrength(closes);

  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];

  let direction: 'up' | 'down' | 'sideways';
  if (lastPrice > firstPrice * 1.02) {
    direction = 'up';
  } else if (lastPrice < firstPrice * 0.98) {
    direction = 'down';
  } else {
    direction = 'sideways';
  }

  return { direction, strength };
}

function calculateVolatility(candles: CandleData[], period: number): {
  value: number;
  normalized: number;
} {
  const recentCandles = candles.slice(-period);
  const returns = [];

  for (let i = 1; i < recentCandles.length; i++) {
    const return_ = Math.log(recentCandles[i].close / recentCandles[i - 1].close);
    returns.push(return_);
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

  // Normalize volatility (0-1 scale, where 1 is very high volatility)
  const normalized = Math.min(1, volatility / 2); // 200% annual volatility = 1

  return { value: volatility, normalized };
}

function analyzeVolumeProfile(candles: CandleData[], period: number): {
  valueAreaHigh: number;
  valueAreaLow: number;
  poc: number; // Point of Control
} {
  const recentCandles = candles.slice(-period);
  const priceVolume: { [price: string]: number } = {};

  // Build volume profile
  recentCandles.forEach(candle => {
    const price = candle.close.toFixed(8);
    priceVolume[price] = (priceVolume[price] || 0) + candle.volume;
  });

  // Find Point of Control (highest volume price)
  let maxVolume = 0;
  let poc = 0;

  Object.entries(priceVolume).forEach(([price, volume]) => {
    if (volume > maxVolume) {
      maxVolume = volume;
      poc = parseFloat(price);
    }
  });

  // Calculate Value Area (70% of volume)
  const totalVolume = Object.values(priceVolume).reduce((sum, vol) => sum + vol, 0);
  const targetVolume = totalVolume * 0.7;

  const sortedPrices = Object.keys(priceVolume)
    .map(p => parseFloat(p))
    .sort((a, b) => a - b);

  let accumulatedVolume = 0;
  let valueAreaLow = sortedPrices[0];
  let valueAreaHigh = sortedPrices[sortedPrices.length - 1];

  // Find value area bounds
  for (let i = 0; i < sortedPrices.length && accumulatedVolume < targetVolume; i++) {
    const price = sortedPrices[i];
    accumulatedVolume += priceVolume[price.toFixed(8)] || 0;

    if (accumulatedVolume >= targetVolume * 0.15) {
      valueAreaLow = price;
    }
    if (accumulatedVolume >= targetVolume * 0.85) {
      valueAreaHigh = price;
      break;
    }
  }

  return { valueAreaHigh, valueAreaLow, poc };
}

function findSupportResistanceLevels(candles: CandleData[], period: number): {
  support: number[];
  resistance: number[];
} {
  const recentCandles = candles.slice(-period);
  const support: number[] = [];
  const resistance: number[] = [];

  // Find local highs and lows
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const current = recentCandles[i];
    const prev2 = recentCandles[i - 2];
    const prev1 = recentCandles[i - 1];
    const next1 = recentCandles[i + 1];
    const next2 = recentCandles[i + 2];

    // Local high (resistance)
    if (current.high > prev2.high && current.high > prev1.high &&
        current.high > next1.high && current.high > next2.high) {
      resistance.push(current.high);
    }

    // Local low (support)
    if (current.low < prev2.low && current.low < prev1.low &&
        current.low < next1.low && current.low < next2.low) {
      support.push(current.low);
    }
  }

  return { support, resistance };
}

function calculateFibonacciStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, fibonacciLevel = 0.618, fibonacciLookback = 20 } = params;
  
  const swingPoints = findSwingHighLow(candles, fibonacciLookback);
  const range = swingPoints.high - swingPoints.low;
  
  const fibonacciLevels = [0.236, 0.382, 0.5, 0.618, 0.786].map(level => 
    isLong 
      ? swingPoints.high - (range * level)
      : swingPoints.low + (range * level)
  );
  
  // Find closest fibonacci level as stop loss
  const targetLevel = isLong 
    ? swingPoints.high - (range * fibonacciLevel)
    : swingPoints.low + (range * fibonacciLevel);
  
  const stopLoss = isLong
    ? Math.min(targetLevel, currentPrice * 0.98) // Don't go too far
    : Math.max(targetLevel, currentPrice * 1.02);
  
  return {
    stopLoss,
    supportLevel: isLong ? targetLevel : undefined,
    resistanceLevel: !isLong ? targetLevel : undefined,
    confidence: 0.85,
    indicators: { fibonacciLevels }
  };
}

function calculateBollingerBandsStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, bollingerPeriod = 20, bollingerStdDev = 2 } = params;
  
  const closes = candles.map(c => c.close);
  const sma = calculateSMA(closes, bollingerPeriod);
  const stdDev = calculateStandardDeviation(closes, bollingerPeriod);
  
  const upperBand = sma + (stdDev * bollingerStdDev);
  const lowerBand = sma - (stdDev * bollingerStdDev);
  
  const stopLoss = isLong ? lowerBand : upperBand;
  
  return {
    stopLoss,
    supportLevel: isLong ? lowerBand : undefined,
    resistanceLevel: !isLong ? upperBand : undefined,
    confidence: 0.75,
    indicators: {
      bollingerBands: {
        upper: upperBand,
        middle: sma,
        lower: lowerBand
      }
    }
  };
}

function calculateVolumeProfileStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, volumeProfilePeriod = 50, valueAreaPercent = 70 } = params;
  
  if (candles.length < volumeProfilePeriod) {
    return calculatePercentageStrategy(params);
  }
  
  const recentCandles = candles.slice(-volumeProfilePeriod);
  
  // Simplified volume profile calculation
  // In reality, this would be much more complex with price levels and volume distribution
  const totalVolume = recentCandles.reduce((sum, candle) => sum + candle.volume, 0);
  const avgVolume = totalVolume / recentCandles.length;
  
  // Find high volume areas (simplified)
  const highVolumeCandles = recentCandles.filter(c => c.volume > avgVolume * 1.5);
  const poc = highVolumeCandles.length > 0 
    ? highVolumeCandles.reduce((sum, c) => sum + c.close, 0) / highVolumeCandles.length
    : currentPrice;
  
  // Value area calculation (simplified)
  const priceRange = Math.max(...recentCandles.map(c => c.high)) - Math.min(...recentCandles.map(c => c.low));
  const valueAreaRange = priceRange * (valueAreaPercent / 100);
  
  const valueAreaHigh = poc + (valueAreaRange / 2);
  const valueAreaLow = poc - (valueAreaRange / 2);
  
  const stopLoss = isLong ? valueAreaLow : valueAreaHigh;
  
  return {
    stopLoss,
    supportLevel: isLong ? valueAreaLow : undefined,
    resistanceLevel: !isLong ? valueAreaHigh : undefined,
    confidence: 0.82,
    indicators: {
      volumeProfile: {
        poc,
        valueAreaHigh,
        valueAreaLow
      }
    }
  };
}

function calculateSmartMoneyStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, smartMoneyStructure = 'bos', orderBlockPeriod = 10 } = params;
  
  if (candles.length < orderBlockPeriod * 2) {
    return calculatePercentageStrategy(params);
  }
  
  // Simplified smart money concepts
  // In reality, this would involve complex market structure analysis
  const recentCandles = candles.slice(-orderBlockPeriod * 2);
  
  // Find potential order blocks (simplified)
  const orderBlocks: number[] = [];
  for (let i = orderBlockPeriod; i < recentCandles.length - orderBlockPeriod; i++) {
    const candle = recentCandles[i];
    const prevCandles = recentCandles.slice(i - orderBlockPeriod, i);
    const nextCandles = recentCandles.slice(i + 1, i + orderBlockPeriod + 1);
    
    // High volume candle with significant price movement
    const avgVolume = prevCandles.reduce((sum, c) => sum + c.volume, 0) / prevCandles.length;
    if (candle.volume > avgVolume * 2) {
      orderBlocks.push(isLong ? candle.low : candle.high);
    }
  }
  
  // Use closest order block as stop loss
  const stopLoss = orderBlocks.length > 0
    ? (isLong 
        ? Math.max(...orderBlocks.filter(ob => ob < currentPrice))
        : Math.min(...orderBlocks.filter(ob => ob > currentPrice)))
    : (isLong ? currentPrice * 0.97 : currentPrice * 1.03);
  
  return {
    stopLoss: stopLoss || (isLong ? currentPrice * 0.97 : currentPrice * 1.03),
    confidence: 0.88,
    supportLevel: isLong ? stopLoss : undefined,
    resistanceLevel: !isLong ? stopLoss : undefined
  };
}

function calculateIchimokuStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { 
    currentPrice, candles, isLong, 
    ichimokuTenkan = 9, ichimokuKijun = 26, ichimokuSenkou = 52 
  } = params;
  
  if (candles.length < ichimokuSenkou) {
    return calculatePercentageStrategy(params);
  }
  
  // Tenkan-sen (Conversion Line)
  const tenkanHighs = candles.slice(-ichimokuTenkan).map(c => c.high);
  const tenkanLows = candles.slice(-ichimokuTenkan).map(c => c.low);
  const tenkan = (Math.max(...tenkanHighs) + Math.min(...tenkanLows)) / 2;
  
  // Kijun-sen (Base Line)
  const kijunHighs = candles.slice(-ichimokuKijun).map(c => c.high);
  const kijunLows = candles.slice(-ichimokuKijun).map(c => c.low);
  const kijun = (Math.max(...kijunHighs) + Math.min(...kijunLows)) / 2;
  
  // Senkou Span A (Leading Span A)
  const senkouA = (tenkan + kijun) / 2;
  
  // Senkou Span B (Leading Span B)
  const senkouHighs = candles.slice(-ichimokuSenkou).map(c => c.high);
  const senkouLows = candles.slice(-ichimokuSenkou).map(c => c.low);
  const senkouB = (Math.max(...senkouHighs) + Math.min(...senkouLows)) / 2;
  
  // Use cloud as support/resistance
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  
  const stopLoss = isLong ? cloudBottom : cloudTop;
  
  return {
    stopLoss,
    supportLevel: isLong ? cloudBottom : undefined,
    resistanceLevel: !isLong ? cloudTop : undefined,
    confidence: 0.83,
    indicators: {
      ichimoku: {
        tenkan,
        kijun,
        senkouA,
        senkouB
      }
    }
  };
}

function calculatePivotPointsStrategy(params: StrategyCalculationParams): StrategyCalculationResult {
  const { currentPrice, candles, isLong, pivotType = 'standard' } = params;
  
  if (candles.length < 1) {
    return calculatePercentageStrategy(params);
  }
  
  // Use previous day's data for pivot calculation
  const prevCandle = candles[candles.length - 1];
  const high = prevCandle.high;
  const low = prevCandle.low;
  const close = prevCandle.close;
  
  let pivot: number;
  let r1: number, r2: number, s1: number, s2: number;
  
  switch (pivotType) {
    case 'fibonacci':
      pivot = (high + low + close) / 3;
      r1 = pivot + 0.382 * (high - low);
      r2 = pivot + 0.618 * (high - low);
      s1 = pivot - 0.382 * (high - low);
      s2 = pivot - 0.618 * (high - low);
      break;
    
    case 'woodie':
      pivot = (high + low + 2 * close) / 4;
      r1 = 2 * pivot - low;
      r2 = pivot + high - low;
      s1 = 2 * pivot - high;
      s2 = pivot - high + low;
      break;
    
    case 'camarilla':
      pivot = (high + low + close) / 3;
      r1 = close + 1.1 * (high - low) / 12;
      r2 = close + 1.1 * (high - low) / 6;
      s1 = close - 1.1 * (high - low) / 12;
      s2 = close - 1.1 * (high - low) / 6;
      break;
    
    default: // standard
      pivot = (high + low + close) / 3;
      r1 = 2 * pivot - low;
      r2 = pivot + high - low;
      s1 = 2 * pivot - high;
      s2 = pivot - high + low;
  }
  
  const stopLoss = isLong ? s1 : r1;
  
  return {
    stopLoss,
    supportLevel: isLong ? s1 : undefined,
    resistanceLevel: !isLong ? r1 : undefined,
    confidence: 0.78,
    indicators: {
      pivotPoints: { pivot, r1, r2, s1, s2 }
    }
  };
}

// Main calculation function
export function calculateTrailingStop(params: StrategyCalculationParams): StrategyCalculationResult {
  switch (params.strategy) {
    case 'percentage':
      return calculatePercentageStrategy(params);
    
    case 'atr':
      return calculateATRStrategy(params);

    case 'dynamic':
      return calculateDynamicStrategy(params);
    
    case 'fibonacci':
      return calculateFibonacciStrategy(params);
    
    case 'bollinger_bands':
      return calculateBollingerBandsStrategy(params);
    
    case 'volume_profile':
      return calculateVolumeProfileStrategy(params);
    
    case 'smart_money':
      return calculateSmartMoneyStrategy(params);
    
    case 'ichimoku':
      return calculateIchimokuStrategy(params);
    
    case 'pivot_points':
      return calculatePivotPointsStrategy(params);
    
    case 'support_resistance':
      // Simplified - would need more complex S/R detection
      return calculatePercentageStrategy(params);
    
    case 'hybrid':
      // Combine multiple strategies
      const atrResult = calculateATRStrategy(params);
      const fibResult = calculateFibonacciStrategy(params);
      const volumeResult = calculateVolumeProfileStrategy(params);
      
      // Weighted average of stop losses
      const combinedStopLoss = (
        atrResult.stopLoss * 0.3 +
        fibResult.stopLoss * 0.4 +
        volumeResult.stopLoss * 0.3
      );
      
      return {
        stopLoss: combinedStopLoss,
        confidence: 0.92,
        supportLevel: params.isLong ? combinedStopLoss : undefined,
        resistanceLevel: !params.isLong ? combinedStopLoss : undefined,
        indicators: {
          atr: atrResult.indicators?.atr,
          fibonacciLevels: fibResult.indicators?.fibonacciLevels,
          volumeProfile: volumeResult.indicators?.volumeProfile
        }
      };
    
    default:
      return calculatePercentageStrategy(params);
  }
}
