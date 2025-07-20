// Enhanced Trailing Stop Service
import {
  TrailingStopPosition,
  TrailingStopSettings,
  MarketVolatility,
  TrailingStopAlert,
  TrailingStopStrategy,
  ChartPoint
} from '../types/trailingStop';
import { tradingApiService } from './tradingApiService';
import {
  calculateTrailingStop,
  StrategyCalculationParams,
  StrategyCalculationResult,
  CandleData
} from './strategyCalculations';
import { StrategySwitchingService } from './strategySwitchingService';
import { notificationService } from './notificationService';

export class EnhancedTrailingStopService {
  private positions: Map<string, TrailingStopPosition> = new Map();
  private settings: TrailingStopSettings;
  private alerts: TrailingStopAlert[] = [];
  private strategySwitchingService: StrategySwitchingService;
  private updateInterval?: NodeJS.Timeout;

  constructor(settings: TrailingStopSettings) {
    this.settings = settings;
    this.strategySwitchingService = new StrategySwitchingService();
  }

  // Create a new trailing stop position with advanced strategy configuration
  async createPositionWithStrategy(config: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    entryPrice?: number;
    strategy: TrailingStopStrategy;
    strategyConfig: Record<string, any>; // Strategy-specific configuration from StrategyConfigPanel
    maxLossPercent?: number;
    activationPrice?: number;
    accountBalance?: number;
    riskPercent?: number;
  }): Promise<TrailingStopPosition> {
    const id = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const currentPrice = await this.getCurrentPrice(config.symbol);
    const volatility = await this.calculateVolatility(config.symbol);

    // Use provided entry price or current market price
    const entryPrice = config.entryPrice || currentPrice;

    // Calculate optimal position size
    const optimalQuantity = await this.calculateOptimalPositionSize({
      symbol: config.symbol,
      entryPrice,
      side: config.side,
      accountBalance: config.accountBalance,
      riskPercent: config.riskPercent,
      providedQuantity: config.quantity,
      volatility
    });

    // Extract strategy-specific parameters from config
    const strategyParams = this.extractStrategyParameters(config.strategy, config.strategyConfig);

    // Calculate initial stop loss using advanced strategy
    const initialStopLoss = await this.calculateInitialStopLoss({
      strategy: config.strategy,
      entryPrice,
      currentPrice,
      side: config.side,
      symbol: config.symbol,
      ...strategyParams
    });

    const position: TrailingStopPosition = {
      id,
      symbol: config.symbol,
      side: config.side,
      quantity: optimalQuantity,
      entryPrice,
      currentPrice,
      highestPrice: config.side === 'sell' ? currentPrice : entryPrice,
      lowestPrice: config.side === 'buy' ? currentPrice : entryPrice,

      // Strategy configuration
      strategy: config.strategy,
      ...strategyParams,

      // Risk management
      maxLossPercent: config.maxLossPercent || this.settings.maxLossPercent,
      activationPrice: config.activationPrice,
      stopLossPrice: initialStopLoss,

      // Status and timing
      status: config.activationPrice ? 'pending' : 'active',
      createdAt: Date.now(),
      activatedAt: config.activationPrice ? undefined : Date.now(),

      // Performance metrics
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      maxDrawdown: 0,
      maxProfit: 0,

      // Chart data
      chartData: {
        entryPoint: { time: Date.now(), price: entryPrice, color: '#3b82f6' },
        currentPoint: { time: Date.now(), price: currentPrice, color: '#10b981' },
        stopLossPoint: { time: Date.now(), price: initialStopLoss, color: '#ef4444' },
        trailingPath: [],
        profitZone: { min: entryPrice, max: currentPrice, color: '#10b981' },
        lossZone: { min: initialStopLoss, max: entryPrice, color: '#ef4444' },
        indicators: {},
        confidence: 0.8
      }
    };

    this.updatePositionMetrics(position);
    this.positions.set(id, position);

    this.addAlert({
      type: 'activation',
      message: `Advanced trailing stop (${config.strategy}) created for ${config.symbol}`,
      position,
      severity: 'info'
    });

    return position;
  }

  // Create a new trailing stop position (legacy method for backward compatibility)
  async createPosition(config: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    entryPrice?: number; // Made optional - will use current market price if not provided
    strategy?: TrailingStopStrategy;
    trailingPercent?: number;
    maxLossPercent?: number;
    activationPrice?: number;
    accountBalance?: number; // For position sizing calculation
    riskPercent?: number; // Risk percentage of account balance
  }): Promise<TrailingStopPosition> {
    const id = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const currentPrice = await this.getCurrentPrice(config.symbol);
    const volatility = await this.calculateVolatility(config.symbol);

    // Use current market price if entry price not provided
    const entryPrice = config.entryPrice || currentPrice;

    // Calculate optimal position size if account balance and risk percent provided
    const quantity = await this.calculateOptimalPositionSize({
      symbol: config.symbol,
      entryPrice,
      side: config.side,
      accountBalance: config.accountBalance,
      riskPercent: config.riskPercent,
      providedQuantity: config.quantity,
      volatility
    });
    
    const position: TrailingStopPosition = {
      id,
      symbol: config.symbol,
      side: config.side,
      quantity: quantity,
      entryPrice: entryPrice,
      currentPrice,
      highestPrice: config.side === 'sell' ? Math.max(entryPrice, currentPrice) : entryPrice,
      lowestPrice: config.side === 'buy' ? Math.min(entryPrice, currentPrice) : entryPrice,

      strategy: config.strategy || this.settings.defaultStrategy,
      trailingPercent: config.trailingPercent || this.calculateDynamicTrailingPercent(volatility),
      maxLossPercent: config.maxLossPercent || this.settings.defaultMaxLoss,

      status: config.activationPrice ? 'pending' : 'active',
      activationPrice: config.activationPrice,
      stopLossPrice: this.calculateStopLoss(entryPrice, config.side, config.trailingPercent || this.settings.defaultTrailingPercent),
      
      createdAt: Date.now(),
      activatedAt: config.activationPrice ? undefined : Date.now(),
      
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      maxDrawdown: 0,
      maxProfit: 0,
      
      chartData: {
        entryPoint: { time: Date.now(), price: entryPrice, color: '#3b82f6', label: 'Entry' },
        currentStopLevel: { time: Date.now(), price: 0, color: '#ef4444', label: 'Stop' },
        trailingPath: [],
        profitZone: { topPrice: 0, bottomPrice: 0, color: '#10b981', opacity: 0.1 },
        lossZone: { topPrice: 0, bottomPrice: 0, color: '#ef4444', opacity: 0.1 }
      }
    };
    console.log(position);

    this.updatePositionMetrics(position);
    this.positions.set(id, position);
    
    this.addAlert({
      type: 'activation',
      message: `Trailing stop created for ${config.symbol}`,
      position,
      severity: 'info'
    });

    return position;
  }

  // Calculate optimal position size based on risk management
  private async calculateOptimalPositionSize(config: {
    symbol: string;
    entryPrice: number;
    side: 'buy' | 'sell';
    accountBalance?: number;
    riskPercent?: number;
    providedQuantity: number;
    volatility: MarketVolatility;
  }): Promise<number> {
    // If no account balance or risk percent provided, use provided quantity
    if (!config.accountBalance || !config.riskPercent) {
      return config.providedQuantity;
    }

    try {
      // Calculate risk amount in USDT
      const riskAmount = config.accountBalance * (config.riskPercent / 100);

      // Calculate stop loss distance based on volatility
      const stopLossDistance = this.calculateStopLossDistance(config.entryPrice, config.volatility, config.side);

      // Calculate position size: Risk Amount / Stop Loss Distance
      const calculatedQuantity = riskAmount / stopLossDistance;

      // Apply safety limits (max 10% of account balance in single position)
      const maxPositionValue = config.accountBalance * 0.1;
      const maxQuantity = maxPositionValue / config.entryPrice;

      const finalQuantity = Math.min(calculatedQuantity, maxQuantity, config.providedQuantity);

      console.log(`Position sizing for ${config.symbol}:`, {
        riskAmount,
        stopLossDistance,
        calculatedQuantity,
        maxQuantity,
        finalQuantity
      });

      return Math.max(0.001, finalQuantity); // Minimum position size
    } catch (error) {
      console.error('Error calculating optimal position size:', error);
      return config.providedQuantity; // Fallback to provided quantity
    }
  }

  // Calculate stop loss distance for position sizing
  private calculateStopLossDistance(entryPrice: number, volatility: MarketVolatility, _side: 'buy' | 'sell'): number {
    // Use ATR-based stop loss distance for more accurate risk calculation
    const atrDistance = volatility.atr * (this.settings.atrMultiplier || 2.0);

    // Minimum distance based on volatility percentage
    const percentageDistance = entryPrice * (volatility.volatilityPercent / 100);

    // Use the larger of ATR or percentage-based distance for safety
    const stopDistance = Math.max(atrDistance, percentageDistance);

    // Ensure minimum stop distance (0.1% of entry price) for safety
    return Math.max(stopDistance, entryPrice * 0.001);
  }

  // Calculate dynamic trailing percentage based on market volatility
  private calculateDynamicTrailingPercent(volatility: MarketVolatility): number {
    const basePercent = this.settings.defaultTrailingPercent;
    const volatilityAdjustment = volatility.volatilityPercent * this.settings.volatilityMultiplier;

    // Adjust trailing percentage based on volatility
    // Higher volatility = wider trailing stop
    return Math.max(0.5, Math.min(10, basePercent + volatilityAdjustment));
  }

  // Calculate stop loss price based on strategy
  private calculateStopLoss(entryPrice: number, side: 'buy' | 'sell', trailingPercent: number): number {
    if (side === 'sell') {
      return entryPrice * (1 - trailingPercent / 100);
    } else {
      return entryPrice * (1 + trailingPercent / 100);
    }
  }

  // Update position with current market data
  async updatePosition(positionId: string): Promise<void> {
    const position = this.positions.get(positionId);
    if (!position) return;

    const currentPrice = await this.getCurrentPrice(position.symbol);
    position.currentPrice = currentPrice;

    // Check activation for pending positions
    if (position.status === 'pending' && position.activationPrice) {
      const shouldActivate = position.side === 'sell' 
        ? currentPrice >= position.activationPrice
        : currentPrice <= position.activationPrice;
        
      if (shouldActivate) {
        position.status = 'active';
        position.activatedAt = Date.now();
        this.addAlert({
          type: 'activation',
          message: `Trailing stop activated for ${position.symbol} at ${currentPrice}`,
          position,
          severity: 'success'
        });
      }
    }

    if (position.status !== 'active') return;

    // Update highest/lowest prices
    const priceChanged = this.updatePriceLevels(position, currentPrice);
    
    if (priceChanged) {
      // Check for strategy switching before calculating new stop loss
      await this.evaluateStrategySwitching(position);

      // Recalculate stop loss based on strategy
      const newStopLoss = await this.calculateNewStopLoss(position);
      const stopMoved = Math.abs(newStopLoss - position.stopLossPrice) > 0.0001;

      if (stopMoved) {
        position.stopLossPrice = newStopLoss;

        // Add to trailing path for chart visualization
        position.chartData.trailingPath.push({
          time: Date.now(),
          price: newStopLoss,
          color: '#ef4444'
        });

        this.addAlert({
          type: 'adjustment',
          message: `Stop loss adjusted to ${newStopLoss.toFixed(4)} for ${position.symbol}`,
          position,
          severity: 'info'
        });
      }
    }

    // Check if stop loss is triggered
    const isTriggered = position.side === 'sell' 
      ? currentPrice <= position.stopLossPrice
      : currentPrice >= position.stopLossPrice;

    if (isTriggered) {
      await this.triggerPosition(position, currentPrice);
    } else {
      this.updatePositionMetrics(position);
    }
  }

  // Calculate new stop loss based on selected strategy using advanced calculations
  private async calculateNewStopLoss(position: TrailingStopPosition): Promise<number> {
    try {
      // Get recent candles for advanced calculations
      const candles = await this.getRecentCandles(position.symbol, '1m', 100);

      // Prepare parameters for strategy calculation
      const params: StrategyCalculationParams = {
        strategy: position.strategy,
        currentPrice: position.currentPrice,
        entryPrice: position.entryPrice,
        isLong: position.side === 'sell', // For sell positions, we're going long
        candles: candles,

        // Strategy-specific parameters from position
        trailingPercent: position.trailingPercent,
        atrMultiplier: position.atrMultiplier,
        atrPeriod: position.atrPeriod,
        fibonacciLevel: position.fibonacciLevel,
        bollingerPeriod: position.bollingerPeriod,
        bollingerStdDev: position.bollingerStdDev,
        volumeProfilePeriod: position.volumeProfilePeriod,
        ichimokuTenkan: position.ichimokuTenkan,
        ichimokuKijun: position.ichimokuKijun,
        ichimokuSenkou: position.ichimokuSenkou,
        pivotPointType: position.pivotPointType,

        // Use highest/lowest price for trailing calculation
        highestPrice: position.highestPrice,
        lowestPrice: position.lowestPrice
      };

      // Calculate using advanced strategy
      const result: StrategyCalculationResult = calculateTrailingStop(params);

      // Update position with additional indicators if available
      if (result.indicators) {
        position.chartData.indicators = {
          ...position.chartData.indicators,
          ...result.indicators
        };
      }

      // Add confidence and support/resistance levels to chart data
      if (result.confidence !== undefined) {
        position.chartData.confidence = result.confidence;
      }

      if (result.supportLevel) {
        position.chartData.supportLevel = result.supportLevel;
      }

      if (result.resistanceLevel) {
        position.chartData.resistanceLevel = result.resistanceLevel;
      }

      return result.stopLoss;

    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Advanced calculation failed for ${position.symbol}:`, error);

      // Fallback to simple percentage calculation
      return this.calculatePercentageStopLoss(position);
    }
  }

  // Extract strategy-specific parameters from configuration
  private extractStrategyParameters(strategy: TrailingStopStrategy, config: Record<string, any>): Partial<TrailingStopPosition> {
    const params: Partial<TrailingStopPosition> = {};

    switch (strategy) {
      case 'percentage':
        params.trailingPercent = config.trailingPercent || 2;
        break;

      case 'atr':
      case 'dynamic':
        params.trailingPercent = config.trailingPercent || 2;
        params.atrMultiplier = config.atrMultiplier || 2;
        params.atrPeriod = config.atrPeriod || 14;
        break;

      case 'fibonacci':
        params.trailingPercent = config.trailingPercent || 2;
        params.fibonacciLevel = config.fibonacciLevel || 0.618;
        break;

      case 'bollinger_bands':
        params.trailingPercent = config.trailingPercent || 2;
        params.bollingerPeriod = config.bollingerPeriod || 20;
        params.bollingerStdDev = config.bollingerStdDev || 2;
        break;

      case 'volume_profile':
        params.trailingPercent = config.trailingPercent || 2;
        params.volumeProfilePeriod = config.volumeProfilePeriod || 50;
        break;

      case 'smart_money':
        params.trailingPercent = config.trailingPercent || 2;
        break;

      case 'ichimoku':
        params.trailingPercent = config.trailingPercent || 2;
        params.ichimokuTenkan = config.ichimokuTenkan || 9;
        params.ichimokuKijun = config.ichimokuKijun || 26;
        params.ichimokuSenkou = config.ichimokuSenkou || 52;
        break;

      case 'pivot_points':
        params.trailingPercent = config.trailingPercent || 2;
        params.pivotPointType = config.pivotPointType || 'standard';
        break;

      case 'support_resistance':
        params.trailingPercent = config.trailingPercent || 2;
        params.supportResistanceLevel = config.supportResistanceLevel;
        break;

      case 'hybrid':
        params.trailingPercent = config.trailingPercent || 2;
        params.atrMultiplier = config.atrMultiplier || 2;
        params.fibonacciLevel = config.fibonacciLevel || 0.618;
        params.volumeProfilePeriod = config.volumeProfilePeriod || 50;
        break;

      default:
        params.trailingPercent = config.trailingPercent || 2;
    }

    return params;
  }

  // Calculate initial stop loss using advanced strategy
  private async calculateInitialStopLoss(params: {
    strategy: TrailingStopStrategy;
    entryPrice: number;
    currentPrice: number;
    side: 'buy' | 'sell';
    symbol: string;
    [key: string]: any;
  }): Promise<number> {
    try {
      const candles = await this.getRecentCandles(params.symbol, '1m', 100);

      const strategyParams: StrategyCalculationParams = {
        strategy: params.strategy,
        currentPrice: params.currentPrice,
        entryPrice: params.entryPrice,
        isLong: params.side === 'sell',
        candles: candles,
        trailingPercent: params.trailingPercent,
        atrMultiplier: params.atrMultiplier,
        atrPeriod: params.atrPeriod,
        fibonacciLevel: params.fibonacciLevel,
        bollingerPeriod: params.bollingerPeriod,
        bollingerStdDev: params.bollingerStdDev,
        volumeProfilePeriod: params.volumeProfilePeriod,
        ichimokuTenkan: params.ichimokuTenkan,
        ichimokuKijun: params.ichimokuKijun,
        ichimokuSenkou: params.ichimokuSenkou,
        pivotPointType: params.pivotPointType
      };

      const result = calculateTrailingStop(strategyParams);
      return result.stopLoss;

    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Initial stop loss calculation failed:`, error);

      // Fallback to simple percentage calculation
      const trailingPercent = params.trailingPercent || 2;
      if (params.side === 'sell') {
        return params.entryPrice * (1 - trailingPercent / 100);
      } else {
        return params.entryPrice * (1 + trailingPercent / 100);
      }
    }
  }

  // Helper method to get recent candles for advanced calculations
  private async getRecentCandles(symbol: string, timeframe: string = '1m', limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`/api/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch candles: ${response.statusText}`);
      }
      const data = await response.json();
      // API trả về data trong field 'data', không phải 'candles'
      return data.data || [];
    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Failed to fetch candles for ${symbol}:`, error);
      return [];
    }
  }

  private calculatePercentageStopLoss(position: TrailingStopPosition): number {
    if (position.side === 'sell') {
      return position.highestPrice * (1 - position.trailingPercent / 100);
    } else {
      return position.lowestPrice * (1 + position.trailingPercent / 100);
    }
  }

  private async calculateATRStopLoss(position: TrailingStopPosition): Promise<number> {
    const volatility = await this.calculateVolatility(position.symbol);
    const atrDistance = volatility.atr * (position.atrMultiplier || this.settings.atrMultiplier);

    if (position.side === 'sell') {
      return position.highestPrice - atrDistance;
    } else {
      return position.lowestPrice + atrDistance;
    }
  }

  private async calculateSupportResistanceStopLoss(position: TrailingStopPosition): Promise<number> {
    const volatility = await this.calculateVolatility(position.symbol);
    
    if (position.side === 'sell' && volatility.supportLevel) {
      return Math.max(volatility.supportLevel, this.calculatePercentageStopLoss(position));
    } else if (position.side === 'buy' && volatility.resistanceLevel) {
      return Math.min(volatility.resistanceLevel, this.calculatePercentageStopLoss(position));
    }
    
    return this.calculatePercentageStopLoss(position);
  }

  private async calculateDynamicStopLoss(position: TrailingStopPosition): Promise<number> {
    const volatility = await this.calculateVolatility(position.symbol);
    const dynamicPercent = this.calculateDynamicTrailingPercent(volatility);
    
    if (position.side === 'sell') {
      return position.highestPrice * (1 - dynamicPercent / 100);
    } else {
      return position.lowestPrice * (1 + dynamicPercent / 100);
    }
  }

  private async calculateHybridStopLoss(position: TrailingStopPosition): Promise<number> {
    const percentageStop = this.calculatePercentageStopLoss(position);
    const atrStop = await this.calculateATRStopLoss(position);
    const srStop = await this.calculateSupportResistanceStopLoss(position);
    
    // Use the most conservative (furthest from current price) stop loss
    if (position.side === 'sell') {
      return Math.min(percentageStop, atrStop, srStop);
    } else {
      return Math.max(percentageStop, atrStop, srStop);
    }
  }

  // Helper methods
  private updatePriceLevels(position: TrailingStopPosition, currentPrice: number): boolean {
    let changed = false;
    
    if (position.side === 'sell' && currentPrice > position.highestPrice) {
      position.highestPrice = currentPrice;
      changed = true;
    } else if (position.side === 'buy' && currentPrice < position.lowestPrice) {
      position.lowestPrice = currentPrice;
      changed = true;
    }
    
    return changed;
  }

  private updatePositionMetrics(position: TrailingStopPosition): void {
    const priceDiff = position.currentPrice - position.entryPrice;
    position.unrealizedPnL = priceDiff * position.quantity;
    position.unrealizedPnLPercent = (priceDiff / position.entryPrice) * 100;
    
    // Update max profit and drawdown
    if (position.unrealizedPnLPercent > position.maxProfit) {
      position.maxProfit = position.unrealizedPnLPercent;
    }
    
    const drawdown = position.maxProfit - position.unrealizedPnLPercent;
    if (drawdown > position.maxDrawdown) {
      position.maxDrawdown = drawdown;
    }

    // Update chart zones
    this.updateChartZones(position);
  }

  private updateChartZones(position: TrailingStopPosition): void {
    const currentPrice = position.currentPrice;
    const stopPrice = position.stopLossPrice;
    
    if (position.side === 'sell') {
      // Profit zone above current price
      position.chartData.profitZone = {
        topPrice: Math.max(currentPrice * 1.1, position.highestPrice),
        bottomPrice: currentPrice,
        color: '#10b981',
        opacity: 0.1
      };
      
      // Loss zone below stop price
      position.chartData.lossZone = {
        topPrice: stopPrice,
        bottomPrice: stopPrice * 0.9,
        color: '#ef4444',
        opacity: 0.1
      };
    } else {
      // Profit zone below current price
      position.chartData.profitZone = {
        topPrice: currentPrice,
        bottomPrice: Math.min(currentPrice * 0.9, position.lowestPrice),
        color: '#10b981',
        opacity: 0.1
      };
      
      // Loss zone above stop price
      position.chartData.lossZone = {
        topPrice: stopPrice * 1.1,
        bottomPrice: stopPrice,
        color: '#ef4444',
        opacity: 0.1
      };
    }

    // Update current stop level
    position.chartData.currentStopLevel = {
      time: Date.now(),
      price: stopPrice,
      color: '#ef4444',
      label: `Stop: ${stopPrice.toFixed(4)}`
    };
  }

  /**
   * Evaluate if strategy should be switched for a position
   */
  private async evaluateStrategySwitching(position: TrailingStopPosition): Promise<void> {
    try {
      // Get recent candles for analysis
      const candles = await this.getRecentCandles(position.symbol, '1m', 100);
      if (candles.length < 20) return;

      // Evaluate switching conditions
      const switchingResult = await this.strategySwitchingService.evaluateStrategySwitching(
        position,
        candles,
        { currentPrice: position.currentPrice }
      );

      if (switchingResult.shouldSwitch && switchingResult.newStrategy && switchingResult.rule) {
        // Execute strategy switch
        const updatedPosition = await this.strategySwitchingService.executeStrategySwitch(
          position,
          switchingResult.newStrategy,
          switchingResult.reason || 'Strategy switching triggered',
          candles
        );

        // Update position in our map
        this.positions.set(position.id, updatedPosition);

        // Add alert for strategy switch
        this.addAlert({
          type: 'strategy_switch',
          message: `Strategy switched from ${position.strategy} to ${switchingResult.newStrategy} for ${position.symbol}: ${switchingResult.reason}`,
          position: updatedPosition,
          severity: 'info'
        });

        console.log(`[EnhancedTrailingStopService] Strategy switched for ${position.id}: ${position.strategy} → ${switchingResult.newStrategy}`);
      }
    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Strategy switching evaluation failed for ${position.id}:`, error);
    }
  }

  private async triggerPosition(position: TrailingStopPosition, triggerPrice: number): Promise<void> {
    position.status = 'triggered';
    position.triggeredAt = Date.now();
    
    this.addAlert({
      type: 'trigger',
      message: `Trailing stop triggered for ${position.symbol} at ${triggerPrice}`,
      position,
      severity: 'warning'
    });

    // Here you would execute the actual trade
    // await this.executeMarketOrder(position, triggerPrice);
  }

  private addAlert(config: {
    type: TrailingStopAlert['type'];
    message: string;
    position: TrailingStopPosition;
    severity: TrailingStopAlert['severity'];
  }): void {
    const alert: TrailingStopAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: config.type,
      message: config.message,
      position: config.position,
      timestamp: Date.now(),
      severity: config.severity
    };

    this.alerts.unshift(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // Send to notification service
    notificationService.handleTrailingStopAlert(alert);
  }

  // Real API methods using TradingApiService with enhanced error handling
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const price = await tradingApiService.getCurrentPrice(symbol);

      // Validate price data
      if (!price || isNaN(price) || price <= 0) {
        throw new Error(`Invalid price data received: ${price}`);
      }

      return price;
    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Error fetching current price for ${symbol}:`, error);

      // Enhanced fallback with more realistic prices
      const baseCurrency = symbol.split('/')[0];
      const fallbackPrices: Record<string, number> = {
        'BTC': 109000,  // Updated to current market price ~$109k
        'ETH': 3800,    // Updated to current market price
        'PEPE': 0.00002,
        'DOGE': 0.08,
        'SHIB': 0.000012,
        'ADA': 0.45,
        'SOL': 100,
        'MATIC': 1.0,
        'BNB': 300,
        'XRP': 0.6
      };

      const fallbackPrice = fallbackPrices[baseCurrency] || 100;
      console.warn(`[EnhancedTrailingStopService] Using fallback price ${fallbackPrice} for ${symbol}`);

      return fallbackPrice;
    }
  }

  private async calculateVolatility(symbol: string): Promise<MarketVolatility> {
    try {
      // Sử dụng TradingApiService để tính toán volatility từ dữ liệu thực tế
      const volatilityData = await tradingApiService.calculateVolatility(symbol);

      // Validate volatility data
      if (!volatilityData || !volatilityData.atr || isNaN(volatilityData.atr)) {
        throw new Error(`Invalid volatility data received for ${symbol}`);
      }

      // Chuyển đổi từ MarketVolatilityData sang MarketVolatility interface
      return {
        symbol: volatilityData.symbol,
        atr: volatilityData.atr,
        volatilityPercent: volatilityData.volatilityPercent,
        trend: volatilityData.trend,
        strength: volatilityData.strength,
        supportLevel: volatilityData.supportLevel,
        resistanceLevel: volatilityData.resistanceLevel
      };
    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Error calculating volatility for ${symbol}:`, error);

      // Fallback với dữ liệu mặc định an toàn
      try {
        const currentPrice = await this.getCurrentPrice(symbol);
        const baseCurrency = symbol.split('/')[0];

        // Enhanced fallback profiles với nhiều coins hơn
        const fallbackProfiles: Record<string, { baseVolatility: number; atrMultiplier: number; strength: number }> = {
          'BTC': { baseVolatility: 2.5, atrMultiplier: 0.02, strength: 75 },
          'ETH': { baseVolatility: 3.0, atrMultiplier: 0.025, strength: 70 },
          'PEPE': { baseVolatility: 8.0, atrMultiplier: 0.15, strength: 45 },
          'DOGE': { baseVolatility: 6.0, atrMultiplier: 0.08, strength: 50 },
          'SHIB': { baseVolatility: 7.5, atrMultiplier: 0.12, strength: 40 },
          'ADA': { baseVolatility: 4.5, atrMultiplier: 0.04, strength: 65 },
          'SOL': { baseVolatility: 5.0, atrMultiplier: 0.06, strength: 60 },
          'MATIC': { baseVolatility: 5.5, atrMultiplier: 0.05, strength: 55 },
          'BNB': { baseVolatility: 3.5, atrMultiplier: 0.03, strength: 70 },
          'XRP': { baseVolatility: 4.0, atrMultiplier: 0.04, strength: 60 }
        };

        const profile = fallbackProfiles[baseCurrency] || { baseVolatility: 4.0, atrMultiplier: 0.05, strength: 60 };

        console.warn(`[EnhancedTrailingStopService] Using fallback volatility profile for ${symbol}:`, profile);

        return {
          symbol,
          atr: currentPrice * profile.atrMultiplier,
          volatilityPercent: profile.baseVolatility,
          trend: 'sideways',
          strength: profile.strength,
          supportLevel: currentPrice * 0.95,
          resistanceLevel: currentPrice * 1.05
        };
      } catch (fallbackError) {
        console.error(`[EnhancedTrailingStopService] Fallback volatility calculation failed for ${symbol}:`, fallbackError);

        // Ultimate fallback with safe defaults
        return {
          symbol,
          atr: 100,
          volatilityPercent: 4.0,
          trend: 'sideways',
          strength: 50,
          supportLevel: 40000,
          resistanceLevel: 50000
        };
      }
    }
  }

  // Get available strategies with performance comparison
  async getStrategiesPerformance(symbol: string, timeframe: string = '1h', period: number = 24): Promise<{
    strategy: TrailingStopStrategy;
    name: string;
    performance: {
      winRate: number;
      avgProfit: number;
      maxDrawdown: number;
      sharpeRatio: number;
    };
  }[]> {
    try {
      const candles = await this.getRecentCandles(symbol, timeframe, period);

      if (candles.length < 10) {
        return [];
      }

      const strategies: TrailingStopStrategy[] = [
        'percentage', 'atr', 'fibonacci', 'bollinger_bands',
        'volume_profile', 'smart_money', 'ichimoku', 'pivot_points', 'hybrid'
      ];

      const results = [];

      for (const strategy of strategies) {
        const performance = await this.backtestStrategy(strategy, candles, symbol);
        results.push({
          strategy,
          name: this.getStrategyDisplayName(strategy),
          performance
        });
      }

      // Sort by Sharpe ratio (risk-adjusted returns)
      return results.sort((a, b) => b.performance.sharpeRatio - a.performance.sharpeRatio);

    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Strategy performance analysis failed:`, error);
      return [];
    }
  }

  private getStrategyDisplayName(strategy: TrailingStopStrategy): string {
    const names: Record<TrailingStopStrategy, string> = {
      'percentage': 'Percentage Based',
      'atr': 'ATR Based',
      'support_resistance': 'Support/Resistance',
      'dynamic': 'Dynamic Volatility',
      'hybrid': 'Hybrid Multi-Strategy',
      'fibonacci': 'Fibonacci Retracement',
      'bollinger_bands': 'Bollinger Bands',
      'volume_profile': 'Volume Profile',
      'smart_money': 'Smart Money Concepts',
      'ichimoku': 'Ichimoku Cloud',
      'pivot_points': 'Pivot Points'
    };
    return names[strategy] || strategy;
  }

  private async backtestStrategy(strategy: TrailingStopStrategy, candles: any[], symbol: string): Promise<{
    winRate: number;
    avgProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  }> {
    // Simplified backtest - in production this would be more comprehensive
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    const returns: number[] = [];

    try {
      // Convert raw candles array to CandleData objects
      const convertedCandles = candles.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

      for (let i = 10; i < convertedCandles.length - 1; i++) {
        const entryPrice = convertedCandles[i].close;
        const exitPrice = convertedCandles[i + 1].close;

        const params: StrategyCalculationParams = {
          strategy,
          currentPrice: entryPrice,
          entryPrice,
          isLong: true,
          candles: convertedCandles.slice(0, i + 1),
          trailingPercent: 2,
          atrMultiplier: 2,
          atrPeriod: 14
        };

        const result = calculateTrailingStop(params);
        const stopLoss = result.stopLoss;

        // Simulate trade outcome
        if (exitPrice > entryPrice && exitPrice > stopLoss) {
          // Winning trade
          const profit = (exitPrice - entryPrice) / entryPrice * 100;
          wins++;
          totalProfit += profit;
          returns.push(profit);
          currentDrawdown = Math.max(0, currentDrawdown - profit);
        } else {
          // Losing trade (stopped out)
          const loss = (stopLoss - entryPrice) / entryPrice * 100;
          losses++;
          totalProfit += loss;
          returns.push(loss);
          currentDrawdown += Math.abs(loss);
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
      }

      const totalTrades = wins + losses;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

      // Calculate Sharpe ratio (simplified)
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const stdDev = returns.length > 1 ? Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)) : 1;
      const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

      return {
        winRate,
        avgProfit,
        maxDrawdown,
        sharpeRatio
      };

    } catch (error) {
      console.error(`[EnhancedTrailingStopService] Backtest failed for ${strategy}:`, error);
      return {
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 100,
        sharpeRatio: -1
      };
    }
  }

  // Public API methods
  getPosition(id: string): TrailingStopPosition | undefined {
    return this.positions.get(id);
  }

  getAllPositions(): TrailingStopPosition[] {
    return Array.from(this.positions.values());
  }

  getActivePositions(): TrailingStopPosition[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'active' || p.status === 'pending');
  }

  getAlerts(): TrailingStopAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  async removePosition(id: string): Promise<boolean> {
    const position = this.positions.get(id);
    if (!position) return false;

    if (position.status === 'active' || position.status === 'pending') {
      position.status = 'cancelled';
    }

    this.positions.delete(id);
    return true;
  }

  startMonitoring(): void {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(async () => {
      const activePositions = this.getActivePositions();
      for (const position of activePositions) {
        await this.updatePosition(position.id);
      }
    }, this.settings.updateInterval);
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  // Health check methods for API connectivity
  async checkApiHealth(): Promise<{ isHealthy: boolean; errors: string[] }> {
    const errors: string[] = [];
    let isHealthy = true;

    try {
      // Test price API with BTC/USDT
      const btcPrice = await this.getCurrentPrice('BTC/USDT');
      if (!btcPrice || btcPrice <= 0) {
        errors.push('Price API returned invalid data');
        isHealthy = false;
      }
    } catch (error) {
      errors.push(`Price API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      isHealthy = false;
    }

    try {
      // Test volatility calculation
      const btcVolatility = await this.calculateVolatility('BTC/USDT');
      if (!btcVolatility || !btcVolatility.atr) {
        errors.push('Volatility calculation returned invalid data');
        isHealthy = false;
      }
    } catch (error) {
      errors.push(`Volatility API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      isHealthy = false;
    }

    return { isHealthy, errors };
  }

  // Get service statistics
  getServiceStats(): {
    totalPositions: number;
    activePositions: number;
    pendingPositions: number;
    triggeredPositions: number;
    totalAlerts: number;
    isMonitoring: boolean;
  } {
    const positions = Array.from(this.positions.values());

    return {
      totalPositions: positions.length,
      activePositions: positions.filter(p => p.status === 'active').length,
      pendingPositions: positions.filter(p => p.status === 'pending').length,
      triggeredPositions: positions.filter(p => p.status === 'triggered').length,
      totalAlerts: this.alerts.length,
      isMonitoring: !!this.updateInterval
    };
  }

  // Update service settings
  updateSettings(newSettings: Partial<TrailingStopSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('[EnhancedTrailingStopService] Settings updated:', this.settings);
  }

  // Clear API cache (useful for testing or manual refresh)
  clearApiCache(): void {
    tradingApiService.clearCache();
    console.log('[EnhancedTrailingStopService] API cache cleared');
  }

  /**
   * Get strategy switching service for external access
   */
  getStrategySwitchingService(): StrategySwitchingService {
    return this.strategySwitchingService;
  }

  /**
   * Get all positions (including completed ones) for performance analysis
   */
  getAllPositions(): TrailingStopPosition[] {
    return Array.from(this.positions.values());
  }
}

// Default settings for the service
const defaultSettings: TrailingStopSettings = {
  defaultStrategy: 'percentage',
  defaultTrailingPercent: 2.0,
  defaultMaxLoss: 5.0,
  atrPeriod: 14,
  atrMultiplier: 2.0,
  volatilityLookback: 20,
  volatilityMultiplier: 1.5,
  maxPositions: 10,
  maxRiskPerPosition: 2.0,
  updateInterval: 5000,
  priceChangeThreshold: 0.1
};

// Export singleton instance
export const enhancedTrailingStopService = new EnhancedTrailingStopService(defaultSettings);
