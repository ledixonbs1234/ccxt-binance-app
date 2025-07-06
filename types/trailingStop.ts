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
  | 'hybrid';             // Combination of multiple strategies

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

export interface TrailingStopAlert {
  id: string;
  type: 'adjustment' | 'trigger' | 'activation' | 'warning';
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
