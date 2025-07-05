'use client';

import { useTrading } from '../contexts/TradingContext';

export default function MarketOverview() {
  const { coinsData, isLoading, error } = useTrading();

  if (error) {
    return (
      <div className="notification notification-error">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-medium">Error loading market data</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(coinsData).map(([symbol, data]) => (
          <div key={symbol} className="floating-card p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{symbol}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] text-lg">
                    {symbol}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    USDT
                  </p>
                </div>
              </div>
              <div className={`modern-badge ${
                data.change24h >= 0 
                  ? 'modern-badge-success'
                  : 'modern-badge-error'
              }`}>
                {data.change24h >= 0 ? '+' : ''}
                {data.change24h.toFixed(2)}%
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Price</span>
                <span className="text-lg font-mono font-semibold text-[var(--foreground)]">
                  {isLoading ? (
                    <div className="skeleton h-6 w-20 rounded"></div>
                  ) : (
                    `$${data.price.toLocaleString()}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">24h High</span>
                <span className="text-sm font-mono font-medium text-[var(--success)]">
                  ${data.high.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">24h Low</span>
                <span className="text-sm font-mono font-medium text-[var(--error)]">
                  ${data.low.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Volume</span>
                <span className="text-sm font-mono font-medium text-[var(--foreground)]">
                  {(data.volume / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)] mt-6 p-4 bg-[var(--secondary-bg)] rounded-lg">
        <div className="status-indicator status-online">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live Data
        </div>
        <span>•</span>
        <span>Updates every 5 seconds</span>
        <span>•</span>
        <span>Binance Testnet</span>
      </div>
    </div>
  );
}
