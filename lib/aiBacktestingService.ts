import {
  BacktestConfig,
  BacktestResult,
  BacktestStrategy,
  BacktestComparison,
  BacktestProgress,
  OptimizationConfig,
  OptimizationResult,
  PREDEFINED_STRATEGIES,
  DEFAULT_BACKTEST_CONFIG
} from '@/types/backtesting';
import { RealBacktestingEngine } from './realBacktestingEngine';

export class AIBacktestingService {
  private static instance: AIBacktestingService;
  private runningBacktests: Map<string, RealBacktestingEngine> = new Map();
  private results: Map<string, BacktestResult> = new Map();
  private progressCallbacks: Map<string, (progress: BacktestProgress) => void> = new Map();

  private constructor() {}

  static getInstance(): AIBacktestingService {
    if (!AIBacktestingService.instance) {
      AIBacktestingService.instance = new AIBacktestingService();
    }
    return AIBacktestingService.instance;
  }

  // Fetch historical data for backtesting
  async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<number[][]> {
    try {
      const params = new URLSearchParams({
        symbol,
        timeframe,
        startDate,
        endDate,
        limit: (limit || 5000).toString()
      });

      const response = await fetch(`/api/historical-data?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch historical data');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Run single strategy backtest
  async runBacktest(
    config: BacktestConfig,
    progressCallback?: (progress: BacktestProgress) => void
  ): Promise<BacktestResult[]> {
    const backtestId = this.generateBacktestId();
    
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(
        config.symbol,
        config.timeframe,
        config.startDate,
        config.endDate
      );

      if (historicalData.length === 0) {
        throw new Error('No historical data available for the specified period');
      }

      // Create real backtesting engine
      const engine = new RealBacktestingEngine(config, historicalData);
      this.runningBacktests.set(backtestId, engine);

      if (progressCallback) {
        this.progressCallbacks.set(backtestId, progressCallback);
        engine.setProgressCallback(progressCallback);
      }

      // Run actual backtest
      const results = await engine.runBacktest();

      // Store results
      for (const result of results) {
        this.results.set(result.id, result);
      }

      // Cleanup
      this.runningBacktests.delete(backtestId);
      this.progressCallbacks.delete(backtestId);

      return results;
    } catch (error) {
      this.runningBacktests.delete(backtestId);
      this.progressCallbacks.delete(backtestId);
      throw error;
    }
  }

  // Run multiple strategies comparison
  async runComparison(
    configs: BacktestConfig[],
    progressCallback?: (progress: BacktestProgress) => void
  ): Promise<BacktestComparison> {
    const allResults: BacktestResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      
      if (progressCallback) {
        progressCallback({
          id: `comparison_${i}`,
          progress: (i / configs.length) * 100,
          currentStep: `Running backtest ${i + 1}/${configs.length}`,
          currentStepVi: `Đang chạy backtest ${i + 1}/${configs.length}`,
          estimatedTimeRemaining: 0,
          processedCandles: 0,
          totalCandles: 0,
          currentDate: '',
          errors: [],
          warnings: []
        });
      }

      try {
        const results = await this.runBacktest(config);
        allResults.push(...results);
      } catch (error) {
        console.error(`Error running backtest ${i + 1}:`, error);
      }
    }

    return this.generateComparison(allResults);
  }

  // Generate strategy comparison analysis
  private generateComparison(results: BacktestResult[]): BacktestComparison {
    const metrics = this.calculateComparisonMetrics(results);
    const ranking = this.calculateStrategyRanking(results);
    const correlation = this.calculateCorrelation(results);
    const riskAdjustedReturns = this.calculateRiskAdjustedReturns(results);

    return {
      results,
      comparison: {
        metrics,
        ranking,
        correlation,
        riskAdjustedReturns
      }
    };
  }

  private calculateComparisonMetrics(results: BacktestResult[]) {
    const metricKeys: (keyof typeof results[0]['performance'])[] = [
      'totalReturn',
      'sharpeRatio',
      'maxDrawdown',
      'winRate',
      'profitFactor'
    ];

    return metricKeys.map(metric => {
      const values = results.map(r => ({
        strategy: r.id,
        value: r.performance[metric] as number,
        rank: 0
      }));

      // Sort and rank
      const sorted = [...values].sort((a, b) => {
        // For maxDrawdown, lower is better
        if (metric === 'maxDrawdown') {
          return a.value - b.value;
        }
        return b.value - a.value;
      });

      sorted.forEach((item, index) => {
        const original = values.find(v => v.strategy === item.strategy);
        if (original) original.rank = index + 1;
      });

      return {
        metric,
        name: this.getMetricName(metric),
        nameVi: this.getMetricNameVi(metric),
        values,
        best: sorted[0]?.strategy || '',
        worst: sorted[sorted.length - 1]?.strategy || ''
      };
    });
  }

  private calculateStrategyRanking(results: BacktestResult[]) {
    return results.map(result => {
      const performance = result.performance;
      
      // Calculate composite score
      const score = (
        performance.sharpeRatio * 0.3 +
        (performance.totalReturn / 100) * 0.25 +
        (performance.winRate / 100) * 0.2 +
        performance.profitFactor * 0.15 +
        (1 - performance.maxDrawdown / 100) * 0.1
      );

      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (performance.sharpeRatio > 1) strengths.push('High risk-adjusted returns');
      if (performance.winRate > 60) strengths.push('High win rate');
      if (performance.maxDrawdown < 10) strengths.push('Low drawdown');
      if (performance.profitFactor > 1.5) strengths.push('Strong profit factor');

      if (performance.sharpeRatio < 0.5) weaknesses.push('Low risk-adjusted returns');
      if (performance.winRate < 40) weaknesses.push('Low win rate');
      if (performance.maxDrawdown > 20) weaknesses.push('High drawdown');
      if (performance.profitFactor < 1.2) weaknesses.push('Weak profit factor');

      return {
        strategy: result.id,
        score,
        rank: 0, // Will be set after sorting
        strengths,
        weaknesses
      };
    }).sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  private calculateCorrelation(results: BacktestResult[]): number[][] {
    const n = results.length;
    const correlation: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlation[i][j] = 1;
        } else {
          const returns1 = results[i].equity.map(e => e.returns);
          const returns2 = results[j].equity.map(e => e.returns);
          correlation[i][j] = this.calculatePearsonCorrelation(returns1, returns2);
        }
      }
    }

    return correlation;
  }

  private calculateRiskAdjustedReturns(results: BacktestResult[]) {
    return results.map(result => ({
      strategy: result.id,
      return: result.performance.totalReturn,
      risk: result.performance.volatility,
      sharpe: result.performance.sharpeRatio,
      sortino: result.performance.sortinoRatio,
      calmar: result.performance.calmarRatio
    }));
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Get available symbols for backtesting
  async getAvailableSymbols(): Promise<string[]> {
    try {
      const response = await fetch('/api/historical-data?action=symbols');
      const data = await response.json();
      return data.symbols || ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'];
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'];
    }
  }

  // Get available timeframes
  getAvailableTimeframes(): string[] {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  }

  // Get predefined strategies
  getPredefinedStrategies(): BacktestStrategy[] {
    return PREDEFINED_STRATEGIES;
  }

  // Get default configuration
  getDefaultConfig(): BacktestConfig {
    return { ...DEFAULT_BACKTEST_CONFIG };
  }

  // Cancel running backtest
  cancelBacktest(backtestId: string): boolean {
    if (this.runningBacktests.has(backtestId)) {
      this.runningBacktests.delete(backtestId);
      this.progressCallbacks.delete(backtestId);
      return true;
    }
    return false;
  }

  // Get backtest result
  getResult(resultId: string): BacktestResult | undefined {
    return this.results.get(resultId);
  }

  // Get all results
  getAllResults(): BacktestResult[] {
    return Array.from(this.results.values());
  }

  // Clear results
  clearResults(): void {
    this.results.clear();
  }

  // Export results
  async exportResults(
    resultIds: string[],
    format: 'pdf' | 'csv' | 'excel' | 'json'
  ): Promise<Blob> {
    const results = resultIds.map(id => this.results.get(id)).filter(Boolean) as BacktestResult[];
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      
      case 'csv':
        return this.exportToCSV(results);
      
      default:
        throw new Error(`Export format ${format} not implemented yet`);
    }
  }

  private exportToCSV(results: BacktestResult[]): Blob {
    const headers = [
      'Strategy',
      'Symbol',
      'Timeframe',
      'Start Date',
      'End Date',
      'Total Return (%)',
      'Sharpe Ratio',
      'Max Drawdown (%)',
      'Win Rate (%)',
      'Total Trades',
      'Profit Factor'
    ];

    const rows = results.map(result => [
      result.id,
      result.config.symbol,
      result.config.timeframe,
      result.config.startDate,
      result.config.endDate,
      result.performance.totalReturn.toFixed(2),
      result.performance.sharpeRatio.toFixed(2),
      result.performance.maxDrawdown.toFixed(2),
      result.performance.winRate.toFixed(2),
      result.performance.totalTrades.toString(),
      result.performance.profitFactor.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private generateBacktestId(): string {
    return `backtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMetricName(metric: string): string {
    const names: Record<string, string> = {
      totalReturn: 'Total Return',
      sharpeRatio: 'Sharpe Ratio',
      maxDrawdown: 'Max Drawdown',
      winRate: 'Win Rate',
      profitFactor: 'Profit Factor'
    };
    return names[metric] || metric;
  }

  private getMetricNameVi(metric: string): string {
    const names: Record<string, string> = {
      totalReturn: 'Tổng Lợi Nhuận',
      sharpeRatio: 'Tỷ Lệ Sharpe',
      maxDrawdown: 'Sụt Giảm Tối Đa',
      winRate: 'Tỷ Lệ Thắng',
      profitFactor: 'Hệ Số Lợi Nhuận'
    };
    return names[metric] || metric;
  }

  // Mock functions removed - now using real backtesting engine


}

// Export singleton instance
export const aiBacktestingService = AIBacktestingService.getInstance();
