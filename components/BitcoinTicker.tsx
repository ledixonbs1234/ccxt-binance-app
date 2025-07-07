// File: components/BitcoinTicker.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencyDollarIcon, ExclamationTriangleIcon, ArrowPathIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { usePrice } from '@/contexts/PriceContext';
import VSCodeCard from './VSCodeCard';
import { formatMicroCapForContext, isMicroCapToken, analyzeMicroCapToken } from '@/lib/microCapUtils';

type BitcoinTickerProps = {
    onPriceChange: (price: number) => void;
};

/**
 * Format price for multi-token support with micro-cap handling
 */
const formatPrice = (price: number | null, symbol: string): string => {
    if (price === null) return '---.--';

    // Use micro-cap utilities for better formatting
    if (isMicroCapToken(price)) {
        const formatted = formatMicroCapForContext(price, 'table');
        return `$${formatted}`;
    }

    // Standard formatting for regular tokens
    return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: price < 1 ? 6 : 2,
    });
};

/**
 * Get token display name and icon based on symbol
 */
const getTokenInfo = (symbol: string) => {
    const cleanSymbol = symbol.toUpperCase().replace(/(\w+)(USDT|BUSD|USDC|TUSD|DAI)$/, '$1/$2');
    const baseSymbol = symbol.split('/')[0] || symbol.replace(/USDT|BUSD|USDC|TUSD|DAI$/, '');

    const tokenMap: Record<string, { name: string; icon: string }> = {
        'BTC': { name: 'Bitcoin', icon: '₿' },
        'ETH': { name: 'Ethereum', icon: 'Ξ' },
        'PEPE': { name: 'Pepe', icon: '🐸' },
        'SHIB': { name: 'Shiba Inu', icon: '🐕' },
        'DOGE': { name: 'Dogecoin', icon: 'Ð' },
        'ADA': { name: 'Cardano', icon: '₳' },
        'DOT': { name: 'Polkadot', icon: '●' },
        'LINK': { name: 'Chainlink', icon: '🔗' },
    };

    const info = tokenMap[baseSymbol] || { name: baseSymbol, icon: '💰' };

    return {
        displaySymbol: cleanSymbol,
        name: info.name,
        icon: info.icon,
        baseSymbol
    };
};
export default function BitcoinTicker() {
    // Lấy dữ liệu từ context
    const { price, isConnected, error, symbol } = usePrice();

    // Xác định trạng thái hiển thị
    const isLoading = price === null && !error && isConnected; // Loading khi chưa có giá nhưng đã kết nối

    // Get token information
    const tokenInfo = getTokenInfo(symbol);

    // Analyze token if it's micro-cap
    const tokenAnalysis = price ? analyzeMicroCapToken(price, 0) : null;
    return (
      <VSCodeCard>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-lg">{tokenInfo.icon}</span>
            <span>Giá {tokenInfo.displaySymbol}</span>
            {tokenAnalysis?.isMicroCap && (
              <span className="badge badge-warning text-xs">Micro-cap</span>
            )}
          </h2>
          {/* Hiển thị trạng thái kết nối WebSocket */}
          <div className={`flex items-center text-xs px-2 py-0.5 rounded-full ${
              isConnected ? 'badge badge-success' : 'badge badge-error animate-pulse'
          }`}>
              {isConnected ? (
                  <WifiIcon className="w-3 h-3 mr-1" />
              ) : (
                  <SignalSlashIcon className="w-3 h-3 mr-1" />
              )}
              {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>
        </div>

        {/* Hiển thị loading ban đầu */}
        {isLoading && (
           <div className="animate-pulse">
              <div className="h-8 w-40 bg-panel rounded-md mt-1 mb-2"></div>
           </div>
        )}

         {/* Hiển thị giá */}
         {!isLoading && (
           <div className="mt-1">
             <p className={`text-2xl md:text-3xl font-bold ${error || !isConnected ? 'text-muted' : 'text-foreground'}`}>
               {formatPrice(price, symbol)}
             </p>

             {/* Hiển thị thông tin bổ sung cho micro-cap tokens */}
             {tokenAnalysis?.isMicroCap && price && (
               <div className="mt-2 text-sm text-muted">
                 <div className="flex flex-wrap gap-2">
                   <span className="badge badge-info">
                     Precision: {tokenAnalysis.decimals} decimals
                   </span>
                   <span className="badge badge-info">
                     Format: {tokenAnalysis.formatType}
                   </span>
                 </div>
               </div>
             )}
             {/* Hiển thị lỗi nếu có */}
             {error && (
                <div className="panel-error mt-2">
                   <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                   <span>{error} (Giá hiển thị có thể đã cũ)</span>
               </div>
             )}
             {/* Thông báo nếu chưa có giá nhưng không lỗi và không loading */}
              {price === null && !error && !isLoading && !isConnected && (
                  <p className="text-sm text-muted mt-2">Đang chờ kết nối để lấy giá...</p>
              )}
           </div>
         )}
      </VSCodeCard>
    );
  }