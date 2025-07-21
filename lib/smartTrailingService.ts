// File: lib/smartTrailingService.ts
import { EventEmitter } from 'events';
import ccxt, { OHLCV, Exchange } from 'ccxt';

// Interfaces
export interface SmartTrailingSettings {
  enabled: boolean;
  minPriceChange: number; // %
  maxPositions: number;
  trailingPercent: number; // %
  minVolume: number; // USD
  rsiThreshold: number;
  investmentAmount: number; // USD
  symbols: string[]; // e.g., ['BTC/USDT', 'ETH/USDT']
  stopLoss: number; // %
  takeProfit: number; // %
}

export interface CoinAnalysis {
  symbol: string;
  currentPrice: number;
  priceChangePercent24h: number;
  momentum: 'strong_up' | 'up' | 'sideways' | 'down' | 'strong_down';
  rsi: number;
  analysis: {
    isGoodForTrailing: boolean;
    confidence: number; // 0-100
    reasons: string[];
  };
}

export interface SmartTrailingPosition {
  id: string;
  symbol: string;
  entryPrice: number;
  quantity: number;
  trailingPercent: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  confidence: number; // Confidence score at time of purchase
  status: 'active' | 'closed';
  createdAt: number;
}

// Singleton Service
class SmartTrailingStopService extends EventEmitter {
  private static instance: SmartTrailingStopService;
  private settings: SmartTrailingSettings;
  private exchange: Exchange;
  private interval: NodeJS.Timeout | null = null;
  private activePositions: SmartTrailingPosition[] = [];

  private constructor() {
    super();
    this.settings = this.getDefaultSettings();
    this.exchange = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET_KEY,
      options: { adjustForTimeDifference: true }
    });
    this.exchange.setSandboxMode(true);
  }

  public static getInstance(): SmartTrailingStopService {
    if (!SmartTrailingStopService.instance) {
      SmartTrailingStopService.instance = new SmartTrailingStopService();
    }
    return SmartTrailingStopService.instance;
  }
  
  private getDefaultSettings(): SmartTrailingSettings {
    return {
      enabled: false,
      minPriceChange: 5,
      maxPositions: 3,
      trailingPercent: 3,
      minVolume: 1_000_000,
      rsiThreshold: 70,
      investmentAmount: 100,
      symbols: ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT'],
      stopLoss: 8,
      takeProfit: 15
    };
  }

  public getSettings(): SmartTrailingSettings {
    return this.settings;
  }
  
  public updateSettings(newSettings: Partial<SmartTrailingSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settingsUpdated', this.settings);
  }

  public async startSmartTrailing(initialSettings?: Partial<SmartTrailingSettings>) {
    if (this.settings.enabled) return;
    
    if (initialSettings) {
      this.updateSettings(initialSettings);
    }

    this.settings.enabled = true;
    this.emit('serviceStarted', { settings: this.settings });

    await this._runAnalysisCycle();
    this.interval = setInterval(() => this._runAnalysisCycle(), 30 * 1000); // Run every 30 seconds
  }

  public stopSmartTrailing() {
    if (!this.settings.enabled) return;
    this.settings.enabled = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.emit('serviceStopped');
  }

  private async _runAnalysisCycle() {
    if (!this.settings.enabled) return;

    try {
      const analyses: CoinAnalysis[] = [];
      for (const symbol of this.settings.symbols) {
        const analysis = await this._analyzeCoin(symbol);
        if (analysis) analyses.push(analysis);
      }
      this.emit('analysisCompleted', analyses);

      // Decision making logic
      this._makeTradingDecisions(analyses);

    } catch (error) {
      this.emit('analysisError', error);
      console.error("Error in analysis cycle:", error);
    }
  }

  private async _analyzeCoin(symbol: string): Promise<CoinAnalysis | null> {
    try {
      const [ticker, ohlcv] = await Promise.all([
        this.exchange.fetchTicker(symbol),
        this.exchange.fetchOHLCV(symbol, '1h', undefined, 100)
      ]);

      if (!ticker.last || !ohlcv || ohlcv.length < 15) return null;

      const currentPrice = ticker.last;
      const priceChangePercent24h = ticker.percentage || 0;
      const volumeUsd24h = ticker.quoteVolume || 0;
      
      const rsi = this._calculateRSI(ohlcv, 14);
      const momentum = this._calculateMomentum(ohlcv);

      const analysis = this._evaluateOpportunity(
        priceChangePercent24h,
        volumeUsd24h,
        rsi,
        momentum
      );

      return {
        symbol,
        currentPrice,
        priceChangePercent24h,
        momentum,
        rsi,
        analysis,
      };

    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  private _evaluateOpportunity(priceChange: number, volume: number, rsi: number, momentum: string) {
    let confidence = 0;
    const reasons: string[] = [];

    if (priceChange > this.settings.minPriceChange) {
      confidence += 30;
      reasons.push(`Price up > ${this.settings.minPriceChange}%`);
    }
    if (volume > this.settings.minVolume) {
      confidence += 20;
      reasons.push(`High volume > ${this.settings.minVolume/1_000_000}M`);
    }
    if (rsi < this.settings.rsiThreshold) {
      confidence += 30;
      reasons.push(`RSI < ${this.settings.rsiThreshold} (not overbought)`);
    }
    if (momentum === 'strong_up' || momentum === 'up') {
      confidence += 20;
      reasons.push(`Strong upward momentum`);
    }
    
    // Normalize confidence
    confidence = Math.min(100, Math.max(0, confidence));
    
    return {
      isGoodForTrailing: confidence >= 70,
      confidence,
      reasons,
    };
  }

  private _makeTradingDecisions(analyses: CoinAnalysis[]) {
    if (this.activePositions.length >= this.settings.maxPositions) {
      return; // Max positions reached
    }

    const opportunities = analyses
      .filter(a => a.analysis.isGoodForTrailing)
      .filter(a => !this.activePositions.some(p => p.symbol === a.symbol))
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence);
      
    if (opportunities.length > 0) {
      const bestOpportunity = opportunities[0];
      this._createPosition(bestOpportunity);
    }
  }

  private async _createPosition(opportunity: CoinAnalysis) {
    const { symbol, currentPrice, analysis } = opportunity;
    const quantity = this.settings.investmentAmount / currentPrice;

    try {
      // In a real scenario, you would place a market buy order here
      // const buyOrder = await this.exchange.createMarketBuyOrder(symbol, quantity);
      
      const newPosition: SmartTrailingPosition = {
        id: `${symbol}-${Date.now()}`,
        symbol,
        entryPrice: currentPrice,
        quantity,
        trailingPercent: this.settings.trailingPercent,
        stopLossPrice: currentPrice * (1 - this.settings.stopLoss / 100),
        takeProfitPrice: currentPrice * (1 + this.settings.takeProfit / 100),
        confidence: analysis.confidence,
        status: 'active',
        createdAt: Date.now()
      };
      
      this.activePositions.push(newPosition);
      this.emit('positionCreated', newPosition);
      
      // Start monitoring this position
      this._monitorPosition(newPosition);

    } catch (error) {
      console.error(`Failed to create position for ${symbol}:`, error);
    }
  }

  private _monitorPosition(position: SmartTrailingPosition) {
    let highestPrice = position.entryPrice;

    const monitorInterval = setInterval(async () => {
      // Check if service is disabled or position is closed
      if (!this.settings.enabled || position.status === 'closed') {
        clearInterval(monitorInterval);
        return;
      }
      
      try {
        const ticker = await this.exchange.fetchTicker(position.symbol);
        const currentPrice = ticker.last;
        if (!currentPrice) return;

        // Update highest price
        if (currentPrice > highestPrice) {
          highestPrice = currentPrice;
        }

        // Check conditions
        const trailingStopPrice = highestPrice * (1 - position.trailingPercent / 100);

        if (currentPrice <= trailingStopPrice || currentPrice <= position.stopLossPrice) {
          this._closePosition(position, currentPrice, 'Stop Loss / Trailing Stop Triggered');
          clearInterval(monitorInterval);
        } else if (currentPrice >= position.takeProfitPrice) {
          this._closePosition(position, currentPrice, 'Take Profit Triggered');
          clearInterval(monitorInterval);
        }
      } catch (error) {
        console.error(`Error monitoring position ${position.symbol}:`, error);
      }
    }, 5000); // Check every 5 seconds
  }
  
  private async _closePosition(position: SmartTrailingPosition, closePrice: number, reason: string) {
    // In a real scenario, place market sell order
    // await this.exchange.createMarketSellOrder(position.symbol, position.quantity);
    
    position.status = 'closed';
    this.activePositions = this.activePositions.filter(p => p.id !== position.id);
    this.emit('positionClosed', { position, reason, price: closePrice });
  }

  // INDICATOR CALCULATIONS
  private _calculateRSI(ohlcv: OHLCV[], period = 14): number {
    if (ohlcv.length < 2) return 50; // Default neutral RSI
    
    const changes = ohlcv.map((c, i) => {
      if (i > 0 && ohlcv[i-1] && c[4] !== undefined && ohlcv[i-1]?.[4] !== undefined) {
        return c[4] - (ohlcv[i-1] as number[])[4];
      }
      return 0;
    }).slice(1);
    
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) gains += changes[i];
        else losses -= changes[i];
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < changes.length; i++) {
        const change = changes[i];
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - change) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  private _calculateMomentum(ohlcv: OHLCV[], period = 10): 'strong_up' | 'up' | 'sideways' | 'down' | 'strong_down' {
      const recentCloses = ohlcv.slice(-period).map(c => c[4]);
      const first = recentCloses[0];
      const last = recentCloses[recentCloses.length - 1];
      
      if (first === undefined || last === undefined) return 'sideways';
      
      const change = (last - first) / first * 100;
      
      if (change > 3) return 'strong_up';
      if (change > 0.5) return 'up';
      if (change < -3) return 'strong_down';
      if (change < -0.5) return 'down';
      return 'sideways';
  }
}

export default SmartTrailingStopService;