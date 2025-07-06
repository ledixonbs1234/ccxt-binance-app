// File: components/BitcoinTicker.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencyDollarIcon, ExclamationTriangleIcon, ArrowPathIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { usePrice } from '@/contexts/PriceContext';
import VSCodeCard from './VSCodeCard';

type BitcoinTickerProps = {
    onPriceChange: (price: number) => void;
};

const formatPrice = (price: number | null): string => {
    if (price === null) return '---.--';

    // For micro-cap cryptocurrencies like PEPE, use 8 decimal places
    if (price < 0.01) {
        return `$${price.toFixed(8)}`;
    }

    return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};
export default function BitcoinTicker() {
    // Lấy dữ liệu từ context
    const { price, isConnected, error, symbol } = usePrice();
  
    // Xác định trạng thái hiển thị
    const isLoading = price === null && !error && isConnected; // Loading khi chưa có giá nhưng đã kết nối
    const displaySymbol = symbol.toUpperCase().replace(/(\w+)(USDT|BUSD|USDC|TUSD|DAI)$/, '$1/$2'); // Định dạng lại symbol để hiển thị
    return (
      <VSCodeCard>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-warning" />
            Giá {displaySymbol}
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
               {formatPrice(price)}
             </p>
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