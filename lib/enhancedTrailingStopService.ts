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

export class EnhancedTrailingStopService {
  private positions: Map<string, TrailingStopPosition> = new Map();
  private settings: TrailingStopSettings;
  private alerts: TrailingStopAlert[] = [];
  private updateInterval?: NodeJS.Timeout;

  constructor(settings: TrailingStopSettings) {
    this.settings = settings;
  }

  // Create a new trailing stop position
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

  // Calculate new stop loss based on selected strategy
  private async calculateNewStopLoss(position: TrailingStopPosition): Promise<number> {
    switch (position.strategy) {
      case 'percentage':
        return this.calculatePercentageStopLoss(position);
      
      case 'atr':
        return await this.calculateATRStopLoss(position);
      
      case 'support_resistance':
        return await this.calculateSupportResistanceStopLoss(position);
      
      case 'dynamic':
        return await this.calculateDynamicStopLoss(position);
      
      case 'hybrid':
        return await this.calculateHybridStopLoss(position);
      
      default:
        return this.calculatePercentageStopLoss(position);
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
        'BTC': 45000,
        'ETH': 3200,
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
