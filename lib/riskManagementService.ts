import { TrailingStopPosition } from '@/types/trailingStop';

export interface RiskProfile {
  conservative: RiskParameters;
  moderate: RiskParameters;
  aggressive: RiskParameters;
}

export interface RiskParameters {
  maxRiskPerTrade: number; // % of account
  maxDailyLoss: number; // % of account
  maxDrawdown: number; // % of account
  maxPositions: number;
  maxCorrelatedPositions: number;
  volatilityMultiplier: number;
  stopLossMultiplier: number;
}

export interface PositionSizingResult {
  recommendedSize: number; // USDT amount
  maxSize: number; // USDT amount
  riskAmount: number; // USDT at risk
  riskPercentage: number; // % of account
  reasoning: string[];
  warnings: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
  maxLossProtection: {
    enabled: boolean;
    dailyLossLimit: number;
    currentDailyLoss: number;
    remainingCapacity: number;
  };
}

export interface RiskFactor {
  type: 'volatility' | 'correlation' | 'concentration' | 'drawdown' | 'market_condition';
  severity: 'low' | 'medium' | 'high';
  impact: number; // 0-1
  description: string;
}

export interface AccountMetrics {
  totalBalance: number;
  availableBalance: number;
  totalPositions: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  profitFactor: number;
}

export class RiskManagementService {
  private riskProfiles: RiskProfile;
  private currentProfile: keyof RiskProfile = 'moderate';
  private accountMetrics: AccountMetrics;

  constructor() {
    this.riskProfiles = {
      conservative: {
        maxRiskPerTrade: 1.0,
        maxDailyLoss: 2.0,
        maxDrawdown: 5.0,
        maxPositions: 3,
        maxCorrelatedPositions: 1,
        volatilityMultiplier: 0.5,
        stopLossMultiplier: 0.8
      },
      moderate: {
        maxRiskPerTrade: 2.0,
        maxDailyLoss: 4.0,
        maxDrawdown: 10.0,
        maxPositions: 5,
        maxCorrelatedPositions: 2,
        volatilityMultiplier: 1.0,
        stopLossMultiplier: 1.0
      },
      aggressive: {
        maxRiskPerTrade: 5.0,
        maxDailyLoss: 8.0,
        maxDrawdown: 20.0,
        maxPositions: 10,
        maxCorrelatedPositions: 3,
        volatilityMultiplier: 1.5,
        stopLossMultiplier: 1.2
      }
    };

    this.accountMetrics = this.getDefaultAccountMetrics();
  }

  private getDefaultAccountMetrics(): AccountMetrics {
    return {
      totalBalance: 10000, // Default $10,000
      availableBalance: 8000,
      totalPositions: 0,
      dailyPnL: 0,
      weeklyPnL: 0,
      monthlyPnL: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      winRate: 0,
      profitFactor: 1
    };
  }

  /**
   * Calculate optimal position size based on risk parameters
   */
  calculatePositionSize(
    symbol: string,
    entryPrice: number,
    stopLossPrice: number,
    accountBalance: number,
    volatility?: number
  ): PositionSizingResult {
    const riskParams = this.riskProfiles[this.currentProfile];
    const reasoning: string[] = [];
    const warnings: string[] = [];

    // Calculate risk per unit
    const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
    const riskPercentPerUnit = riskPerUnit / entryPrice;

    reasoning.push(`Risk per unit: ${riskPerUnit.toFixed(4)} (${(riskPercentPerUnit * 100).toFixed(2)}%)`);

    // Base risk amount (% of account)
    let baseRiskPercent = riskParams.maxRiskPerTrade;
    
    // Adjust for volatility
    if (volatility) {
      const volatilityAdjustment = volatility * riskParams.volatilityMultiplier;
      baseRiskPercent = Math.max(0.5, baseRiskPercent - volatilityAdjustment);
      reasoning.push(`Volatility adjustment: ${volatilityAdjustment.toFixed(2)}% reduction`);
    }

    // Check daily loss limit
    const remainingDailyCapacity = this.getRemainingDailyCapacity(accountBalance);
    if (remainingDailyCapacity < baseRiskPercent) {
      baseRiskPercent = remainingDailyCapacity;
      warnings.push(`Position size reduced due to daily loss limit`);
    }

    // Calculate position size
    const riskAmount = (accountBalance * baseRiskPercent) / 100;
    const recommendedSize = riskAmount / riskPerUnit;
    
    // Apply position limits
    const maxPositionValue = accountBalance * 0.3; // Max 30% of account per position
    const maxSize = Math.min(recommendedSize, maxPositionValue / entryPrice);

    if (maxSize < recommendedSize) {
      warnings.push(`Position size capped at 30% of account balance`);
    }

    // Check correlation limits
    const correlationWarning = this.checkCorrelationLimits(symbol);
    if (correlationWarning) {
      warnings.push(correlationWarning);
    }

    reasoning.push(`Base risk: ${baseRiskPercent.toFixed(2)}% of account`);
    reasoning.push(`Risk amount: $${riskAmount.toFixed(2)}`);
    reasoning.push(`Recommended size: $${(recommendedSize * entryPrice).toFixed(2)}`);

    return {
      recommendedSize: recommendedSize * entryPrice, // Convert to USDT value
      maxSize: maxSize * entryPrice,
      riskAmount,
      riskPercentage: baseRiskPercent,
      reasoning,
      warnings
    };
  }

  /**
   * Assess overall portfolio risk
   */
  assessRisk(positions: TrailingStopPosition[], marketData?: any[]): RiskAssessment {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // Volatility risk
    const volatilityRisk = this.assessVolatilityRisk(positions, marketData);
    factors.push(volatilityRisk);
    riskScore += volatilityRisk.impact * 25;

    // Correlation risk
    const correlationRisk = this.assessCorrelationRisk(positions);
    factors.push(correlationRisk);
    riskScore += correlationRisk.impact * 20;

    // Concentration risk
    const concentrationRisk = this.assessConcentrationRisk(positions);
    factors.push(concentrationRisk);
    riskScore += concentrationRisk.impact * 25;

    // Drawdown risk
    const drawdownRisk = this.assessDrawdownRisk();
    factors.push(drawdownRisk);
    riskScore += drawdownRisk.impact * 30;

    // Determine overall risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'extreme';
    if (riskScore < 25) overallRisk = 'low';
    else if (riskScore < 50) overallRisk = 'medium';
    else if (riskScore < 75) overallRisk = 'high';
    else overallRisk = 'extreme';

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(factors, overallRisk);

    // Max loss protection
    const maxLossProtection = this.getMaxLossProtection();

    return {
      overallRisk,
      riskScore,
      factors,
      recommendations,
      maxLossProtection
    };
  }

  /**
   * Check if new position violates risk rules
   */
  validateNewPosition(
    symbol: string,
    _size: number,
    entryPrice: number,
    stopLoss: number,
    existingPositions: TrailingStopPosition[]
  ): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const riskParams = this.riskProfiles[this.currentProfile];

    // Check position count limit
    if (existingPositions.length >= riskParams.maxPositions) {
      reasons.push(`Maximum positions limit reached (${riskParams.maxPositions})`);
    }

    // Check daily loss limit
    const dailyLossRemaining = this.getRemainingDailyCapacity(this.accountMetrics.totalBalance);
    const positionRisk = Math.abs(entryPrice - stopLoss) / entryPrice * 100;
    
    if (positionRisk > dailyLossRemaining) {
      reasons.push(`Position risk exceeds daily loss limit`);
    }

    // Check correlation limits
    const correlatedPositions = this.getCorrelatedPositions(symbol, existingPositions);
    if (correlatedPositions.length >= riskParams.maxCorrelatedPositions) {
      reasons.push(`Too many correlated positions (${correlatedPositions.length}/${riskParams.maxCorrelatedPositions})`);
    }

    // Check drawdown limits
    if (this.accountMetrics.currentDrawdown > riskParams.maxDrawdown) {
      reasons.push(`Current drawdown exceeds limit (${this.accountMetrics.currentDrawdown.toFixed(1)}%)`);
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get dynamic stop loss recommendation
   */
  getDynamicStopLoss(
    entryPrice: number,
    direction: 'long' | 'short',
    volatility: number,
    atr?: number
  ): { stopLoss: number; reasoning: string[] } {
    const riskParams = this.riskProfiles[this.currentProfile];
    const reasoning: string[] = [];

    let baseStopPercent = 2.0; // Base 2% stop loss

    // Adjust for volatility
    const volatilityAdjustment = volatility * riskParams.volatilityMultiplier;
    baseStopPercent += volatilityAdjustment;
    reasoning.push(`Volatility adjustment: +${volatilityAdjustment.toFixed(2)}%`);

    // Use ATR if available
    if (atr) {
      const atrStopPercent = (atr / entryPrice) * 100 * riskParams.stopLossMultiplier;
      baseStopPercent = Math.max(baseStopPercent, atrStopPercent);
      reasoning.push(`ATR-based stop: ${atrStopPercent.toFixed(2)}%`);
    }

    // Apply profile multiplier
    baseStopPercent *= riskParams.stopLossMultiplier;
    reasoning.push(`Profile multiplier: ${riskParams.stopLossMultiplier}x`);

    // Calculate stop loss price
    const stopLoss = direction === 'long' 
      ? entryPrice * (1 - baseStopPercent / 100)
      : entryPrice * (1 + baseStopPercent / 100);

    reasoning.push(`Final stop loss: ${baseStopPercent.toFixed(2)}% from entry`);

    return { stopLoss, reasoning };
  }

  // Private helper methods
  private assessVolatilityRisk(_positions: TrailingStopPosition[], _marketData?: any[]): RiskFactor {
    // Calculate average volatility across positions
    let avgVolatility = 0.3; // Default moderate volatility
    
    if (_marketData && _marketData.length > 20) {
      const returns = [];
      for (let i = 1; i < _marketData.length; i++) {
        returns.push((_marketData[i].close - _marketData[i-1].close) / _marketData[i-1].close);
      }
      const variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
      avgVolatility = Math.sqrt(variance * 252); // Annualized
    }

    let severity: 'low' | 'medium' | 'high';
    let impact: number;

    if (avgVolatility < 0.2) {
      severity = 'low';
      impact = 0.2;
    } else if (avgVolatility < 0.5) {
      severity = 'medium';
      impact = 0.5;
    } else {
      severity = 'high';
      impact = 0.8;
    }

    return {
      type: 'volatility',
      severity,
      impact,
      description: `Market volatility: ${(avgVolatility * 100).toFixed(1)}% (annualized)`
    };
  }

  private assessCorrelationRisk(positions: TrailingStopPosition[]): RiskFactor {
    const correlatedGroups = this.groupCorrelatedPositions(positions);
    const maxGroupSize = Math.max(...correlatedGroups.map(g => g.length), 0);
    const riskParams = this.riskProfiles[this.currentProfile];

    let severity: 'low' | 'medium' | 'high';
    let impact: number;

    if (maxGroupSize <= riskParams.maxCorrelatedPositions) {
      severity = 'low';
      impact = 0.1;
    } else if (maxGroupSize <= riskParams.maxCorrelatedPositions * 1.5) {
      severity = 'medium';
      impact = 0.5;
    } else {
      severity = 'high';
      impact = 0.9;
    }

    return {
      type: 'correlation',
      severity,
      impact,
      description: `Max correlated positions: ${maxGroupSize} (limit: ${riskParams.maxCorrelatedPositions})`
    };
  }

  private assessConcentrationRisk(positions: TrailingStopPosition[]): RiskFactor {
    if (positions.length === 0) {
      return {
        type: 'concentration',
        severity: 'low',
        impact: 0,
        description: 'No positions - no concentration risk'
      };
    }

    const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.entryPrice, 0);
    const maxPositionValue = Math.max(...positions.map(p => p.quantity * p.entryPrice));
    const concentrationRatio = maxPositionValue / totalValue;

    let severity: 'low' | 'medium' | 'high';
    let impact: number;

    if (concentrationRatio < 0.3) {
      severity = 'low';
      impact = 0.2;
    } else if (concentrationRatio < 0.5) {
      severity = 'medium';
      impact = 0.5;
    } else {
      severity = 'high';
      impact = 0.8;
    }

    return {
      type: 'concentration',
      severity,
      impact,
      description: `Largest position: ${(concentrationRatio * 100).toFixed(1)}% of portfolio`
    };
  }

  private assessDrawdownRisk(): RiskFactor {
    const currentDrawdown = this.accountMetrics.currentDrawdown;
    const maxDrawdown = this.riskProfiles[this.currentProfile].maxDrawdown;

    let severity: 'low' | 'medium' | 'high';
    let impact: number;

    if (currentDrawdown < maxDrawdown * 0.5) {
      severity = 'low';
      impact = 0.2;
    } else if (currentDrawdown < maxDrawdown * 0.8) {
      severity = 'medium';
      impact = 0.6;
    } else {
      severity = 'high';
      impact = 1.0;
    }

    return {
      type: 'drawdown',
      severity,
      impact,
      description: `Current drawdown: ${currentDrawdown.toFixed(1)}% (limit: ${maxDrawdown}%)`
    };
  }

  private generateRiskRecommendations(factors: RiskFactor[], overallRisk: string): string[] {
    const recommendations: string[] = [];

    if (overallRisk === 'extreme') {
      recommendations.push('🚨 STOP TRADING - Risk level is extreme');
      recommendations.push('Close some positions to reduce exposure');
    } else if (overallRisk === 'high') {
      recommendations.push('⚠️ Reduce position sizes');
      recommendations.push('Consider closing correlated positions');
    }

    factors.forEach(factor => {
      if (factor.severity === 'high') {
        switch (factor.type) {
          case 'volatility':
            recommendations.push('Use wider stop losses due to high volatility');
            break;
          case 'correlation':
            recommendations.push('Diversify across different asset classes');
            break;
          case 'concentration':
            recommendations.push('Reduce largest position size');
            break;
          case 'drawdown':
            recommendations.push('Take a break from trading to reset psychology');
            break;
        }
      }
    });

    return recommendations;
  }

  private getRemainingDailyCapacity(accountBalance: number): number {
    const riskParams = this.riskProfiles[this.currentProfile];
    const maxDailyLoss = (accountBalance * riskParams.maxDailyLoss) / 100;
    const currentDailyLoss = Math.abs(Math.min(0, this.accountMetrics.dailyPnL));
    const remaining = maxDailyLoss - currentDailyLoss;
    return Math.max(0, (remaining / accountBalance) * 100);
  }

  private checkCorrelationLimits(symbol: string): string | null {
    // Simplified correlation check - in reality, you'd use correlation matrices
    const cryptoCorrelations: Record<string, string[]> = {
      'BTC/USDT': ['ETH/USDT', 'LTC/USDT'],
      'ETH/USDT': ['BTC/USDT', 'ADA/USDT'],
      'PEPE/USDT': ['DOGE/USDT', 'SHIB/USDT']
    };

    const correlatedSymbols = cryptoCorrelations[symbol] || [];
    if (correlatedSymbols.length > this.riskProfiles[this.currentProfile].maxCorrelatedPositions) {
      return `High correlation with existing positions`;
    }

    return null;
  }

  private getCorrelatedPositions(symbol: string, positions: TrailingStopPosition[]): TrailingStopPosition[] {
    const cryptoCorrelations: Record<string, string[]> = {
      'BTC/USDT': ['ETH/USDT', 'LTC/USDT'],
      'ETH/USDT': ['BTC/USDT', 'ADA/USDT'],
      'PEPE/USDT': ['DOGE/USDT', 'SHIB/USDT']
    };

    const correlatedSymbols = cryptoCorrelations[symbol] || [];
    return positions.filter(p => correlatedSymbols.includes(p.symbol));
  }

  private groupCorrelatedPositions(positions: TrailingStopPosition[]): TrailingStopPosition[][] {
    // Simplified grouping - in reality, you'd use proper correlation analysis
    const groups: TrailingStopPosition[][] = [];
    const processed = new Set<string>();

    positions.forEach(position => {
      if (processed.has(position.symbol)) return;

      const correlatedPositions = this.getCorrelatedPositions(position.symbol, positions);
      correlatedPositions.push(position);
      
      correlatedPositions.forEach(p => processed.add(p.symbol));
      groups.push(correlatedPositions);
    });

    return groups;
  }

  private getMaxLossProtection() {
    const riskParams = this.riskProfiles[this.currentProfile];
    const dailyLossLimit = (this.accountMetrics.totalBalance * riskParams.maxDailyLoss) / 100;
    const currentDailyLoss = Math.abs(Math.min(0, this.accountMetrics.dailyPnL));
    
    return {
      enabled: true,
      dailyLossLimit,
      currentDailyLoss,
      remainingCapacity: Math.max(0, dailyLossLimit - currentDailyLoss)
    };
  }

  // Public methods for configuration
  setRiskProfile(profile: keyof RiskProfile): void {
    this.currentProfile = profile;
  }

  updateAccountMetrics(metrics: Partial<AccountMetrics>): void {
    this.accountMetrics = { ...this.accountMetrics, ...metrics };
  }

  getRiskProfile(): RiskParameters {
    return this.riskProfiles[this.currentProfile];
  }

  getCurrentProfile(): keyof RiskProfile {
    return this.currentProfile;
  }
}

// Export singleton instance
export const riskManagementService = new RiskManagementService();
