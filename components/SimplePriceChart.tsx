'use client';

import { useTrading } from '../contexts/TradingContext';
import LoadingOverlay from './LoadingOverlay';
import VSCodeCard from './VSCodeCard';

export default function SimplePriceChart() {
  const { selectedCoin, candleData, coinsData, isLoading } = useTrading();
  
  const currentCoin = coinsData[selectedCoin];
  const data = candleData[selectedCoin] || [];
  
  // Get last 30 data points for better chart visualization
  const chartData = data.slice(-30);
  
  if (chartData.length === 0) {
    return (
      <LoadingOverlay isLoading={true} message={`Đang tải dữ liệu ${selectedCoin}...`}>
        <VSCodeCard>
          <div className="h-96 flex items-center justify-center">
            <div className="text-muted">
              Chart placeholder
            </div>
          </div>
        </VSCodeCard>
      </LoadingOverlay>
    );
  }

  const maxPrice = Math.max(...chartData.map(d => d.high));
  const minPrice = Math.min(...chartData.map(d => d.low));
  const priceRange = maxPrice - minPrice || 1; // Prevent division by zero

  return (
    <LoadingOverlay isLoading={isLoading} message="Đang cập nhật..." delay={500}>
      <VSCodeCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {selectedCoin}/USDT Simple Chart
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

        <div className="relative h-96 bg-panel rounded-lg overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Price line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
              points={chartData.map((candle, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const y = 100 - ((candle.close - minPrice) / priceRange) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Candlesticks */}
            {chartData.map((candle, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const openY = 100 - ((candle.open - minPrice) / priceRange) * 100;
              const closeY = 100 - ((candle.close - minPrice) / priceRange) * 100;
              const highY = 100 - ((candle.high - minPrice) / priceRange) * 100;
              const lowY = 100 - ((candle.low - minPrice) / priceRange) * 100;
              
              const isGreen = candle.close > candle.open;
              const color = isGreen ? '#10b981' : '#ef4444';
              
              return (
                <g key={index}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="0.2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Body */}
                  <rect
                    x={x - 0.8}
                    y={Math.min(openY, closeY)}
                    width="1.6"
                    height={Math.abs(openY - closeY) || 0.1}
                    fill={color}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Price labels */}
          <div className="absolute top-2 left-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
            ${maxPrice.toFixed(2)}
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
            ${minPrice.toFixed(2)}
          </div>
          
          {/* Current price indicator */}
          <div 
            className="absolute right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium"
            style={{
              top: `${100 - ((currentCoin.price - minPrice) / priceRange) * 100}%`,
              transform: 'translateY(-50%)'
            }}
          >
            ${currentCoin.price.toFixed(2)}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted flex justify-between">
          <span>* Simple chart view - Last {chartData.length} data points</span>
          <span>Reliable backup for advanced chart</span>
        </div>
      </VSCodeCard>
    </LoadingOverlay>
  );
}
