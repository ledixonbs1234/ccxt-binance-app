import { SMA, RSI, BollingerBands, MACD, Stochastic } from 'technicalindicators';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: number;
  value: number | { [key: string]: number };
}

export class TechnicalIndicatorsService {
  /**
   * Calculate Simple Moving Average
   */
  static calculateSMA(candles: CandleData[], period: number): IndicatorResult[] {
    const closes = candles.map(c => c.close);
    const smaValues = SMA.calculate({ period, values: closes });
    
    return smaValues.map((value, index) => ({
      timestamp: candles[index + period - 1]?.timestamp || 0,
      value
    })).filter(item => item.timestamp > 0);
  }

  /**
   * Calculate Relative Strength Index
   */
  static calculateRSI(candles: CandleData[], period: number = 14): IndicatorResult[] {
    const closes = candles.map(c => c.close);
    const rsiValues = RSI.calculate({ period, values: closes });
    
    return rsiValues.map((value, index) => ({
      timestamp: candles[index + period]?.timestamp || 0,
      value
    })).filter(item => item.timestamp > 0);
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(candles: CandleData[], period: number = 20, stdDev: number = 2): IndicatorResult[] {
    const closes = candles.map(c => c.close);
    const bbValues = BollingerBands.calculate({
      period,
      values: closes,
      stdDev
    });
    
    return bbValues.map((value, index) => ({
      timestamp: candles[index + period - 1]?.timestamp || 0,
      value: {
        upper: value.upper,
        middle: value.middle,
        lower: value.lower
      }
    })).filter(item => item.timestamp > 0);
  }

  /**
   * Calculate MACD
   */
  static calculateMACD(
    candles: CandleData[], 
    fastPeriod: number = 12, 
    slowPeriod: number = 26, 
    signalPeriod: number = 9
  ): IndicatorResult[] {
    const closes = candles.map(c => c.close);
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    return macdValues.map((value, index) => ({
      timestamp: candles[index + slowPeriod - 1]?.timestamp || 0,
      value: {
        MACD: value.MACD ?? 0,
        signal: value.signal ?? 0,
        histogram: value.histogram ?? 0
      }
    })).filter(item => item.timestamp > 0);
  }

  /**
   * Calculate Stochastic Oscillator
   */
  static calculateStochastic(
    candles: CandleData[],
    period: number = 14,
    dPeriod: number = 3
  ): IndicatorResult[] {
    const input = candles.map(c => ({
      high: c.high,
      low: c.low,
      close: c.close
    }));

    const stochValues = Stochastic.calculate({
      high: input.map(i => i.high),
      low: input.map(i => i.low),
      close: input.map(i => i.close),
      period: period,
      signalPeriod: dPeriod
    });
    
    return stochValues.map((value, index) => ({
      timestamp: candles[index + period - 1]?.timestamp || 0,
      value: {
        k: value.k,
        d: value.d
      }
    })).filter(item => item.timestamp > 0);
  }

  /**
   * Generate trading signals based on SMA Crossover
   */
  static generateSMACrossoverSignals(
    candles: CandleData[], 
    fastPeriod: number = 10, 
    slowPeriod: number = 30
  ): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    const fastSMA = this.calculateSMA(candles, fastPeriod);
    const slowSMA = this.calculateSMA(candles, slowPeriod);
    const signals: Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> = [];

    for (let i = 1; i < Math.min(fastSMA.length, slowSMA.length); i++) {
      const currentFast = fastSMA[i].value as number;
      const currentSlow = slowSMA[i].value as number;
      const prevFast = fastSMA[i - 1].value as number;
      const prevSlow = slowSMA[i - 1].value as number;

      const candle = candles.find(c => c.timestamp === fastSMA[i].timestamp);
      if (!candle) continue;

      // Golden Cross - Buy Signal
      if (currentFast > currentSlow && prevFast <= prevSlow) {
        signals.push({
          timestamp: fastSMA[i].timestamp,
          signal: 'buy',
          price: candle.close,
          reason: 'Golden Cross'
        });
      }
      // Death Cross - Sell Signal
      else if (currentFast < currentSlow && prevFast >= prevSlow) {
        signals.push({
          timestamp: fastSMA[i].timestamp,
          signal: 'sell',
          price: candle.close,
          reason: 'Death Cross'
        });
      }
    }

    return signals;
  }

  /**
   * Generate trading signals based on RSI
   */
  static generateRSISignals(
    candles: CandleData[], 
    period: number = 14, 
    oversold: number = 30, 
    overbought: number = 70
  ): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    const rsiValues = this.calculateRSI(candles, period);
    const signals: Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> = [];

    for (const rsi of rsiValues) {
      const candle = candles.find(c => c.timestamp === rsi.timestamp);
      if (!candle) continue;

      const rsiValue = rsi.value as number;

      if (rsiValue < oversold) {
        signals.push({
          timestamp: rsi.timestamp,
          signal: 'buy',
          price: candle.close,
          reason: `RSI Oversold (${rsiValue.toFixed(2)})`
        });
      } else if (rsiValue > overbought) {
        signals.push({
          timestamp: rsi.timestamp,
          signal: 'sell',
          price: candle.close,
          reason: `RSI Overbought (${rsiValue.toFixed(2)})`
        });
      }
    }

    return signals;
  }

  /**
   * Generate trading signals based on Bollinger Bands
   */
  static generateBollingerBandsSignals(
    candles: CandleData[], 
    period: number = 20, 
    stdDev: number = 2
  ): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    const bbValues = this.calculateBollingerBands(candles, period, stdDev);
    const signals: Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> = [];

    for (const bb of bbValues) {
      const candle = candles.find(c => c.timestamp === bb.timestamp);
      if (!candle) continue;

      const bands = bb.value as { upper: number; middle: number; lower: number };

      if (candle.close <= bands.lower) {
        signals.push({
          timestamp: bb.timestamp,
          signal: 'buy',
          price: candle.close,
          reason: 'Price touched lower Bollinger Band'
        });
      } else if (candle.close >= bands.upper) {
        signals.push({
          timestamp: bb.timestamp,
          signal: 'sell',
          price: candle.close,
          reason: 'Price touched upper Bollinger Band'
        });
      }
    }

    return signals;
  }

  /**
   * Generate trading signals based on MACD
   */
  static generateMACDSignals(
    candles: CandleData[], 
    fastPeriod: number = 12, 
    slowPeriod: number = 26, 
    signalPeriod: number = 9
  ): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    const macdValues = this.calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
    const signals: Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> = [];

    for (let i = 1; i < macdValues.length; i++) {
      const current = macdValues[i].value as { MACD: number; signal: number; histogram: number };
      const previous = macdValues[i - 1].value as { MACD: number; signal: number; histogram: number };
      
      const candle = candles.find(c => c.timestamp === macdValues[i].timestamp);
      if (!candle) continue;

      // MACD crosses above signal line - Buy
      if (current.MACD > current.signal && previous.MACD <= previous.signal) {
        signals.push({
          timestamp: macdValues[i].timestamp,
          signal: 'buy',
          price: candle.close,
          reason: 'MACD bullish crossover'
        });
      }
      // MACD crosses below signal line - Sell
      else if (current.MACD < current.signal && previous.MACD >= previous.signal) {
        signals.push({
          timestamp: macdValues[i].timestamp,
          signal: 'sell',
          price: candle.close,
          reason: 'MACD bearish crossover'
        });
      }
    }

    return signals;
  }

  /**
   * Generate trading signals based on Stochastic
   */
  static generateStochasticSignals(
    candles: CandleData[], 
    kPeriod: number = 14, 
    dPeriod: number = 3,
    oversold: number = 20,
    overbought: number = 80
  ): Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> {
    const stochValues = this.calculateStochastic(candles, kPeriod, dPeriod);
    const signals: Array<{ timestamp: number; signal: 'buy' | 'sell'; price: number; reason: string }> = [];

    for (let i = 1; i < stochValues.length; i++) {
      const current = stochValues[i].value as { k: number; d: number };
      const previous = stochValues[i - 1].value as { k: number; d: number };
      
      const candle = candles.find(c => c.timestamp === stochValues[i].timestamp);
      if (!candle) continue;

      // %K crosses above %D in oversold area - Buy
      if (current.k > current.d && previous.k <= previous.d && current.k < oversold) {
        signals.push({
          timestamp: stochValues[i].timestamp,
          signal: 'buy',
          price: candle.close,
          reason: `Stochastic bullish crossover in oversold area (K: ${current.k.toFixed(2)})`
        });
      }
      // %K crosses below %D in overbought area - Sell
      else if (current.k < current.d && previous.k >= previous.d && current.k > overbought) {
        signals.push({
          timestamp: stochValues[i].timestamp,
          signal: 'sell',
          price: candle.close,
          reason: `Stochastic bearish crossover in overbought area (K: ${current.k.toFixed(2)})`
        });
      }
    }

    return signals;
  }
}
