'use client';

import { useEffect, useRef, useState } from 'react';
import { useTrading } from '../contexts/TradingContext';
import VSCodeCard from './VSCodeCard';

export default function CandlestickChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { selectedCoin, candleData, coinsData } = useTrading();
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<any>(null);

  useEffect(() => {
    let chart: any = null;
    let mounted = true;
    
    const initChart = async () => {
      try {
        if (!chartContainerRef.current || !mounted) return;
        
        // Cleanup previous chart first
        if (chartInstance) {
          chartInstance.remove();
          setChartInstance(null);
          setCandlestickSeries(null);
        }
        
        // Clear container
        chartContainerRef.current.innerHTML = '';
        
        // Dynamic import to avoid SSR issues
        const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');
        
        if (!mounted || !chartContainerRef.current) return;
        
        // Verify createChart function exists
        if (typeof createChart !== 'function') {
          console.error('createChart function not available from lightweight-charts');
          if (mounted) {
            setChartError('Chart library not loaded correctly');
            setIsLoading(false);
          }
          return;
        }

        // Create chart with error handling
        try {
          chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
              background: { type: ColorType.Solid, color: 'transparent' },
              textColor: '#333',
            },
            grid: {
              vertLines: { color: '#e1e5e9' },
              horzLines: { color: '#e1e5e9' },
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: '#e1e5e9',
            },
            rightPriceScale: {
              borderColor: '#e1e5e9',
            },
            crosshair: {
              mode: 1 as any,
            },
          });
        } catch (chartError) {
          console.error('Error creating chart:', chartError);
          if (mounted) {
            setChartError('Failed to create chart instance');
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setChartInstance(chart);
          setChartError(null);
        }

        // Create candlestick series using the new API
        try {
          const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          });

          if (mounted) {
            setCandlestickSeries(series);
            setIsLoading(false);
          }
        } catch (seriesError) {
          console.error('Error creating candlestick series:', seriesError);
          if (mounted) {
            setChartError('Failed to create chart series. Please use Simple Chart mode.');
            setIsLoading(false);
          }
          return;
        }

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chart && mounted) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
        };
        
      } catch (error) {
        console.error('Error initializing chart:', error);
        if (mounted) {
          setChartError('Failed to load advanced chart');
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to prevent rapid re-initialization
    const timeoutId = setTimeout(initChart, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (chart) {
        try {
          chart.remove();
        } catch (e) {
          console.warn('Error removing chart:', e);
        }
      }
      setCandlestickSeries(null);
    };
  }, [selectedCoin]); // Remove chartInstance from dependency to prevent re-initialization loop

  // Update chart data
  useEffect(() => {
    if (!chartInstance || !candlestickSeries || !candleData[selectedCoin]) return;

    try {
      const data = candleData[selectedCoin].map(candle => ({
        time: Math.floor(candle.time / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      if (data.length > 0) {
        candlestickSeries.setData(data);
        // Fit content to show all data nicely
        chartInstance.timeScale().fitContent();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
      setChartError('Failed to update chart data');
    }
  }, [chartInstance, candlestickSeries, candleData, selectedCoin]);

  const currentCoin = coinsData[selectedCoin];

  if (chartError) {
    return (
      <VSCodeCard>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-error mb-2">
              {chartError}
            </div>
            <div className="text-sm text-muted">
              Please try switching to Simple Chart mode
            </div>
          </div>
        </div>
      </VSCodeCard>
    );
  }

  return (
    <VSCodeCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {selectedCoin}/USDT Advanced Chart
          </h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="text-2xl font-bold text-foreground">
              ${currentCoin.price.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${
              currentCoin.change24h >= 0 ? 'text-success' : 'text-error'
            }`}>
              {currentCoin.change24h >= 0 ? '+' : ''}
              {currentCoin.change24h.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted">
          <div>High: ${currentCoin.high.toLocaleString()}</div>
          <div>Low: ${currentCoin.low.toLocaleString()}</div>
          <div>Volume: {currentCoin.volume.toLocaleString()}</div>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-panel rounded-lg z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
              <span className="text-muted">Loading advanced chart...</span>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef}
          className="w-full h-96 rounded-lg"
        />
      </div>
      
      <div className="mt-4 text-xs text-muted">
        * Advanced chart with LightWeight Charts - Test environment
      </div>
    </VSCodeCard>
  );
}
