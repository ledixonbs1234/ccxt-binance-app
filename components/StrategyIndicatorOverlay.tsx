'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IChartApi, ISeriesApi, LineSeries, Time, LineStyle } from 'lightweight-charts';
import { TrailingStopPosition, TrailingStopStrategy } from '../types/trailingStop';
import { formatSmartPrice } from '../lib/priceFormatter';

interface StrategyIndicatorOverlayProps {
  chart: IChartApi | null;
  positions: TrailingStopPosition[];
  symbol: string;
  currentPrice: number;
  candleData?: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

interface StrategyVisualization {
  positionId: string;
  strategy: TrailingStopStrategy;
  indicators: Map<string, ISeriesApi<'Line'>>;
}

export default function StrategyIndicatorOverlay({
  chart,
  positions,
  symbol,
  currentPrice,
  candleData = []
}: StrategyIndicatorOverlayProps) {
  const visualizationsRef = useRef<Map<string, StrategyVisualization>>(new Map());
  const [isVisible, setIsVisible] = useState(true);

  // Cleanup function for a single visualization
  const cleanupVisualization = (positionId: string) => {
    const viz = visualizationsRef.current.get(positionId);
    if (viz && chart) {
      viz.indicators.forEach((series) => {
        try {
          chart.removeSeries(series);
        } catch (error) {
          console.warn('Error removing series:', error);
        }
      });
      visualizationsRef.current.delete(positionId);
    }
  };

  // Cleanup all visualizations
  const cleanupAllVisualizations = () => {
    visualizationsRef.current.forEach((_, positionId) => {
      cleanupVisualization(positionId);
    });
    visualizationsRef.current.clear();
  };

  // Create strategy-specific indicators
  const createStrategyIndicators = (position: TrailingStopPosition): StrategyVisualization | null => {
    if (!chart || !candleData.length) return null;

    const indicators = new Map<string, ISeriesApi<'Line'>>();

    try {
      switch (position.strategy) {
        case 'fibonacci':
          createFibonacciIndicators(position, indicators);
          break;
        case 'bollinger_bands':
          createBollingerBandsIndicators(position, indicators);
          break;
        case 'atr':
          createATRIndicators(position, indicators);
          break;
        case 'volume_profile':
          createVolumeProfileIndicators(position, indicators);
          break;
        case 'ichimoku':
          createIchimokuIndicators(position, indicators);
          break;
        case 'pivot_points':
          createPivotPointsIndicators(position, indicators);
          break;
        case 'support_resistance':
          createSupportResistanceIndicators(position, indicators);
          break;
        case 'hybrid':
          createHybridIndicators(position, indicators);
          break;
        default:
          // For percentage and other basic strategies, show basic lines
          createBasicIndicators(position, indicators);
          break;
      }

      return {
        positionId: position.id,
        strategy: position.strategy,
        indicators
      };
    } catch (error) {
      console.error(`Error creating indicators for ${position.strategy}:`, error);
      return null;
    }
  };

  // Fibonacci Retracement Indicators
  const createFibonacciIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    const fibLevels = [0.236, 0.382, 0.618, 0.786];
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#b45309'];

    fibLevels.forEach((level, index) => {
      const series = chart.addSeries(LineSeries, {
        color: colors[index],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        title: `Fib ${(level * 100).toFixed(1)}%`,
      });
      indicators.set(`fib_${level}`, series);
    });

    // Fibonacci extension levels
    const extLevels = [1.272, 1.618];
    extLevels.forEach((level, index) => {
      const series = chart.addSeries(LineSeries, {
        color: index === 0 ? '#7c3aed' : '#5b21b6',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
        title: `Fib Ext ${(level * 100).toFixed(1)}%`,
      });
      indicators.set(`fib_ext_${level}`, series);
    });
  };

  // Bollinger Bands Indicators
  const createBollingerBandsIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // Upper Band
    const upperBand = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'BB Upper',
    });
    indicators.set('bb_upper', upperBand);

    // Middle Band (SMA)
    const middleBand = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'BB Middle',
    });
    indicators.set('bb_middle', middleBand);

    // Lower Band
    const lowerBand = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'BB Lower',
    });
    indicators.set('bb_lower', lowerBand);
  };

  // ATR Indicators
  const createATRIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // ATR-based stop loss levels
    const atrMultipliers = [1.5, 2.0, 2.5];
    const colors = ['#f97316', '#ea580c', '#c2410c'];

    atrMultipliers.forEach((multiplier, index) => {
      const series = chart.addSeries(LineSeries, {
        color: colors[index],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        title: `ATR ${multiplier}x`,
      });
      indicators.set(`atr_${multiplier}`, series);
    });
  };

  // Volume Profile Indicators
  const createVolumeProfileIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // VPOC (Volume Point of Control)
    const vpoc = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: true,
      lastValueVisible: true,
      title: 'VPOC',
    });
    indicators.set('vpoc', vpoc);

    // High Volume Nodes
    const hvn = chart.addSeries(LineSeries, {
      color: '#0891b2',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'HVN',
    });
    indicators.set('hvn', hvn);

    // Low Volume Nodes
    const lvn = chart.addSeries(LineSeries, {
      color: '#0e7490',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'LVN',
    });
    indicators.set('lvn', lvn);
  };

  // Ichimoku Indicators
  const createIchimokuIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // Tenkan-sen (Conversion Line)
    const tenkan = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Tenkan-sen',
    });
    indicators.set('tenkan', tenkan);

    // Kijun-sen (Base Line)
    const kijun = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Kijun-sen',
    });
    indicators.set('kijun', kijun);

    // Senkou Span A (Leading Span A)
    const senkouA = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Senkou A',
    });
    indicators.set('senkou_a', senkouA);

    // Senkou Span B (Leading Span B)
    const senkouB = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Senkou B',
    });
    indicators.set('senkou_b', senkouB);
  };

  // Pivot Points Indicators
  const createPivotPointsIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    const pivotLevels = ['R2', 'R1', 'PP', 'S1', 'S2'];
    const colors = ['#dc2626', '#f87171', '#6366f1', '#34d399', '#059669'];

    pivotLevels.forEach((level, index) => {
      const series = chart.addSeries(LineSeries, {
        color: colors[index],
        lineWidth: level === 'PP' ? 2 : 1,
        lineStyle: level === 'PP' ? LineStyle.Solid : LineStyle.Dashed,
        priceLineVisible: level === 'PP',
        lastValueVisible: level === 'PP',
        title: level,
      });
      indicators.set(`pivot_${level.toLowerCase()}`, series);
    });
  };

  // Support/Resistance Indicators
  const createSupportResistanceIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // Major Support
    const support = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: true,
      lastValueVisible: true,
      title: 'Support',
    });
    indicators.set('support', support);

    // Major Resistance
    const resistance = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: true,
      lastValueVisible: true,
      title: 'Resistance',
    });
    indicators.set('resistance', resistance);
  };

  // Hybrid Strategy Indicators (combination)
  const createHybridIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // Combine key indicators from multiple strategies
    createATRIndicators(position, indicators);
    createFibonacciIndicators(position, indicators);
    createVolumeProfileIndicators(position, indicators);
  };

  // Basic Indicators for simple strategies
  const createBasicIndicators = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>) => {
    if (!chart) return;

    // Simple moving average
    const sma = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'SMA',
    });
    indicators.set('sma', sma);
  };

  // Update indicator data based on strategy and market data
  const updateIndicatorData = (position: TrailingStopPosition, viz: StrategyVisualization) => {
    if (!candleData.length) return;

    try {
      const timeRange = getTimeRange();

      switch (position.strategy) {
        case 'fibonacci':
          updateFibonacciData(position, viz.indicators, timeRange);
          break;
        case 'bollinger_bands':
          updateBollingerBandsData(position, viz.indicators, timeRange);
          break;
        case 'atr':
          updateATRData(position, viz.indicators, timeRange);
          break;
        case 'volume_profile':
          updateVolumeProfileData(position, viz.indicators, timeRange);
          break;
        case 'ichimoku':
          updateIchimokuData(position, viz.indicators, timeRange);
          break;
        case 'pivot_points':
          updatePivotPointsData(position, viz.indicators, timeRange);
          break;
        case 'support_resistance':
          updateSupportResistanceData(position, viz.indicators, timeRange);
          break;
        case 'hybrid':
          updateHybridData(position, viz.indicators, timeRange);
          break;
        default:
          updateBasicData(position, viz.indicators, timeRange);
          break;
      }
    } catch (error) {
      console.error(`Error updating indicator data for ${position.strategy}:`, error);
    }
  };

  // Helper function to get time range
  const getTimeRange = () => {
    if (!candleData.length) return { startTime: 0 as Time, endTime: 0 as Time };

    const firstCandle = candleData[0];
    const lastCandle = candleData[candleData.length - 1];
    return {
      startTime: (firstCandle.time / 1000) as Time,
      endTime: (lastCandle.time / 1000) as Time
    };
  };

  // Update Fibonacci levels
  const updateFibonacciData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const { startTime, endTime } = timeRange;
    const high = Math.max(...candleData.map(c => c.high));
    const low = Math.min(...candleData.map(c => c.low));
    const range = high - low;

    // Fibonacci retracement levels
    const fibLevels = [0.236, 0.382, 0.618, 0.786];
    fibLevels.forEach(level => {
      const price = high - (range * level);
      const series = indicators.get(`fib_${level}`);
      if (series) {
        series.setData([
          { time: startTime, value: price },
          { time: endTime, value: price }
        ]);
      }
    });

    // Fibonacci extension levels
    const extLevels = [1.272, 1.618];
    extLevels.forEach(level => {
      const price = high + (range * (level - 1));
      const series = indicators.get(`fib_ext_${level}`);
      if (series) {
        series.setData([
          { time: startTime, value: price },
          { time: endTime, value: price }
        ]);
      }
    });
  };

  // Update Bollinger Bands
  const updateBollingerBandsData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const period = position.bollingerPeriod || 20;
    const stdDev = position.bollingerStdDev || 2.0;

    if (candleData.length < period) return;

    const bollingerData = candleData.map((candle, index) => {
      if (index < period - 1) return null;

      const slice = candleData.slice(index - period + 1, index + 1);
      const closes = slice.map(c => c.close);
      const sma = closes.reduce((sum, close) => sum + close, 0) / period;

      const variance = closes.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      return {
        time: (candle.time / 1000) as Time,
        upper: sma + (standardDeviation * stdDev),
        middle: sma,
        lower: sma - (standardDeviation * stdDev)
      };
    }).filter(Boolean);

    // Update series data
    indicators.get('bb_upper')?.setData(bollingerData.map(d => ({ time: d!.time, value: d!.upper })));
    indicators.get('bb_middle')?.setData(bollingerData.map(d => ({ time: d!.time, value: d!.middle })));
    indicators.get('bb_lower')?.setData(bollingerData.map(d => ({ time: d!.time, value: d!.lower })));
  };

  // Update ATR levels
  const updateATRData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const { startTime, endTime } = timeRange;
    const atrPeriod = position.atrPeriod || 14;

    if (candleData.length < atrPeriod) return;

    // Calculate ATR
    let atrSum = 0;
    for (let i = 1; i < Math.min(atrPeriod + 1, candleData.length); i++) {
      const current = candleData[i];
      const previous = candleData[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      atrSum += tr;
    }
    const atr = atrSum / atrPeriod;

    // Update ATR-based levels
    const atrMultipliers = [1.5, 2.0, 2.5];
    atrMultipliers.forEach(multiplier => {
      const stopLevel = currentPrice - (atr * multiplier);
      const series = indicators.get(`atr_${multiplier}`);
      if (series) {
        series.setData([
          { time: startTime, value: stopLevel },
          { time: endTime, value: stopLevel }
        ]);
      }
    });
  };

  // Update Volume Profile (simplified)
  const updateVolumeProfileData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const { startTime, endTime } = timeRange;

    // Calculate volume-weighted average price (VWAP) as VPOC approximation
    let totalVolume = 0;
    let totalVolumePrice = 0;

    candleData.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    });

    const vpoc = totalVolumePrice / totalVolume;

    indicators.get('vpoc')?.setData([
      { time: startTime, value: vpoc },
      { time: endTime, value: vpoc }
    ]);
  };

  // Update other strategy data (simplified implementations)
  const updateIchimokuData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    // Simplified Ichimoku calculation
    const { startTime, endTime } = timeRange;
    const tenkanPeriod = position.ichimokuTenkan || 9;
    const kijunPeriod = position.ichimokuKijun || 26;

    if (candleData.length < kijunPeriod) return;

    const recent = candleData.slice(-kijunPeriod);
    const tenkanHigh = Math.max(...recent.slice(-tenkanPeriod).map(c => c.high));
    const tenkanLow = Math.min(...recent.slice(-tenkanPeriod).map(c => c.low));
    const tenkan = (tenkanHigh + tenkanLow) / 2;

    const kijunHigh = Math.max(...recent.map(c => c.high));
    const kijunLow = Math.min(...recent.map(c => c.low));
    const kijun = (kijunHigh + kijunLow) / 2;

    indicators.get('tenkan')?.setData([{ time: startTime, value: tenkan }, { time: endTime, value: tenkan }]);
    indicators.get('kijun')?.setData([{ time: startTime, value: kijun }, { time: endTime, value: kijun }]);
  };

  const updatePivotPointsData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const { startTime, endTime } = timeRange;
    const lastCandle = candleData[candleData.length - 1];

    // Standard pivot points calculation
    const pp = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;
    const r1 = (2 * pp) - lastCandle.low;
    const r2 = pp + (lastCandle.high - lastCandle.low);
    const s1 = (2 * pp) - lastCandle.high;
    const s2 = pp - (lastCandle.high - lastCandle.low);

    const pivotData = { pp, r1, r2, s1, s2 };
    Object.entries(pivotData).forEach(([key, value]) => {
      indicators.get(`pivot_${key}`)?.setData([
        { time: startTime, value },
        { time: endTime, value }
      ]);
    });
  };

  const updateSupportResistanceData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    const { startTime, endTime } = timeRange;

    // Use position's support/resistance levels if available
    const supportLevel = position.supportResistanceLevel || Math.min(...candleData.map(c => c.low));
    const resistanceLevel = Math.max(...candleData.map(c => c.high));

    indicators.get('support')?.setData([{ time: startTime, value: supportLevel }, { time: endTime, value: supportLevel }]);
    indicators.get('resistance')?.setData([{ time: startTime, value: resistanceLevel }, { time: endTime, value: resistanceLevel }]);
  };

  const updateHybridData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    // Update all relevant indicators for hybrid strategy
    updateATRData(position, indicators, timeRange);
    updateFibonacciData(position, indicators, timeRange);
    updateVolumeProfileData(position, indicators, timeRange);
  };

  const updateBasicData = (position: TrailingStopPosition, indicators: Map<string, ISeriesApi<'Line'>>, timeRange: any) => {
    // Simple moving average
    const period = 20;
    if (candleData.length < period) return;

    const smaData = candleData.map((candle, index) => {
      if (index < period - 1) return null;

      const slice = candleData.slice(index - period + 1, index + 1);
      const sma = slice.reduce((sum, c) => sum + c.close, 0) / period;

      return {
        time: (candle.time / 1000) as Time,
        value: sma
      };
    }).filter(Boolean);

    indicators.get('sma')?.setData(smaData as any);
  };

  // Main effect to manage strategy indicators
  useEffect(() => {
    if (!chart || !isVisible) {
      cleanupAllVisualizations();
      return;
    }

    // Filter positions for current symbol
    const relevantPositions = positions.filter(position =>
      position.symbol.replace('/', '') === symbol.replace('/', '') &&
      position.status === 'active'
    );

    // Remove visualizations for positions that no longer exist
    visualizationsRef.current.forEach((viz, positionId) => {
      if (!relevantPositions.find(pos => pos.id === positionId)) {
        cleanupVisualization(positionId);
      }
    });

    // Create or update visualizations for current positions
    relevantPositions.forEach(position => {
      let viz = visualizationsRef.current.get(position.id);

      if (!viz) {
        // Create new visualization
        const newViz = createStrategyIndicators(position);
        if (newViz) {
          viz = newViz;
          visualizationsRef.current.set(position.id, viz);
        }
      }

      if (viz) {
        // Update visualization data
        updateIndicatorData(position, viz);
      }
    });

  }, [chart, positions, symbol, currentPrice, candleData, isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllVisualizations();
    };
  }, []);

  return null; // This component doesn't render anything visible
}
