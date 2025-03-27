// File: app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import BalanceDisplay from '../components/BalanceDisplay';
import OrderForm from '../components/OrderForm';
import BitcoinTicker from '../components/BitcoinTicker';
import OrderHistory from '../components/OrderHistory';
import TrailingStopMonitor from '../components/TrailingStopMonitor';

export default function Home() {
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number | null>(null);
  const [balanceUpdateKey, setBalanceUpdateKey] = useState<number>(Date.now());
  const [orderHistoryKey, setOrderHistoryKey] = useState<number>(Date.now());
  const [monitorKey, setMonitorKey] = useState<number>(Date.now());

  const handlePriceChange = useCallback((price: number) => {
    setCurrentBtcPrice(price);
  }, []);

  // Callback để refresh Balance và OrderHistory
  // Được gọi khi lệnh Trailing Stop bán xong HOẶC lệnh Market/Limit đặt xong
  const handleDataRefresh = useCallback(() => {
    console.log(">>> Triggering data refresh (Balance & History) <<<");
    setBalanceUpdateKey(Date.now());
    setOrderHistoryKey(Date.now());
  }, []);

  // Callback để refresh TrailingStopMonitor (khi bắt đầu một TS mới)
  const handleSimulationStarted = useCallback(() => {
    console.log(">>> Triggering monitor refresh (Simulation Started) <<<");
    setMonitorKey(Date.now());
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Binance Sandbox Trading
      </h1>

      <div className="mb-6">
        <BitcoinTicker onPriceChange={handlePriceChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2">
             <BalanceDisplay key={balanceUpdateKey} />
        </div>
        <div className="lg:col-span-3">
             {/* Truyền cả hai callback xuống OrderForm */}
             <OrderForm
                 onSimulationStartSuccess={handleSimulationStarted}
                 onOrderSuccess={handleDataRefresh} // Callback khi Market/Limit thành công
             />
        </div>
      </div>

       <div className="mb-6">
          <TrailingStopMonitor
              key={monitorKey}
              onSimulationTriggered={handleDataRefresh} // Vẫn dùng handleDataRefresh khi TS trigger bán xong
          />
       </div>

       <div>
          <OrderHistory
              key={orderHistoryKey}
              currentPrice={currentBtcPrice}
              onBalanceUpdate={handleDataRefresh} // Dùng handleDataRefresh cho nút refresh thủ công
          />
       </div>
    </div>
  );
}