import {
  BacktestConfig,
  BacktestResult,
  BacktestStrategy,
  Trade,
  PerformanceMetrics,
  EquityPoint,
  DrawdownPoint,
  MonthlyReturn,
  BacktestProgress
} from '@/types/backtesting';
import { TechnicalIndicatorsService, CandleData } from './technicalIndicators';

export class RealBacktestingEngine {
  private config: BacktestConfig;
  private data: CandleData[];
  private progressCallback?: (progress: BacktestProgress) => void;

  constructor(config: BacktestConfig, rawData: number[][]) {
    this.config = config;
    // Convert raw OHLCV data to CandleData format
    this.data = rawData.map(candle => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5]
    }));
  }

  setProgressCallback(callback: (progress: BacktestProgress) => void) {
    this.progressCallback = callback;
  }

  async runBacktest(strategyId?: string): Promise<BacktestResult[]> {
    const strategies = strategyId 
      ? this.config.strategies.filter(s => s.id === strategyId && s.enabled)
      : this.config.strategies.filter(s => s.enabled);

    const results: BacktestResult[] = [];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      this.updateProgress({
        id: strategy.id,
        progress: (i / strategies.length) * 100,
        currentStep: `Running strategy: ${strategy.name}`,
        currentStepVi: `Đang chạy chiến lược: ${strategy.nameVi}`,
        estimatedTimeRemaining: 0,
        processedCandles: 0,
        totalCandles: this.data.length,
        currentDate: '',
        errors: [],
        warnings: []
      });

      try {
        const result = await this.runSingleStrategy(strategy);
        results.push(result);
      } catch (error) {
        console.error(`Error running strategy ${strategy.id}:`, error);
        
        const failedResult: BacktestResult = {
          id: strategy.id,
          config: this.config,
          performance: this.getEmptyPerformanceMetrics(),
          trades: [],
          equity: [],
          drawdown: [],
          monthlyReturns: [],
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        results.push(failedResult);
      }
    }

    return results;
  }

  private async runSingleStrategy(strategy: BacktestStrategy): Promise<BacktestResult> {
    const startTime = Date.now();
    const trades: Trade[] = [];
    const equity: EquityPoint[] = [];
    
    let currentCapital = this.config.initialCapital;
    let peak = currentCapital;
    let openPositions: Map<string, any> = new Map();

    // Generate trading signals based on strategy
    const signals = this.generateTradingSignals(strategy);
    
    console.log(`[${strategy.id}] Generated ${signals.length} signals`);

    // Process each signal
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      
      // Update progress
      if (i % 10 === 0) {
        this.updateProgress({
          id: strategy.id,
          progress: (i / signals.length) * 100,
          currentStep: `Processing signal ${i + 1}/${signals.length}`,
          currentStepVi: `Đang xử lý tín hiệu ${i + 1}/${signals.length}`,
          estimatedTimeRemaining: 0,
          processedCandles: i,
          totalCandles: signals.length,
          currentDate: new Date(signal.timestamp).toISOString().split('T')[0],
          errors: [],
          warnings: []
        });
      }

      if (signal.signal === 'buy' && openPositions.size < this.config.maxPositions) {
        // Open new position
        const positionSize = currentCapital * (this.config.positionSize / 100);
        const quantity = positionSize / signal.price;
        const commission = positionSize * (this.config.commission / 100);
        
        if (positionSize > currentCapital * 0.01) { // Minimum position size check
          const position = {
            id: `${strategy.id}_${signal.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            strategy: strategy.id,
            entryTime: signal.timestamp,
            entryPrice: signal.price,
            quantity,
            commission,
            reason: signal.reason
          };
          
          openPositions.set(position.id, position);
          currentCapital -= positionSize + commission;
        }
      } else if (signal.signal === 'sell' && openPositions.size > 0) {
        // Close oldest position (FIFO)
        const oldestPosition = Array.from(openPositions.values())[0];
        if (oldestPosition) {
          const exitCommission = oldestPosition.quantity * signal.price * (this.config.commission / 100);
          const grossPnl = (signal.price - oldestPosition.entryPrice) * oldestPosition.quantity;
          const netPnl = grossPnl - oldestPosition.commission - exitCommission;
          
          const trade: Trade = {
            id: oldestPosition.id,
            strategy: strategy.id,
            symbol: this.config.symbol,
            side: 'buy',
            entryTime: oldestPosition.entryTime,
            exitTime: signal.timestamp,
            entryPrice: oldestPosition.entryPrice,
            exitPrice: signal.price,
            quantity: oldestPosition.quantity,
            commission: oldestPosition.commission + exitCommission,
            slippage: 0, // Simplified for now
            pnl: netPnl,
            pnlPercent: (netPnl / (oldestPosition.entryPrice * oldestPosition.quantity)) * 100,
            duration: signal.timestamp - oldestPosition.entryTime,
            reason: signal.reason,
            tags: [],
            metadata: { entryReason: oldestPosition.reason, exitReason: signal.reason }
          };
          
          trades.push(trade);
          openPositions.delete(oldestPosition.id);
          currentCapital += oldestPosition.quantity * signal.price - exitCommission;
        }
      }

      // Calculate current equity
      const positionValue = Array.from(openPositions.values()).reduce((sum, pos) => {
        return sum + pos.quantity * signal.price;
      }, 0);
      
      const currentEquity = currentCapital + positionValue;
      const drawdown = peak > 0 ? Math.max(0, (peak - currentEquity) / peak * 100) : 0;
      
      if (currentEquity > peak) {
        peak = currentEquity;
      }

      equity.push({
        timestamp: signal.timestamp,
        equity: currentEquity,
        drawdown,
        returns: (currentEquity - this.config.initialCapital) / this.config.initialCapital * 100
      });
    }

    // Close any remaining positions at the end
    const lastCandle = this.data[this.data.length - 1];
    for (const [positionId, position] of openPositions) {
      const exitCommission = position.quantity * lastCandle.close * (this.config.commission / 100);
      const grossPnl = (lastCandle.close - position.entryPrice) * position.quantity;
      const netPnl = grossPnl - position.commission - exitCommission;
      
      const trade: Trade = {
        id: position.id,
        strategy: strategy.id,
        symbol: this.config.symbol,
        side: 'buy',
        entryTime: position.entryTime,
        exitTime: lastCandle.timestamp,
        entryPrice: position.entryPrice,
        exitPrice: lastCandle.close,
        quantity: position.quantity,
        commission: position.commission + exitCommission,
        slippage: 0,
        pnl: netPnl,
        pnlPercent: (netPnl / (position.entryPrice * position.quantity)) * 100,
        duration: lastCandle.timestamp - position.entryTime,
        reason: 'End of backtest',
        tags: [],
        metadata: { entryReason: position.reason, exitReason: 'End of backtest' }
      };
      
      trades.push(trade);
    }

    const endTime = Date.now();
    const performance = this.calculatePerformanceMetrics(trades, equity);
    const drawdown = this.calculateDrawdown(equity);
    const monthlyReturns = this.calculateMonthlyReturns(trades, equity);

    console.log(`[${strategy.id}] Completed: ${trades.length} trades, ${performance.totalReturn.toFixed(2)}% return`);

    return {
      id: strategy.id,
      config: this.config,
      performance,
      trades,
      equity,
      drawdown,
      monthlyReturns,
      startTime,
      endTime,
      duration: endTime - startTime,
      status: 'completed'
    };
  }

  private generateTradingSignals(strategy: BacktestStrategy): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    console.log(`[${strategy.id}] Generating signals for ${this.data.length} candles`);
    
    switch (strategy.id) {
      case 'sma_crossover':
        const fastPeriod = strategy.parameters.find(p => p.key === 'fast_period')?.value || 10;
        const slowPeriod = strategy.parameters.find(p => p.key === 'slow_period')?.value || 30;
        return TechnicalIndicatorsService.generateSMACrossoverSignals(this.data, fastPeriod, slowPeriod);

      case 'rsi_oversold':
        const rsiPeriod = strategy.parameters.find(p => p.key === 'rsi_period')?.value || 14;
        const oversoldLevel = strategy.parameters.find(p => p.key === 'oversold_level')?.value || 30;
        const overboughtLevel = strategy.parameters.find(p => p.key === 'overbought_level')?.value || 70;
        return TechnicalIndicatorsService.generateRSISignals(this.data, rsiPeriod, oversoldLevel, overboughtLevel);

      case 'bollinger_bands':
        const bbPeriod = strategy.parameters.find(p => p.key === 'period')?.value || 20;
        const stdDev = strategy.parameters.find(p => p.key === 'std_dev')?.value || 2;
        return TechnicalIndicatorsService.generateBollingerBandsSignals(this.data, bbPeriod, stdDev);

      case 'macd_signal':
        const macdFast = strategy.parameters.find(p => p.key === 'fast_period')?.value || 12;
        const macdSlow = strategy.parameters.find(p => p.key === 'slow_period')?.value || 26;
        const macdSignal = strategy.parameters.find(p => p.key === 'signal_period')?.value || 9;
        return TechnicalIndicatorsService.generateMACDSignals(this.data, macdFast, macdSlow, macdSignal);

      case 'stochastic':
        const kPeriod = strategy.parameters.find(p => p.key === 'k_period')?.value || 14;
        const dPeriod = strategy.parameters.find(p => p.key === 'd_period')?.value || 3;
        const stochOversold = strategy.parameters.find(p => p.key === 'oversold_level')?.value || 20;
        const stochOverbought = strategy.parameters.find(p => p.key === 'overbought_level')?.value || 80;
        return TechnicalIndicatorsService.generateStochasticSignals(this.data, kPeriod, dPeriod, stochOversold, stochOverbought);

      default:
        console.warn(`Unknown strategy: ${strategy.id}`);
        return [];
    }
  }

  private calculatePerformanceMetrics(trades: Trade[], equity: EquityPoint[]): PerformanceMetrics {
    if (trades.length === 0 || equity.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalReturn = (totalPnl / this.config.initialCapital) * 100;

    const returns = equity.map(e => e.returns);
    const dailyReturns = this.calculateDailyReturns(equity);
    
    return {
      totalReturn,
      annualizedReturn: this.calculateAnnualizedReturn(returns),
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0,
      profitFactor: this.calculateProfitFactor(winningTrades, losingTrades),
      sharpeRatio: this.calculateSharpeRatio(dailyReturns),
      sortinoRatio: this.calculateSortinoRatio(dailyReturns),
      calmarRatio: 0, // TODO: Implement
      maxDrawdown: equity.length > 0 ? Math.max(...equity.map(e => e.drawdown)) : 0,
      maxDrawdownDuration: 0, // TODO: Implement
      volatility: this.calculateVolatility(dailyReturns),
      beta: 0, // TODO: Implement
      alpha: 0, // TODO: Implement
      informationRatio: 0, // TODO: Implement
      treynorRatio: 0, // TODO: Implement
      var95: 0, // TODO: Implement
      cvar95: 0, // TODO: Implement
      ulcerIndex: 0, // TODO: Implement
      recoveryFactor: 0, // TODO: Implement
      payoffRatio: winningTrades.length > 0 && losingTrades.length > 0 ? 
        (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length) / 
        Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0,
      expectancy: trades.length > 0 ? totalPnl / trades.length : 0,
      kelly: 0, // TODO: Implement
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades),
      avgTradeDuration: trades.length > 0 ? trades.reduce((sum, t) => sum + t.duration, 0) / trades.length : 0,
      avgTimeInMarket: 0 // TODO: Implement
    };
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0, annualizedReturn: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0,
      winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, sharpeRatio: 0, sortinoRatio: 0,
      calmarRatio: 0, maxDrawdown: 0, maxDrawdownDuration: 0, volatility: 0, beta: 0,
      alpha: 0, informationRatio: 0, treynorRatio: 0, var95: 0, cvar95: 0, ulcerIndex: 0,
      recoveryFactor: 0, payoffRatio: 0, expectancy: 0, kelly: 0, largestWin: 0,
      largestLoss: 0, consecutiveWins: 0, consecutiveLosses: 0, avgTradeDuration: 0, avgTimeInMarket: 0
    };
  }

  // Helper methods (simplified implementations)
  private calculateDailyReturns(equity: EquityPoint[]): number[] {
    const dailyReturns: number[] = [];
    for (let i = 1; i < equity.length; i++) {
      const prevEquity = equity[i - 1].equity;
      const currentEquity = equity[i].equity;
      const dailyReturn = prevEquity > 0 ? (currentEquity - prevEquity) / prevEquity : 0;
      dailyReturns.push(dailyReturn);
    }
    return dailyReturns;
  }

  private calculateAnnualizedReturn(returns: number[]): number {
    if (returns.length === 0) return 0;
    const totalReturn = returns[returns.length - 1] / 100;
    const years = returns.length / (365 * 24); // Assuming hourly data
    return years > 0 ? (Math.pow(1 + totalReturn, 1 / years) - 1) * 100 : 0;
  }

  private calculateProfitFactor(winningTrades: Trade[], losingTrades: Trade[]): number {
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    return grossLoss > 0 ? grossProfit / grossLoss : 0;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = this.calculateVolatility(returns);
    return stdDev > 0 ? (avgReturn * Math.sqrt(252)) / (stdDev * Math.sqrt(252)) : 0; // Annualized
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return 0;
    const downwardDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    );
    return downwardDeviation > 0 ? avgReturn / downwardDeviation : 0;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateConsecutiveWins(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;
    
    for (const trade of trades) {
      if (trade.pnl > 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }
    
    return maxConsecutive;
  }

  private calculateConsecutiveLosses(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;
    
    for (const trade of trades) {
      if (trade.pnl < 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }
    
    return maxConsecutive;
  }

  private calculateDrawdown(equity: EquityPoint[]): DrawdownPoint[] {
    const drawdown: DrawdownPoint[] = [];
    let peak = equity[0]?.equity || 0;
    let peakTime = equity[0]?.timestamp || 0;
    
    for (const point of equity) {
      if (point.equity > peak) {
        peak = point.equity;
        peakTime = point.timestamp;
      }
      
      const dd = peak > 0 ? (peak - point.equity) / peak * 100 : 0;
      
      drawdown.push({
        timestamp: point.timestamp,
        drawdown: dd,
        underwater: dd > 0,
        peak,
        valley: point.equity,
        duration: point.timestamp - peakTime
      });
    }
    
    return drawdown;
  }

  private calculateMonthlyReturns(trades: Trade[], equity: EquityPoint[]): MonthlyReturn[] {
    // Simplified implementation
    return [];
  }

  private updateProgress(progress: BacktestProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
