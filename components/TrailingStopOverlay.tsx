'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IChartApi, ISeriesApi, LineSeries, Time } from 'lightweight-charts';
import { TrailingStopState } from '../lib/trailingStopState';
import { TrailingStopPosition } from '../types/trailingStop';
import { formatSmartPrice } from '../lib/priceFormatter';
import StrategyIndicatorOverlay from './StrategyIndicatorOverlay';

interface TrailingStopOverlayProps {
  chart: IChartApi | null;
  trailingStops: TrailingStopState[];
  positions?: TrailingStopPosition[]; // Add positions for strategy indicators
  symbol: string;
  currentPrice: number;
  showStrategyIndicators?: boolean; // Toggle for strategy indicators
  candleData?: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

interface TrailingStopVisualization {
  stateKey: string;
  entryLine: ISeriesApi<'Line'> | null;
  stopLine: ISeriesApi<'Line'> | null;
  trailingPath: ISeriesApi<'Line'> | null;
  profitZone: ISeriesApi<'Line'> | null;
}

export default function TrailingStopOverlay({
  chart,
  trailingStops,
  positions = [],
  symbol,
  currentPrice,
  showStrategyIndicators = true,
  candleData = []
}: TrailingStopOverlayProps) {
  const visualizationsRef = useRef<Map<string, TrailingStopVisualization>>(new Map());
  const [isVisible, setIsVisible] = useState(true);

  // Cleanup function
  const cleanupVisualization = (stateKey: string) => {
    const viz = visualizationsRef.current.get(stateKey);
    if (viz && chart) {
      try {
        if (viz.entryLine) chart.removeSeries(viz.entryLine);
        if (viz.stopLine) chart.removeSeries(viz.stopLine);
        if (viz.trailingPath) chart.removeSeries(viz.trailingPath);
        if (viz.profitZone) chart.removeSeries(viz.profitZone);
      } catch (error) {
        console.warn(`Error removing series for ${stateKey}:`, error);
      }
      visualizationsRef.current.delete(stateKey);
    }
  };

  // Cleanup all visualizations
  const cleanupAllVisualizations = () => {
    visualizationsRef.current.forEach((_, stateKey) => {
      cleanupVisualization(stateKey);
    });
    visualizationsRef.current.clear();
  };

  // Create visualization for a trailing stop
  const createVisualization = (stop: TrailingStopState): TrailingStopVisualization | null => {
    if (!chart) return null;

    try {
      // Entry price line (blue)
      const entryLine = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 1, // Dashed
        priceLineVisible: false,
        lastValueVisible: false,
        title: `Entry: ${formatSmartPrice(stop.entryPrice)}`,
      });

      // Current stop loss line (red)
      const currentStopPrice = stop.highestPrice * (1 - stop.trailingPercent / 100);
      const stopLine = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 0, // Solid
        priceLineVisible: true,
        lastValueVisible: true,
        title: `Stop: ${formatSmartPrice(currentStopPrice, { includeSymbol: true })}`,
      });

      // Trailing path (orange - shows how stop has moved)
      const trailingPath = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: 2, // Dotted
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Trailing Path',
      });

      // Profit zone line (green - potential take profit)
      const profitZone = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 1, // Dashed
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'Profit Zone',
      });

      return {
        stateKey: stop.stateKey,
        entryLine,
        stopLine,
        trailingPath,
        profitZone,
      };
    } catch (error) {
      console.error(`Error creating visualization for ${stop.stateKey}:`, error);
      return null;
    }
  };

  // Update visualization data
  const updateVisualizationData = (stop: TrailingStopState, viz: TrailingStopVisualization) => {
    if (!chart || candleData.length === 0) return;

    try {
      // Get time range from candle data
      const firstCandle = candleData[0];
      const lastCandle = candleData[candleData.length - 1];
      const startTime = (firstCandle.time / 1000) as Time;
      const endTime = (lastCandle.time / 1000) as Time;

      const currentStopPrice = stop.highestPrice * (1 - stop.trailingPercent / 100);

      // Entry line - horizontal line at entry price across visible time range
      viz.entryLine?.setData([
        { time: startTime, value: stop.entryPrice },
        { time: endTime, value: stop.entryPrice },
      ]);

      // Stop loss line - horizontal line at current stop price
      viz.stopLine?.setData([
        { time: startTime, value: currentStopPrice },
        { time: endTime, value: currentStopPrice },
      ]);

      // Profit zone - line above entry price (potential take profit)
      const profitTarget = stop.entryPrice * (1 + (stop.trailingPercent * 2) / 100);
      viz.profitZone?.setData([
        { time: startTime, value: profitTarget },
        { time: endTime, value: profitTarget },
      ]);

      // Trailing path - shows the evolution of stop loss over time
      // For now, show a simple path from initial stop to current stop
      const initialStopPrice = stop.entryPrice * (1 - stop.trailingPercent / 100);
      const midTime = ((startTime as number) + (endTime as number)) / 2 as Time;

      const trailingData = [
        { time: startTime, value: initialStopPrice },
        { time: midTime, value: (initialStopPrice + currentStopPrice) / 2 },
        { time: endTime, value: currentStopPrice },
      ];
      viz.trailingPath?.setData(trailingData);

    } catch (error) {
      console.error(`Error updating visualization data for ${stop.stateKey}:`, error);
    }
  };

  // Main effect to manage visualizations
  useEffect(() => {
    if (!chart || !isVisible) {
      cleanupAllVisualizations();
      return;
    }

    // Filter trailing stops for current symbol
    const relevantStops = trailingStops.filter(stop => 
      stop.symbol.replace('/', '') === symbol.replace('/', '') && 
      stop.isActive && 
      stop.status !== 'triggered'
    );

    // Remove visualizations for stops that no longer exist
    visualizationsRef.current.forEach((viz, stateKey) => {
      if (!relevantStops.find(stop => stop.stateKey === stateKey)) {
        cleanupVisualization(stateKey);
      }
    });

    // Create or update visualizations for current stops
    relevantStops.forEach(stop => {
      let viz = visualizationsRef.current.get(stop.stateKey);
      
      if (!viz) {
        // Create new visualization
        const newViz = createVisualization(stop);
        if (newViz) {
          viz = newViz;
          visualizationsRef.current.set(stop.stateKey, viz);
        }
      }

      if (viz) {
        // Update visualization data
        updateVisualizationData(stop, viz);
      }
    });

    // Cleanup function
    return () => {
      // Don't cleanup on every render, only when component unmounts
    };
  }, [chart, trailingStops, symbol, currentPrice, isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllVisualizations();
    };
  }, []);

  // Toggle visibility control
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      // Will be recreated by the main effect
    } else {
      cleanupAllVisualizations();
    }
  };

  // Render control button and strategy indicators
  return (
    <>
      {/* Strategy Indicators Overlay */}
      {showStrategyIndicators && positions.length > 0 && (
        <StrategyIndicatorOverlay
          chart={chart}
          positions={positions}
          symbol={symbol}
          currentPrice={currentPrice}
          candleData={candleData}
        />
      )}

      {/* Control button (positioned absolutely over chart) */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={toggleVisibility}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
            isVisible
              ? 'bg-accent text-white'
              : 'bg-secondary-bg text-foreground border border-border hover:border-accent hover:text-accent'
          }`}
          title={isVisible ? 'Ẩn Trailing Stops' : 'Hiện Trailing Stops'}
        >
          {isVisible ? '👁️ Ẩn TS' : '👁️‍🗨️ Hiện TS'}
        </button>
      </div>
    </>
  );
}
