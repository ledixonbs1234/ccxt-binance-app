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
  // Thêm key state cho TrailingStopMonitor
  const [monitorKey, setMonitorKey] = useState<number>(Date.now());

  const handlePriceChange = useCallback((price: number) => {
    setCurrentBtcPrice(price);
  }, []);

  // Callback để refresh Balance và OrderHistory (khi lệnh bán của TS hoàn thành)
  const handleDataRefresh = useCallback(() => {
    console.log(">>> Triggering data refresh (Balance & History) <<<");
    setBalanceUpdateKey(Date.now());
    setOrderHistoryKey(Date.now());
  }, []);

  // Callback để refresh TrailingStopMonitor (khi bắt đầu một TS mới)
  const handleSimulationStarted = useCallback(() => {
    console.log(">>> Triggering monitor refresh (Simulation Started) <<<");
    setMonitorKey(Date.now()); // Cập nhật key để trigger monitor remount/refetch
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
             {/* Truyền callback mới xuống OrderForm */}
             <OrderForm onSimulationStartSuccess={handleSimulationStarted} />
        </div>
      </div>

       <div className="mb-6">
          {/* Sử dụng key mới và truyền callback refresh balance/history */}
          <TrailingStopMonitor
              key={monitorKey}
              onSimulationTriggered={handleDataRefresh}
          />
       </div>

       <div>
          <OrderHistory
              key={orderHistoryKey}
              currentPrice={currentBtcPrice}
              onBalanceUpdate={handleDataRefresh}
          />
       </div>
    </div>
  );
}