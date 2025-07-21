/**
 * Strategy Switching Service for Dynamic Trailing Stop Management
 * Allows flexible switching between strategies based on market conditions
 */

import { TrailingStopStrategy, TrailingStopPosition } from '@/types/trailingStop';
import { calculateTrailingStop, StrategyCalculationParams, CandleData } from './strategyCalculations';

export interface StrategySwitchingRule {
  id: string;
  name: string;
  nameVi: string;
  fromStrategy: TrailingStopStrategy;
  toStrategy: TrailingStopStrategy;
  condition: StrategySwitchingCondition;
  priority: number; // Higher priority rules are checked first
  enabled: boolean;
}

export interface StrategySwitchingCondition {
  type: 'market_condition' | 'performance' | 'volatility' | 'trend' | 'time' | 'price_action';
  
  // Market condition triggers
  marketCondition?: 'trending' | 'ranging' | 'volatile' | 'breakout';
  trendStrength?: { min?: number; max?: number };
  volatilityLevel?: { min?: number; max?: number };
  
  // Performance triggers
  unrealizedPnL?: { min?: number; max?: number };
  drawdown?: { max?: number };
  winRate?: { min?: number };
  
  // Time-based triggers
  timeInPosition?: { min?: number; max?: number }; // minutes
  timeOfDay?: { start?: string; end?: string }; // HH:MM format
  
  // Price action triggers
  priceMovement?: { 
    direction: 'up' | 'down';
    percentage: number;
    timeframe: number; // minutes
  };
  
  // Technical indicators
  rsi?: { min?: number; max?: number };
  macdSignal?: 'bullish' | 'bearish';
}

export interface StrategySwitchingEvent {
  id: string;
  positionId: string;
  timestamp: number;
  fromStrategy: TrailingStopStrategy;
  toStrategy: TrailingStopStrategy;
  reason: string;
  marketConditions: any;
  performance: {
    beforeSwitch: number;
    afterSwitch?: number;
  };
}

export class StrategySwitchingService {
  private switchingRules: StrategySwitchingRule[] = [];
  private switchingHistory: StrategySwitchingEvent[] = [];
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.switchingRules = [
      {
        id: 'trending-to-atr',
        name: 'Switch to ATR in Strong Trends',
        nameVi: 'Chuyển sang ATR khi xu hướng mạnh',
        fromStrategy: 'percentage',
        toStrategy: 'atr',
        condition: {
          type: 'trend',
          trendStrength: { min: 0.7 }
        },
        priority: 10,
        enabled: true
      },
      {
        id: 'ranging-to-support-resistance',
        name: 'Switch to Support/Resistance in Ranging Markets',
        nameVi: 'Chuyển sang Hỗ trợ/Kháng cự khi thị trường sideway',
        fromStrategy: 'atr',
        toStrategy: 'support_resistance',
        condition: {
          type: 'market_condition',
          marketCondition: 'ranging',
          volatilityLevel: { max: 0.3 }
        },
        priority: 9,
        enabled: true
      },
      {
        id: 'high-volatility-to-bollinger',
        name: 'Switch to Bollinger Bands in High Volatility',
        nameVi: 'Chuyển sang Bollinger Bands khi biến động cao',
        fromStrategy: 'percentage',
        toStrategy: 'bollinger_bands',
        condition: {
          type: 'volatility',
          volatilityLevel: { min: 0.6 }
        },
        priority: 8,
        enabled: true
      },
      {
        id: 'drawdown-protection',
        name: 'Switch to Conservative Strategy on High Drawdown',
        nameVi: 'Chuyển sang chiến lược bảo thủ khi drawdown cao',
        fromStrategy: 'smart_money',
        toStrategy: 'percentage',
        condition: {
          type: 'performance',
          drawdown: { max: -5 }
        },
        priority: 15, // High priority for risk management
        enabled: true
      },
      {
        id: 'profit-protection',
        name: 'Switch to Tight Trailing on High Profits',
        nameVi: 'Chuyển sang trailing chặt khi lợi nhuận cao',
        fromStrategy: 'atr',
        toStrategy: 'fibonacci',
        condition: {
          type: 'performance',
          unrealizedPnL: { min: 10 }
        },
        priority: 12,
        enabled: true
      },
      {
        id: 'breakout-to-dynamic',
        name: 'Switch to Dynamic Strategy on Breakouts',
        nameVi: 'Chuyển sang Dynamic khi breakout',
        fromStrategy: 'support_resistance',
        toStrategy: 'dynamic',
        condition: {
          type: 'price_action',
          priceMovement: {
            direction: 'up',
            percentage: 3,
            timeframe: 15
          }
        },
        priority: 11,
        enabled: true
      }
    ];
  }

  /**
   * Add custom switching rule
   */
  addSwitchingRule(rule: StrategySwitchingRule): void {
    this.switchingRules.push(rule);
    this.switchingRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove switching rule
   */
  removeSwitchingRule(ruleId: string): void {
    this.switchingRules = this.switchingRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Enable/disable switching rule
   */
  toggleSwitchingRule(ruleId: string, enabled: boolean): void {
    const rule = this.switchingRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Evaluate if strategy should be switched for a position
   */
  async evaluateStrategySwitching(
    position: TrailingStopPosition,
    candles: CandleData[],
    marketData: any
  ): Promise<{
    shouldSwitch: boolean;
    newStrategy?: TrailingStopStrategy;
    reason?: string;
    rule?: StrategySwitchingRule;
  }> {
    const enabledRules = this.switchingRules.filter(rule => 
      rule.enabled && rule.fromStrategy === position.strategy
    );

    for (const rule of enabledRules) {
      const shouldSwitch = await this.evaluateCondition(
        rule.condition, 
        position, 
        candles, 
        marketData
      );

      if (shouldSwitch) {
        return {
          shouldSwitch: true,
          newStrategy: rule.toStrategy,
          reason: rule.nameVi,
          rule
        };
      }
    }

    return { shouldSwitch: false };
  }

  /**
   * Execute strategy switch for a position
   */
  async executeStrategySwitch(
    position: TrailingStopPosition,
    newStrategy: TrailingStopStrategy,
    reason: string,
    candles: CandleData[]
  ): Promise<TrailingStopPosition> {
    const oldStrategy = position.strategy;
    
    // Calculate new stop loss with new strategy
    const params: StrategyCalculationParams = {
      strategy: newStrategy,
      currentPrice: position.currentPrice,
      candles,
      entryPrice: position.entryPrice,
      isLong: position.side === 'buy',
      trailingPercent: position.trailingPercent,
      atrMultiplier: position.atrMultiplier,
      fibonacciLevel: position.fibonacciLevel,
      bollingerPeriod: position.bollingerPeriod,
      bollingerStdDev: position.bollingerStdDev,
      volumeProfilePeriod: position.volumeProfilePeriod,
      smartMoneyStructure: position.smartMoneyStructure
    };

    const result = calculateTrailingStop(params);

    // Update position with new strategy
    const updatedPosition: TrailingStopPosition = {
      ...position,
      strategy: newStrategy,
      stopLossPrice: result.stopLoss,
      supportResistanceLevel: result.supportLevel || result.resistanceLevel
    };

    // Record switching event
    const switchingEvent: StrategySwitchingEvent = {
      id: `switch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      positionId: position.id,
      timestamp: Date.now(),
      fromStrategy: oldStrategy,
      toStrategy: newStrategy,
      reason,
      marketConditions: {
        price: position.currentPrice,
        volatility: candles.length > 0 ? this.calculateVolatility(candles) : 0
      },
      performance: {
        beforeSwitch: position.unrealizedPnL
      }
    };

    this.switchingHistory.push(switchingEvent);

    console.log(`[StrategySwitching] Position ${position.id}: ${oldStrategy} → ${newStrategy} (${reason})`);

    return updatedPosition;
  }

  /**
   * Get switching history for analysis
   */
  getSwitchingHistory(positionId?: string): StrategySwitchingEvent[] {
    if (positionId) {
      return this.switchingHistory.filter(event => event.positionId === positionId);
    }
    return [...this.switchingHistory];
  }

  /**
   * Get switching rules
   */
  getSwitchingRules(): StrategySwitchingRule[] {
    return [...this.switchingRules];
  }

  /**
   * Clear switching history
   */
  clearSwitchingHistory(): void {
    this.switchingHistory = [];
  }

  private async evaluateCondition(
    condition: StrategySwitchingCondition,
    position: TrailingStopPosition,
    candles: CandleData[],
    marketData: any
  ): Promise<boolean> {
    switch (condition.type) {
      case 'trend':
        return this.evaluateTrendCondition(condition, candles);
      
      case 'volatility':
        return this.evaluateVolatilityCondition(condition, candles);
      
      case 'performance':
        return this.evaluatePerformanceCondition(condition, position);
      
      case 'market_condition':
        return this.evaluateMarketCondition(condition, candles, marketData);
      
      case 'price_action':
        return this.evaluatePriceActionCondition(condition, candles);
      
      case 'time':
        return this.evaluateTimeCondition(condition, position);
      
      default:
        return false;
    }
  }

  private evaluateTrendCondition(condition: StrategySwitchingCondition, candles: CandleData[]): boolean {
    if (candles.length < 20) return false;
    
    const trendStrength = this.calculateTrendStrength(candles);
    
    if (condition.trendStrength?.min && trendStrength < condition.trendStrength.min) {
      return false;
    }
    
    if (condition.trendStrength?.max && trendStrength > condition.trendStrength.max) {
      return false;
    }
    
    return true;
  }

  private evaluateVolatilityCondition(condition: StrategySwitchingCondition, candles: CandleData[]): boolean {
    if (candles.length < 20) return false;
    
    const volatility = this.calculateVolatility(candles);
    
    if (condition.volatilityLevel?.min && volatility < condition.volatilityLevel.min) {
      return false;
    }
    
    if (condition.volatilityLevel?.max && volatility > condition.volatilityLevel.max) {
      return false;
    }
    
    return true;
  }

  private evaluatePerformanceCondition(condition: StrategySwitchingCondition, position: TrailingStopPosition): boolean {
    if (condition.unrealizedPnL?.min && position.unrealizedPnL < condition.unrealizedPnL.min) {
      return false;
    }
    
    if (condition.unrealizedPnL?.max && position.unrealizedPnL > condition.unrealizedPnL.max) {
      return false;
    }
    
    if (condition.drawdown?.max && position.maxDrawdown < condition.drawdown.max) {
      return false;
    }
    
    return true;
  }

  private evaluateMarketCondition(condition: StrategySwitchingCondition, candles: CandleData[], marketData: any): boolean {
    // This would integrate with market analysis service
    // For now, simplified implementation
    return true;
  }

  private evaluatePriceActionCondition(condition: StrategySwitchingCondition, candles: CandleData[]): boolean {
    if (!condition.priceMovement || candles.length < 2) return false;
    
    const timeframeCandles = candles.slice(-condition.priceMovement.timeframe);
    if (timeframeCandles.length < 2) return false;
    
    const startPrice = timeframeCandles[0].close;
    const endPrice = timeframeCandles[timeframeCandles.length - 1].close;
    const priceChange = ((endPrice - startPrice) / startPrice) * 100;
    
    if (condition.priceMovement.direction === 'up') {
      return priceChange >= condition.priceMovement.percentage;
    } else {
      return priceChange <= -condition.priceMovement.percentage;
    }
  }

  private evaluateTimeCondition(condition: StrategySwitchingCondition, position: TrailingStopPosition): boolean {
    const now = Date.now();
    const positionAge = (now - position.createdAt) / (1000 * 60); // minutes
    
    if (condition.timeInPosition?.min && positionAge < condition.timeInPosition.min) {
      return false;
    }
    
    if (condition.timeInPosition?.max && positionAge > condition.timeInPosition.max) {
      return false;
    }
    
    return true;
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    const closes = candles.map(c => c.close);
    const n = closes.length;
    
    if (n < 10) return 0;
    
    // Simple linear regression
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = closes.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * closes[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = closes.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = closes.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    
    return Math.max(0, Math.min(1, 1 - (ssRes / ssTot)));
  }

  private calculateVolatility(candles: CandleData[]): number {
    if (candles.length < 20) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const return_ = Math.log(candles[i].close / candles[i - 1].close);
      returns.push(return_);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    return Math.min(1, volatility / 2); // Normalized
  }
}
