export interface BacktestConfig {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  positionSize: number; // Percentage of capital per trade
  maxPositions: number;
  commission: number; // Percentage
  slippage: number; // Percentage
  strategies: BacktestStrategy[];
}

export interface BacktestStrategy {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  type: 'trend_following' | 'mean_reversion' | 'momentum' | 'breakout' | 'ai_ml';
  parameters: StrategyParameter[];
  enabled: boolean;
}

export interface StrategyParameter {
  key: string;
  name: string;
  nameVi: string;
  type: 'number' | 'boolean' | 'select' | 'range';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: any; label: string; labelVi: string }[];
  description?: string;
  descriptionVi?: string;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  performance: PerformanceMetrics;
  trades: Trade[];
  equity: EquityPoint[];
  drawdown: DrawdownPoint[];
  monthlyReturns: MonthlyReturn[];
  startTime: number;
  endTime: number;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  volatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;
  var95: number; // Value at Risk 95%
  cvar95: number; // Conditional Value at Risk 95%
  ulcerIndex: number;
  recoveryFactor: number;
  payoffRatio: number;
  expectancy: number;
  kelly: number; // Kelly Criterion
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgTradeDuration: number;
  avgTimeInMarket: number;
}

export interface Trade {
  id: string;
  strategy: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  commission: number;
  slippage: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
  reason: 'signal' | 'stop_loss' | 'take_profit' | 'timeout' | 'manual';
  tags: string[];
  metadata?: Record<string, any>;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
  returns: number;
}

export interface DrawdownPoint {
  timestamp: number;
  drawdown: number;
  underwater: boolean;
  peak: number;
  valley: number;
  duration: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  trades: number;
  winRate: number;
}

export interface BacktestComparison {
  results: BacktestResult[];
  comparison: {
    metrics: ComparisonMetric[];
    ranking: StrategyRanking[];
    correlation: number[][];
    riskAdjustedReturns: RiskAdjustedReturn[];
  };
}

export interface ComparisonMetric {
  metric: keyof PerformanceMetrics;
  name: string;
  nameVi: string;
  values: { strategy: string; value: number; rank: number }[];
  best: string;
  worst: string;
}

export interface StrategyRanking {
  strategy: string;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

export interface RiskAdjustedReturn {
  strategy: string;
  return: number;
  risk: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

export interface BacktestProgress {
  id: string;
  progress: number; // 0-100
  currentStep: string;
  currentStepVi: string;
  estimatedTimeRemaining: number;
  processedCandles: number;
  totalCandles: number;
  currentDate: string;
  errors: string[];
  warnings: string[];
}

export interface OptimizationConfig {
  strategy: BacktestStrategy;
  parameters: OptimizationParameter[];
  objective: 'total_return' | 'sharpe_ratio' | 'profit_factor' | 'max_drawdown' | 'win_rate';
  method: 'grid_search' | 'random_search' | 'genetic_algorithm' | 'bayesian';
  iterations: number;
  constraints: OptimizationConstraint[];
}

export interface OptimizationParameter {
  key: string;
  min: number;
  max: number;
  step: number;
  type: 'int' | 'float';
}

export interface OptimizationConstraint {
  metric: keyof PerformanceMetrics;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
}

export interface OptimizationResult {
  id: string;
  config: OptimizationConfig;
  bestParameters: Record<string, any>;
  bestScore: number;
  allResults: { parameters: Record<string, any>; score: number; metrics: PerformanceMetrics }[];
  convergence: number[];
  heatmap?: number[][];
  surface?: { x: number[]; y: number[]; z: number[][] };
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime: number;
  duration: number;
}

export interface BacktestExport {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  sections: ExportSection[];
  template: 'detailed' | 'summary' | 'comparison' | 'custom';
  language: 'en' | 'vi';
}

export interface ExportSection {
  type: 'summary' | 'performance' | 'trades' | 'charts' | 'analysis' | 'risk';
  title: string;
  titleVi: string;
  include: boolean;
  options?: Record<string, any>;
}

// Predefined strategies
export const PREDEFINED_STRATEGIES: BacktestStrategy[] = [
  {
    id: 'sma_crossover',
    name: 'SMA Crossover',
    nameVi: 'Cắt SMA',
    description: 'Simple Moving Average crossover strategy',
    descriptionVi: 'Chiến lược cắt đường trung bình động đơn giản',
    type: 'trend_following',
    enabled: true,
    parameters: [
      {
        key: 'fast_period',
        name: 'Fast SMA Period',
        nameVi: 'Chu kỳ SMA nhanh',
        type: 'number',
        value: 10,
        min: 5,
        max: 50,
        step: 1
      },
      {
        key: 'slow_period',
        name: 'Slow SMA Period',
        nameVi: 'Chu kỳ SMA chậm',
        type: 'number',
        value: 30,
        min: 20,
        max: 200,
        step: 1
      }
    ]
  },
  {
    id: 'rsi_oversold',
    name: 'RSI Oversold/Overbought',
    nameVi: 'RSI Quá bán/Quá mua',
    description: 'RSI mean reversion strategy',
    descriptionVi: 'Chiến lược hồi quy trung bình RSI',
    type: 'mean_reversion',
    enabled: true,
    parameters: [
      {
        key: 'rsi_period',
        name: 'RSI Period',
        nameVi: 'Chu kỳ RSI',
        type: 'number',
        value: 14,
        min: 7,
        max: 30,
        step: 1
      },
      {
        key: 'oversold_level',
        name: 'Oversold Level',
        nameVi: 'Mức quá bán',
        type: 'number',
        value: 30,
        min: 20,
        max: 40,
        step: 1
      },
      {
        key: 'overbought_level',
        name: 'Overbought Level',
        nameVi: 'Mức quá mua',
        type: 'number',
        value: 70,
        min: 60,
        max: 80,
        step: 1
      }
    ]
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands',
    nameVi: 'Dải Bollinger',
    description: 'Bollinger Bands breakout strategy',
    descriptionVi: 'Chiến lược đột phá dải Bollinger',
    type: 'breakout',
    enabled: true,
    parameters: [
      {
        key: 'period',
        name: 'Period',
        nameVi: 'Chu kỳ',
        type: 'number',
        value: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'std_dev',
        name: 'Standard Deviation',
        nameVi: 'Độ lệch chuẩn',
        type: 'number',
        value: 2,
        min: 1,
        max: 3,
        step: 0.1
      }
    ]
  },
  {
    id: 'macd_signal',
    name: 'MACD Signal',
    nameVi: 'Tín hiệu MACD',
    description: 'MACD signal line crossover strategy',
    descriptionVi: 'Chiến lược cắt đường tín hiệu MACD',
    type: 'momentum',
    enabled: true,
    parameters: [
      {
        key: 'fast_period',
        name: 'Fast EMA Period',
        nameVi: 'Chu kỳ EMA nhanh',
        type: 'number',
        value: 12,
        min: 8,
        max: 20,
        step: 1
      },
      {
        key: 'slow_period',
        name: 'Slow EMA Period',
        nameVi: 'Chu kỳ EMA chậm',
        type: 'number',
        value: 26,
        min: 20,
        max: 35,
        step: 1
      },
      {
        key: 'signal_period',
        name: 'Signal Period',
        nameVi: 'Chu kỳ tín hiệu',
        type: 'number',
        value: 9,
        min: 5,
        max: 15,
        step: 1
      }
    ]
  },
  {
    id: 'stochastic',
    name: 'Stochastic Oscillator',
    nameVi: 'Dao động Stochastic',
    description: 'Stochastic oscillator crossover strategy',
    descriptionVi: 'Chiến lược cắt dao động Stochastic',
    type: 'momentum',
    enabled: true,
    parameters: [
      {
        key: 'k_period',
        name: '%K Period',
        nameVi: 'Chu kỳ %K',
        type: 'number',
        value: 14,
        min: 10,
        max: 20,
        step: 1
      },
      {
        key: 'd_period',
        name: '%D Period',
        nameVi: 'Chu kỳ %D',
        type: 'number',
        value: 3,
        min: 2,
        max: 5,
        step: 1
      },
      {
        key: 'oversold_level',
        name: 'Oversold Level',
        nameVi: 'Mức quá bán',
        type: 'number',
        value: 20,
        min: 15,
        max: 30,
        step: 1
      },
      {
        key: 'overbought_level',
        name: 'Overbought Level',
        nameVi: 'Mức quá mua',
        type: 'number',
        value: 80,
        min: 70,
        max: 85,
        step: 1
      }
    ]
  }
];

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  symbol: 'BTC/USDT',
  timeframe: '1h',
  startDate: '2020-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  positionSize: 10, // 10% per trade
  maxPositions: 3,
  commission: 0.1, // 0.1%
  slippage: 0.05, // 0.05%
  strategies: PREDEFINED_STRATEGIES
};
