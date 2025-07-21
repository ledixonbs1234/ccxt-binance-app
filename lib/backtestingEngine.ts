// Backtesting Engine for Enhanced Trailing Stop Strategies
import { historicalDataService, CandleData, Timeframe } from './historicalDataService';
import { calculateTrailingStop } from './strategyCalculations';
import { TrailingStopStrategy } from '@/types/trailingStop';
import { BacktestingEngineHelpers } from './backtestingEngine-part2';

// Backtesting Interfaces
export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  startDate: Date;
  endDate: Date;
  strategy: TrailingStopStrategy;
  initialCapital: number;
  positionSize: number; // Percentage of capital per trade (0.1 = 10%)
  maxPositions: number; // Maximum concurrent positions
  
  // Strategy Parameters
  trailingPercent?: number;
  atrMultiplier?: number;
  atrPeriod?: number;
  volatilityLookback?: number;
  fibonacciLevel?: number;
  bollingerPeriod?: number;
  bollingerStdDev?: number;
  
  // Risk Management
  maxLossPercent: number; // Maximum loss per trade (0.02 = 2%)
  stopLossPercent?: number; // Initial stop loss (0.05 = 5%)
  takeProfitPercent?: number; // Take profit target (0.1 = 10%)
  
  // Entry Conditions
  entryCondition: 'always' | 'trend_up' | 'trend_down' | 'breakout' | 'pullback';
  minVolume?: number; // Minimum volume for entry
  rsiOverbought?: number; // RSI level for overbought (70)
  rsiOversold?: number; // RSI level for oversold (30)
}

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
  strategy: TrailingStopStrategy;
  entryReason: string;
  exitReason?: string;
  
  // Technical Indicators at Entry
  rsi?: number;
  atr?: number;
  volume: number;
  volatility?: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  performance: BacktestPerformance;
  equity: EquityPoint[];
  drawdown: DrawdownPoint[];
  monthlyReturns: MonthlyReturn[];
  
  // Execution Info
  executionTime: number;
  candlesProcessed: number;
  dataQuality: string;
}

export interface BacktestPerformance {
  // Basic Metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // P&L Metrics
  totalReturn: number;
  totalReturnPercent: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  
  // Risk Metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // Time Metrics
  avgHoldingPeriod: number; // In hours
  maxHoldingPeriod: number;
  minHoldingPeriod: number;
  
  // Advanced Metrics
  expectancy: number;
  recoveryFactor: number;
  ulcerIndex: number;
  
  // Strategy Specific
  avgTrailingDistance: number;
  maxTrailingDistance: number;
  trailingEfficiency: number; // How often trailing stop captured profits
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
  duration: number; // In hours
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  returnPercent: number;
  trades: number;
}

export class BacktestingEngine {
  private static instance: BacktestingEngine;
  
  private constructor() {}
  
  static getInstance(): BacktestingEngine {
    if (!BacktestingEngine.instance) {
      BacktestingEngine.instance = new BacktestingEngine();
    }
    return BacktestingEngine.instance;
  }
  
  /**
   * Run backtest với configuration đã cho
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log(`[BacktestingEngine] Starting backtest for ${config.symbol} ${config.strategy}`);
    const startTime = Date.now();
    
    try {
      // 1. Fetch historical data
      const historicalData = await historicalDataService.fetchHistoricalData({
        symbol: config.symbol,
        timeframe: config.timeframe,
        startDate: config.startDate,
        endDate: config.endDate
      });
      
      if (historicalData.length === 0) {
        throw new Error('No historical data available for the specified period');
      }
      
      console.log(`[BacktestingEngine] Loaded ${historicalData.length} candles`);
      
      // 2. Validate data quality
      const qualityReport = historicalDataService.validateDataQuality(historicalData);
      console.log(`[BacktestingEngine] Data quality: ${qualityReport.recommendation}`);
      
      // 3. Run simulation
      const trades = await this.simulateTrading(config, historicalData);
      
      // 4. Calculate performance metrics
      const performance = BacktestingEngineHelpers.calculatePerformance(config, trades);

      // 5. Generate equity curve and drawdown
      const equity = BacktestingEngineHelpers.calculateEquityCurve(config, trades, historicalData);
      const drawdown = BacktestingEngineHelpers.calculateDrawdown(equity);

      // 6. Calculate monthly returns
      const monthlyReturns = BacktestingEngineHelpers.calculateMonthlyReturns(trades);
      
      const executionTime = Date.now() - startTime;
      
      const result: BacktestResult = {
        config,
        trades,
        performance,
        equity,
        drawdown,
        monthlyReturns,
        executionTime,
        candlesProcessed: historicalData.length,
        dataQuality: qualityReport.recommendation
      };
      
      console.log(`[BacktestingEngine] Backtest completed in ${executionTime}ms`);
      console.log(`[BacktestingEngine] Total trades: ${trades.length}, Win rate: ${(performance.winRate * 100).toFixed(2)}%`);
      
      return result;
      
    } catch (error) {
      console.error('[BacktestingEngine] Backtest failed:', error);
      throw error;
    }
  }
  
  /**
   * Simulate trading với historical data
   */
  private async simulateTrading(config: BacktestConfig, candles: CandleData[]): Promise<BacktestTrade[]> {
    const trades: BacktestTrade[] = [];
    const openTrades: BacktestTrade[] = [];
    let currentCapital = config.initialCapital;
    let tradeId = 1;
    
    // Pre-calculate technical indicators
    const indicators = this.calculateIndicators(candles, config);
    
    for (let i = 1; i < candles.length; i++) {
      const currentCandle = candles[i];
      const prevCandle = candles[i - 1];
      
      // Update open trades (trailing stops)
      for (const trade of openTrades) {
        this.updateTrailingStop(trade, currentCandle, config);
        
        // Check for exit conditions
        const exitSignal = BacktestingEngineHelpers.checkExitConditions(trade, currentCandle, indicators[i]);
        if (exitSignal) {
          BacktestingEngineHelpers.closeTrade(trade, currentCandle, exitSignal);
          currentCapital += trade.realizedPnL!;
        }
      }
      
      // Remove closed trades
      const closedTrades = openTrades.filter(t => t.status === 'closed' || t.status === 'stopped');
      closedTrades.forEach(trade => {
        trades.push(trade);
        const index = openTrades.indexOf(trade);
        if (index > -1) openTrades.splice(index, 1);
      });
      
      // Check for new entry signals
      if (openTrades.length < config.maxPositions) {
        const entrySignal = this.checkEntryConditions(currentCandle, prevCandle, indicators[i], config);
        if (entrySignal) {
          const newTrade = this.openTrade(
            tradeId++,
            currentCandle,
            config,
            currentCapital,
            entrySignal,
            indicators[i]
          );
          if (newTrade) {
            openTrades.push(newTrade);
            currentCapital -= newTrade.quantity * newTrade.entryPrice;
          }
        }
      }
    }
    
    // Close any remaining open trades
    const lastCandle = candles[candles.length - 1];
    for (const trade of openTrades) {
      BacktestingEngineHelpers.closeTrade(trade, lastCandle, 'end_of_data');
      trades.push(trade);
    }
    
    return trades;
  }

  /**
   * Calculate technical indicators for all candles
   */
  private calculateIndicators(candles: CandleData[], config: BacktestConfig): any[] {
    const indicators: any[] = [];

    for (let i = 0; i < candles.length; i++) {
      const indicator: any = {
        timestamp: candles[i].timestamp,
        price: candles[i].close,
        volume: candles[i].volume
      };

      // RSI calculation
      if (i >= 14) {
        indicator.rsi = BacktestingEngineHelpers.calculateRSI(candles.slice(Math.max(0, i - 14), i + 1));
      }

      // ATR calculation
      if (i >= (config.atrPeriod || 14)) {
        indicator.atr = BacktestingEngineHelpers.calculateATR(candles.slice(Math.max(0, i - (config.atrPeriod || 14)), i + 1));
      }

      // Volatility calculation
      if (i >= (config.volatilityLookback || 20)) {
        indicator.volatility = BacktestingEngineHelpers.calculateVolatility(candles.slice(Math.max(0, i - (config.volatilityLookback || 20)), i + 1));
      }

      // Bollinger Bands
      if (config.bollingerPeriod && i >= config.bollingerPeriod) {
        const bb = BacktestingEngineHelpers.calculateBollingerBands(
          candles.slice(Math.max(0, i - config.bollingerPeriod), i + 1),
          config.bollingerPeriod,
          config.bollingerStdDev || 2
        );
        indicator.bollingerUpper = bb.upper;
        indicator.bollingerLower = bb.lower;
        indicator.bollingerMiddle = bb.middle;
      }

      indicators.push(indicator);
    }

    return indicators;
  }

  /**
   * Check entry conditions
   */
  private checkEntryConditions(
    currentCandle: CandleData,
    prevCandle: CandleData,
    indicators: any,
    config: BacktestConfig
  ): string | null {
    // Volume filter
    if (config.minVolume && currentCandle.volume < config.minVolume) {
      return null;
    }

    // RSI filters
    if (config.rsiOverbought && indicators.rsi && indicators.rsi > config.rsiOverbought) {
      return null; // Too overbought
    }

    if (config.rsiOversold && indicators.rsi && indicators.rsi < config.rsiOversold) {
      return null; // Too oversold
    }

    // Entry condition logic
    switch (config.entryCondition) {
      case 'always':
        return 'always_entry';

      case 'trend_up':
        if (currentCandle.close > prevCandle.close &&
            currentCandle.close > currentCandle.open) {
          return 'bullish_trend';
        }
        break;

      case 'trend_down':
        if (currentCandle.close < prevCandle.close &&
            currentCandle.close < currentCandle.open) {
          return 'bearish_trend';
        }
        break;

      case 'breakout':
        const priceChange = (currentCandle.close - prevCandle.close) / prevCandle.close;
        if (Math.abs(priceChange) > 0.02) { // 2% breakout
          return priceChange > 0 ? 'bullish_breakout' : 'bearish_breakout';
        }
        break;

      case 'pullback':
        if (indicators.rsi && indicators.rsi < 40 && currentCandle.close > prevCandle.close) {
          return 'pullback_entry';
        }
        break;
    }

    return null;
  }

  /**
   * Open new trade
   */
  private openTrade(
    id: number,
    candle: CandleData,
    config: BacktestConfig,
    availableCapital: number,
    entryReason: string,
    indicators: any
  ): BacktestTrade | null {
    const positionValue = availableCapital * config.positionSize;
    const quantity = positionValue / candle.close;

    if (quantity <= 0) return null;

    const fees = positionValue * 0.001; // 0.1% trading fee

    // Calculate initial stop loss
    const stopLossPercent = config.stopLossPercent || config.maxLossPercent;
    const initialStopPrice = candle.close * (1 - stopLossPercent);

    const trade: BacktestTrade = {
      id: `trade_${id}`,
      entryTime: candle.timestamp,
      entryPrice: candle.close,
      quantity,
      side: 'buy', // For now, only long positions
      status: 'open',

      highestPrice: candle.close,
      lowestPrice: candle.close,
      currentStopPrice: initialStopPrice,
      trailingPercent: config.trailingPercent || 0.05,

      unrealizedPnL: 0,
      fees,

      strategy: config.strategy,
      entryReason,

      rsi: indicators.rsi,
      atr: indicators.atr,
      volume: candle.volume,
      volatility: indicators.volatility
    };

    return trade;
  }

  /**
   * Update trailing stop for open trade
   */
  private updateTrailingStop(trade: BacktestTrade, candle: CandleData, config: BacktestConfig): void {
    // Update highest/lowest prices
    if (candle.high > trade.highestPrice) {
      trade.highestPrice = candle.high;
    }
    if (candle.low < trade.lowestPrice) {
      trade.lowestPrice = candle.low;
    }

    // Calculate new trailing stop based on strategy
    const newStopPrice = BacktestingEngineHelpers.calculateTrailingStop(trade, candle, config);

    // Only move stop up (for long positions)
    if (newStopPrice > trade.currentStopPrice) {
      trade.currentStopPrice = newStopPrice;
    }

    // Update unrealized P&L
    trade.unrealizedPnL = (candle.close - trade.entryPrice) * trade.quantity - trade.fees;
  }
}
