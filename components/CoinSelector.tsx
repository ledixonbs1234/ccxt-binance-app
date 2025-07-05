'use client';

import { useTrading, CoinSymbol } from '../contexts/TradingContext';

const COIN_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  PEPE: { name: 'Pepe', icon: '🐸', color: '#4caf50' }
};

export default function CoinSelector() {
  const { selectedCoin, setSelectedCoin, coinsData, isLoading } = useTrading();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Object.entries(COIN_INFO).map(([coin, info]) => {
        const coinData = coinsData[coin as CoinSymbol];
        const isSelected = selectedCoin === coin;
        
        return (
          <button
            key={coin}
            onClick={() => setSelectedCoin(coin as CoinSymbol)}
            className={`floating-card p-6 transition-all duration-300 text-left hover:shadow-xl ${
              isSelected 
                ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] transform scale-105' 
                : 'hover:transform hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${info.color}, ${info.color}CC)`,
                    boxShadow: `0 4px 14px 0 ${info.color}40`
                  }}
                >
                  {info.icon}
                </div>
                <div>
                  <span className="text-xl font-bold text-[var(--foreground)]">
                    {coin}
                  </span>
                  <p className="text-sm text-[var(--muted)]">
                    {info.name}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[var(--accent)] rounded-full animate-pulse"></div>
                  <span className="text-xs text-[var(--accent)] font-medium">ACTIVE</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Price</span>
                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-[var(--foreground)]">
                    {isLoading ? (
                      <div className="skeleton h-6 w-24 rounded"></div>
                    ) : (
                      `$${coinData.price.toLocaleString()}`
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">24h Change</span>
                <div className={`modern-badge ${
                  coinData.change24h >= 0 ? 'modern-badge-success' : 'modern-badge-error'
                }`}>
                  {coinData.change24h >= 0 ? '+' : ''}
                  {coinData.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
