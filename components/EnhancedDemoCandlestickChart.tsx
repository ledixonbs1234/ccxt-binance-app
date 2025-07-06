'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  MouseEventParams,
  CrosshairMode,
} from 'lightweight-charts';
import { useTrading, Timeframe } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';
import LoadingOverlay from './LoadingOverlay';
import { formatPrice, formatPercentageChange, formatVolume } from '../lib/priceFormatter';

interface EnhancedDemoCandlestickChartProps {
  height?: number;
  showVolume?: boolean;
  chartType?: 'candle' | 'line';
}

export default function EnhancedDemoCandlestickChart({
  height = 500,
  showVolume = true,
  chartType = 'candle'
}: EnhancedDemoCandlestickChartProps) {


  const { selectedCoin, candleData, coinsData, isLoading, timeframe, setTimeframe } = useTrading();
  const t = useTranslations();

  // Update debug info
  React.useEffect(() => {
    setDebugInfo(`Component rendered - Coin: ${selectedCoin}, Data: ${candleData[selectedCoin]?.length || 0} candles, Loading: ${isLoading}`);
  }, [selectedCoin, candleData, isLoading]);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [chartError, setChartError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // Cleanup function
  const cleanupChart = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
  }, []);

  // Initialize chart
  useEffect(() => {
    

    setDebugInfo(`useEffect called - Container: ${!!chartContainerRef.current}, createChart: ${typeof createChart}`);

    if (!chartContainerRef.current) {
      console.log('Enhanced Demo Chart: Container not available');
      setDebugInfo('Error: Chart container not available');
      return;
    }

   

    try {
      cleanupChart();
      setChartError(null);

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: { 
          background: { type: ColorType.Solid, color: 'transparent' }, 
          textColor: '#334155', 
          fontSize: 12 
        },
        grid: { 
          vertLines: { color: '#e2e8f0', style: LineStyle.Dotted }, 
          horzLines: { color: '#e2e8f0', style: LineStyle.Dotted } 
        },
        timeScale: { 
          borderColor: '#e2e8f0', 
          timeVisible: true, 
          secondsVisible: false, 
          rightOffset: 12 
        },
        rightPriceScale: {
          borderColor: '#e2e8f0',
          // Enhanced scaling options for better visibility
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: '#758694',
            style: LineStyle.Dashed,
          },
          horzLine: {
            width: 1,
            color: '#758694',
            style: LineStyle.Dashed,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      console.log('Enhanced Demo Chart: Chart created successfully');
      setDebugInfo('Chart created successfully');
      chartInstanceRef.current = chart;

      if (chartType === 'candle') {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
          // Enhanced price line visibility
          priceLineVisible: true,
          lastValueVisible: true,
          // Proper price formatting based on coin
          priceFormat: {
            type: 'price',
            precision: selectedCoin === 'PEPE' ? 8 : selectedCoin === 'BTC' ? 2 : 4,
            minMove: selectedCoin === 'PEPE' ? 0.00000001 : selectedCoin === 'BTC' ? 0.01 : 0.0001,
          },
        });

        console.log('Enhanced Demo Chart: Candlestick series created');
        setDebugInfo('Candlestick series created');
        priceSeriesRef.current = series;
      } else {
        const series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
          // Proper price formatting based on coin
          priceFormat: {
            type: 'price',
            precision: selectedCoin === 'PEPE' ? 8 : selectedCoin === 'BTC' ? 2 : 4,
            minMove: selectedCoin === 'PEPE' ? 0.00000001 : selectedCoin === 'BTC' ? 0.01 : 0.0001,
          },
        });
        priceSeriesRef.current = series;
      }

      if (showVolume) {
        const volSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume_scale',
        });
        chart.priceScale('volume_scale').applyOptions({
          scaleMargins: { top: 0.7, bottom: 0 }
        });
        volumeSeriesRef.current = volSeries;
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        cleanupChart();
      };
    } catch (error) {
      console.error("Enhanced demo chart initialization failed:", error);
      setChartError("Failed to load enhanced demo chart. Please try refreshing.");
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedCoin, chartType, showVolume, height, cleanupChart]);

  // Update chart data with enhanced scaling
  useEffect(() => {
    if (!chartInstanceRef.current || !priceSeriesRef.current || isLoading) {
      return;
    }

    try {
      const currentCandleData = candleData[selectedCoin] || [];

      if (currentCandleData.length === 0) {
        return;
      }

      // Convert data format
      const formattedData: CandlestickData[] = currentCandleData.map(c => ({
        time: (c.time / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      priceSeriesRef.current.setData(formattedData);
      console.log('Enhanced Demo Chart: Data set to price series', formattedData.length);
      setDebugInfo(`Data loaded: ${formattedData.length} candles`);

      if (showVolume && volumeSeriesRef.current) {
        const volumeData: HistogramData[] = currentCandleData.map(c => ({
          time: (c.time / 1000) as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        }));
        volumeSeriesRef.current.setData(volumeData);
        console.log('Enhanced Demo Chart: Volume data set', volumeData.length);
      }

      // Enhanced auto-scaling for better visibility
      if (formattedData.length > 0) {
        // Fit content to show all data
        chartInstanceRef.current.timeScale().fitContent();
        
        // For PEPE and other micro-cap coins, ensure proper scaling
        if (selectedCoin === 'PEPE') {
          // Set visible range to show meaningful price movements
          const prices = formattedData.map(d => [d.high, d.low, d.open, d.close]).flat();
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceRange = maxPrice - minPrice;
          
          // Add 10% padding to top and bottom for better visibility
          const padding = priceRange * 0.1;
          
          chartInstanceRef.current.priceScale('right').applyOptions({
            autoScale: false,
          });
          
          // Set visible price range
          setTimeout(() => {
            if (chartInstanceRef.current) {
              chartInstanceRef.current.priceScale('right').setVisibleRange({
                from: minPrice - padding,
                to: maxPrice + padding,
              });
            }
          }, 100);
        } else {
          // For BTC and ETH, use auto-scaling
          chartInstanceRef.current.priceScale('right').applyOptions({
            autoScale: true,
          });
        }
      }
    } catch (error) {
      console.error('Error updating enhanced demo chart data:', error);
      setChartError('Failed to update chart data');
      setDebugInfo(`Data update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [candleData, selectedCoin, isLoading, showVolume]);

  if (chartError) {
    return <div className="notification notification-error">{chartError}</div>;
  }


  return (
    <div className="relative">
      <LoadingOverlay isLoading={isLoading} children={undefined} />

      {/* Debug Info */}
      <div className="mb-2 p-2 bg-gray-800 text-white text-xs rounded">
        Debug: {debugInfo}
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted">{t.trading.timeframe}:</span>
          <div className="flex items-center gap-1">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card-bg text-muted hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-sm text-muted">
          {selectedCoin}/USDT • Dữ liệu thời gian thực
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full border border-border rounded-lg bg-card-bg"
        style={{
          height: `${height}px`,
          backgroundColor: '#1a1a1a', // Temporary debug background
          minHeight: `${height}px`,
          position: 'relative'
        }}
      />

      {/* Container Debug Info */}
      <div className="mt-2 p-2 bg-blue-800 text-white text-xs rounded">
        Container Debug: Width: {chartContainerRef.current?.clientWidth || 'N/A'},
        Height: {chartContainerRef.current?.clientHeight || 'N/A'}
      </div>

      {/* Chart Info - Enhanced Trading Platform Style */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-4">
          <span className="font-semibold">
            Giá Hiện Tại: <span className="text-accent font-mono">
              {formatPrice(coinsData[selectedCoin]?.price, selectedCoin)}
            </span>
          </span>
          <span className={`font-semibold ${formatPercentageChange(coinsData[selectedCoin]?.change24h).colorClass}`}>
            24h: {formatPercentageChange(coinsData[selectedCoin]?.change24h).value}
          </span>
        </div>
        <div className="font-medium">
          Khối Lượng: <span className="font-mono">{formatVolume(coinsData[selectedCoin]?.volume)}</span>
        </div>
      </div>
    </div>
  );
}
