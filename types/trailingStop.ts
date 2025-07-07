// Enhanced Trailing Stop Types
export interface TrailingStopPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  highestPrice: number; // For sell positions
  lowestPrice: number;  // For buy positions
  
  // Strategy Configuration
  strategy: TrailingStopStrategy;
  trailingPercent: number;
  atrMultiplier?: number;
  supportResistanceLevel?: number;

  // Advanced Strategy Parameters
  fibonacciLevel?: number;          // 0.236, 0.382, 0.5, 0.618, 0.786
  bollingerPeriod?: number;         // Period for Bollinger Bands calculation
  bollingerStdDev?: number;         // Standard deviation multiplier
  volumeProfilePeriod?: number;     // Period for volume profile analysis
  smartMoneyStructure?: 'bos' | 'choch' | 'liquidity'; // Break of Structure, Change of Character, Liquidity
  ichimokuSettings?: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanB: number;
  };
  pivotPointType?: 'standard' | 'fibonacci' | 'woodie' | 'camarilla';
  
  // Risk Management
  maxLossPercent: number;
  profitProtectionPercent?: number;
  
  // Status and Timing
  status: 'pending' | 'active' | 'triggered' | 'cancelled' | 'error';
  activationPrice?: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  
  // Timestamps
  createdAt: number;
  activatedAt?: number;
  triggeredAt?: number;
  
  // Performance Metrics
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  maxDrawdown: number;
  maxProfit: number;
  
  // Visual Properties for Chart
  chartData: TrailingStopChartData;
}

export interface TrailingStopChartData {
  entryPoint: ChartPoint;
  currentStopLevel: ChartPoint;
  trailingPath: ChartPoint[];
  profitZone: ChartZone;
  lossZone: ChartZone;
  supportResistanceLevels?: ChartPoint[];
}

export interface ChartPoint {
  time: number;
  price: number;
  color?: string;
  label?: string;
}

export interface ChartZone {
  topPrice: number;
  bottomPrice: number;
  color: string;
  opacity: number;
}

export type TrailingStopStrategy =
  | 'percentage'           // Traditional percentage-based
  | 'atr'                 // ATR (Average True Range) based
  | 'support_resistance'  // Support/Resistance levels
  | 'dynamic'             // Dynamic based on volatility
  | 'hybrid'              // Combination of multiple strategies
  | 'fibonacci'           // Fibonacci retracement levels
  | 'bollinger_bands'     // Bollinger Bands based
  | 'volume_profile'      // Volume Profile based
  | 'smart_money'         // Smart Money Concepts (SMC)
  | 'ichimoku'            // Ichimoku Cloud based
  | 'pivot_points';       // Pivot Points based

export interface TrailingStopSettings {
  // Default Strategy Settings
  defaultStrategy: TrailingStopStrategy;
  defaultTrailingPercent: number;
  defaultMaxLoss: number;

  // ATR Settings
  atrPeriod: number;
  atrMultiplier: number;

  // Dynamic Settings
  volatilityLookback: number;
  volatilityMultiplier: number;

  // Advanced Strategy Settings
  fibonacciSettings: {
    levels: number[];           // [0.236, 0.382, 0.5, 0.618, 0.786]
    lookbackPeriod: number;     // Period to find swing high/low
    defaultLevel: number;       // Default fibonacci level to use
  };

  bollingerSettings: {
    period: number;             // Moving average period
    stdDev: number;             // Standard deviation multiplier
    useUpperBand: boolean;      // Use upper band for resistance
    useLowerBand: boolean;      // Use lower band for support
  };

  volumeProfileSettings: {
    period: number;             // Analysis period
    valueAreaPercent: number;   // Value area percentage (typically 70%)
    pocSensitivity: number;     // Point of Control sensitivity
  };

  smartMoneySettings: {
    structureTimeframe: string; // Timeframe for structure analysis
    liquidityLevels: number;    // Number of liquidity levels to track
    orderBlockPeriod: number;   // Period for order block identification
  };

  ichimokuSettings: {
    tenkanSen: number;          // Conversion line period
    kijunSen: number;           // Base line period
    senkouSpanB: number;        // Leading span B period
    displacement: number;       // Cloud displacement
  };

  pivotSettings: {
    type: 'standard' | 'fibonacci' | 'woodie' | 'camarilla';
    period: 'daily' | 'weekly' | 'monthly';
    levels: number;             // Number of support/resistance levels
  };

  // Risk Management
  maxPositions: number;
  maxRiskPerPosition: number;

  // Performance Optimization
  updateInterval: number;
  priceChangeThreshold: number;
}

export interface MarketVolatility {
  symbol: string;
  atr: number;
  volatilityPercent: number;
  trend: 'bullish' | 'bearish' | 'sideways';
  strength: number; // 0-100
  supportLevel?: number;
  resistanceLevel?: number;
}

// Strategy Metadata for UI and Configuration
export interface StrategyMetadata {
  id: TrailingStopStrategy;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  marketCondition: 'trending' | 'ranging' | 'volatile' | 'any';
  requiredIndicators: string[];
  parameters: StrategyParameter[];
  pros: string[];
  cons: string[];
  bestTimeframes: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface StrategyParameter {
  key: string;
  name: string;
  nameVi: string;
  type: 'number' | 'select' | 'boolean' | 'range';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: any; label: string; labelVi: string }[];
  description: string;
  descriptionVi: string;
  required: boolean;
}

// Strategy Performance Metrics
export interface StrategyPerformance {
  strategy: TrailingStopStrategy;
  symbol: string;
  timeframe: string;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  lastUpdated: number;
}

export interface TrailingStopAlert {
  id: string;
  type: 'adjustment' | 'trigger' | 'activation' | 'warning' | 'strategy_switch';
  message: string;
  position: TrailingStopPosition;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface TrailingStopPerformance {
  totalPositions: number;
  activePositions: number;
  triggeredPositions: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  avgHoldTime: number;
  maxDrawdown: number;
  sharpeRatio?: number;
}
