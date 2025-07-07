// Backtesting Engine - Part 2: Helper Methods and Calculations
import { CandleData } from './historicalDataService';

// Import types directly to avoid circular dependency
export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  side: 'buy' | 'sell';
  status: 'open' | 'closed' | 'stopped';

  // Trailing Stop Data
  highestPrice: number;
  lowestPrice: number;
  currentStopPrice: number;
  trailingPercent: number;

  // P&L
  unrealizedPnL: number;
  realizedPnL?: number;
  fees: number;

  // Strategy Info
  strategy: string;
  entryReason: string;
  exitReason?: string;

  // Technical Indicators at Entry
  rsi?: number;
  atr?: number;
  volume: number;
  volatility?: number;
}

export interface BacktestConfig {
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  strategy: string;
  initialCapital: number;
  positionSize: number;
  maxPositions: number;
  maxLossPercent: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  entryCondition: string;

  // Strategy Parameters
  trailingPercent?: number;
  atrMultiplier?: number;
  atrPeriod?: number;
  volatilityLookback?: number;
  fibonacciLevel?: number;
  bollingerPeriod?: number;
  bollingerStdDev?: number;
  minVolume?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
}

export interface BacktestPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  avgHoldingPeriod: number;
  maxHoldingPeriod: number;
  minHoldingPeriod: number;
  expectancy: number;
  recoveryFactor: number;
  ulcerIndex: number;
  avgTrailingDistance: number;
  maxTrailingDistance: number;
  trailingEfficiency: number;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
  trades: number;
}

export interface DrawdownPoint {
  timestamp: number;
  drawdown: number;
  drawdownPercent: number;
  duration: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  returnPercent: number;
  trades: number;
}

export class BacktestingEngineHelpers {
  
  /**
   * Calculate trailing stop price based on strategy
   */
  static calculateTrailingStop(trade: BacktestTrade, candle: CandleData, config: BacktestConfig): number {
    switch (config.strategy) {
      case 'percentage':
        return trade.highestPrice * (1 - trade.trailingPercent);
        
      case 'atr':
        // Use ATR-based trailing stop
        const atrMultiplier = config.atrMultiplier || 2;
        // For simplicity, estimate ATR as (high - low) average
        const estimatedATR = (candle.high - candle.low);
        return trade.highestPrice - (estimatedATR * atrMultiplier);
        
      case 'dynamic':
        // Dynamic based on volatility
        const volatilityMultiplier = Math.max(0.02, Math.min(0.1, trade.volatility || 0.05));
        return trade.highestPrice * (1 - volatilityMultiplier);
        
      case 'fibonacci':
        // Fibonacci retracement levels
        const fibLevel = config.fibonacciLevel || 0.618;
        const swingRange = trade.highestPrice - trade.lowestPrice;
        return trade.highestPrice - (swingRange * fibLevel);
        
      case 'bollinger_bands':
        // Use Bollinger Bands for trailing stop
        // Simplified: use percentage with volatility adjustment
        const bbMultiplier = (config.bollingerStdDev || 2) * 0.01;
        return trade.highestPrice * (1 - bbMultiplier);
        
      default:
        // Default to percentage-based
        return trade.highestPrice * (1 - trade.trailingPercent);
    }
  }
  
  /**
   * Check exit conditions for trade
   */
  static checkExitConditions(trade: BacktestTrade, candle: CandleData, indicators: any): string | null {
    // Check trailing stop
    if (candle.low <= trade.currentStopPrice) {
      return 'trailing_stop';
    }
    
    // Check take profit if configured
    if (trade.exitPrice && candle.high >= trade.exitPrice) {
      return 'take_profit';
    }
    
    // Check maximum holding period (e.g., 30 days)
    const holdingPeriod = (candle.timestamp - trade.entryTime) / (1000 * 60 * 60); // hours
    if (holdingPeriod > 720) { // 30 days
      return 'max_holding_period';
    }
    
    return null;
  }
  
  /**
   * Close trade with exit reason
   */
  static closeTrade(trade: BacktestTrade, candle: CandleData, exitReason: string): void {
    trade.exitTime = candle.timestamp;
    trade.exitReason = exitReason;
    trade.status = exitReason === 'trailing_stop' ? 'stopped' : 'closed';
    
    // Determine exit price based on exit reason
    switch (exitReason) {
      case 'trailing_stop':
        trade.exitPrice = trade.currentStopPrice;
        break;
      case 'take_profit':
        trade.exitPrice = trade.exitPrice || candle.close;
        break;
      default:
        trade.exitPrice = candle.close;
    }
    
    // Calculate realized P&L
    trade.realizedPnL = (trade.exitPrice - trade.entryPrice) * trade.quantity - trade.fees;
  }
  
  /**
   * Calculate performance metrics
   */
  static calculatePerformance(config: BacktestConfig, trades: BacktestTrade[]): BacktestPerformance {
    const closedTrades = trades.filter(t => t.status === 'closed' || t.status === 'stopped');
    const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realizedPnL || 0) < 0);
    
    const totalReturn = closedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    const totalReturnPercent = (totalReturn / config.initialCapital) * 100;
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0) / winningTrades.length 
      : 0;
    
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0) / losingTrades.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;
    
    // Calculate holding periods
    const holdingPeriods = closedTrades
      .filter(t => t.exitTime)
      .map(t => (t.exitTime! - t.entryTime) / (1000 * 60 * 60)); // hours
    
    const avgHoldingPeriod = holdingPeriods.length > 0 
      ? holdingPeriods.reduce((sum, h) => sum + h, 0) / holdingPeriods.length 
      : 0;
    
    // Calculate expectancy
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    // Calculate trailing efficiency
    const trailingStops = closedTrades.filter(t => t.exitReason === 'trailing_stop');
    const profitableTrailingStops = trailingStops.filter(t => (t.realizedPnL || 0) > 0);
    const trailingEfficiency = trailingStops.length > 0 
      ? profitableTrailingStops.length / trailingStops.length 
      : 0;
    
    // Calculate trailing distances
    const trailingDistances = closedTrades.map(t => {
      if (t.highestPrice > t.entryPrice) {
        return (t.highestPrice - (t.exitPrice || t.entryPrice)) / t.entryPrice;
      }
      return 0;
    });
    
    const avgTrailingDistance = trailingDistances.length > 0 
      ? trailingDistances.reduce((sum, d) => sum + d, 0) / trailingDistances.length 
      : 0;
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      
      totalReturn,
      totalReturnPercent,
      avgWin,
      avgLoss,
      profitFactor,
      
      maxDrawdown: 0, // Will be calculated separately
      maxDrawdownPercent: 0,
      sharpeRatio: 0, // Will be calculated with equity curve
      sortinoRatio: 0,
      calmarRatio: 0,
      
      avgHoldingPeriod,
      maxHoldingPeriod: holdingPeriods.length > 0 ? Math.max(...holdingPeriods) : 0,
      minHoldingPeriod: holdingPeriods.length > 0 ? Math.min(...holdingPeriods) : 0,
      
      expectancy,
      recoveryFactor: 0, // Will be calculated with drawdown
      ulcerIndex: 0,
      
      avgTrailingDistance,
      maxTrailingDistance: trailingDistances.length > 0 ? Math.max(...trailingDistances) : 0,
      trailingEfficiency
    };
  }
  
  /**
   * Calculate equity curve
   */
  static calculateEquityCurve(config: BacktestConfig, trades: BacktestTrade[], candles: CandleData[]): EquityPoint[] {
    const equity: EquityPoint[] = [];
    let currentEquity = config.initialCapital;
    let tradeCount = 0;
    let peakEquity = currentEquity;
    
    // Create equity points for each candle
    for (const candle of candles) {
      // Find trades that closed at this timestamp
      const closedTrades = trades.filter(t => 
        t.exitTime === candle.timestamp && (t.status === 'closed' || t.status === 'stopped')
      );
      
      // Update equity with closed trades
      for (const trade of closedTrades) {
        currentEquity += (trade.realizedPnL || 0);
        tradeCount++;
      }
      
      // Update peak equity
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      
      // Calculate drawdown
      const drawdown = peakEquity - currentEquity;
      
      equity.push({
        timestamp: candle.timestamp,
        equity: currentEquity,
        drawdown,
        trades: tradeCount
      });
    }
    
    return equity;
  }
  
  /**
   * Calculate drawdown points
   */
  static calculateDrawdown(equity: EquityPoint[]): DrawdownPoint[] {
    const drawdown: DrawdownPoint[] = [];
    let drawdownStart: number | null = null;
    
    for (let i = 0; i < equity.length; i++) {
      const point = equity[i];
      const drawdownPercent = point.equity > 0 ? (point.drawdown / point.equity) * 100 : 0;
      
      // Track drawdown duration
      let duration = 0;
      if (point.drawdown > 0) {
        if (drawdownStart === null) {
          drawdownStart = point.timestamp;
        }
        duration = (point.timestamp - drawdownStart) / (1000 * 60 * 60); // hours
      } else {
        drawdownStart = null;
      }
      
      drawdown.push({
        timestamp: point.timestamp,
        drawdown: point.drawdown,
        drawdownPercent,
        duration
      });
    }
    
    return drawdown;
  }
  
  /**
   * Calculate monthly returns
   */
  static calculateMonthlyReturns(trades: BacktestTrade[]): MonthlyReturn[] {
    const monthlyData: { [key: string]: { return: number; trades: number } } = {};
    
    const closedTrades = trades.filter(t => t.exitTime && (t.status === 'closed' || t.status === 'stopped'));
    
    for (const trade of closedTrades) {
      const exitDate = new Date(trade.exitTime!);
      const year = exitDate.getFullYear();
      const month = exitDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { return: 0, trades: 0 };
      }
      
      monthlyData[key].return += (trade.realizedPnL || 0);
      monthlyData[key].trades++;
    }
    
    return Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        year,
        month,
        return: data.return,
        returnPercent: 0, // Will be calculated based on capital at that time
        trades: data.trades
      };
    }).sort((a, b) => a.year - b.year || a.month - b.month);
  }
  
  /**
   * Calculate RSI
   */
  static calculateRSI(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < 2) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    const recentTRs = trueRanges.slice(-period);
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
  }
  
  /**
   * Calculate volatility
   */
  static calculateVolatility(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const returnRate = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(returnRate);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(candles: CandleData[], period: number, stdDev: number): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const recentCandles = candles.slice(-period);
    const closes = recentCandles.map(c => c.close);
    
    const middle = closes.reduce((sum, close) => sum + close, 0) / closes.length;
    const variance = closes.reduce((sum, close) => sum + Math.pow(close - middle, 2), 0) / closes.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: middle + (standardDeviation * stdDev),
      middle,
      lower: middle - (standardDeviation * stdDev)
    };
  }
}
