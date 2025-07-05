// File: app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import BalanceDisplay from '../components/BalanceDisplay';
import OrderForm from '../components/OrderForm';
import OrderHistory from '../components/OrderHistory';
import TrailingStopMonitor from '../components/TrailingStopMonitor';
import CoinSelector from '../components/CoinSelector';
import CandlestickChart from '../components/CandlestickChart';
import SimplePriceChart from '../components/SimplePriceChart';
import MarketOverview from '../components/MarketOverview';
import VSCodeLayout from '../components/VSCodeLayout';
import VSCodeCard from '../components/VSCodeCard';
// Import Provider và Hook
import { TradingProvider, useTrading } from '../contexts/TradingContext';
import { generateUniqueId } from '../lib/utils';

// Component con để truy cập context sau khi Provider được mount
function TradingDashboard() {
  const { selectedCoin, coinsData } = useTrading();
  const [balanceUpdateKey, setBalanceUpdateKey] = useState<number>(generateUniqueId());
  const [orderHistoryKey, setOrderHistoryKey] = useState<number>(generateUniqueId());
  const [monitorKey, setMonitorKey] = useState<number>(generateUniqueId());
  const [useSimpleChart, setUseSimpleChart] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');

  const handleDataRefresh = useCallback(() => {
    setBalanceUpdateKey(generateUniqueId());
    setOrderHistoryKey(generateUniqueId());
    setMonitorKey(generateUniqueId());
  }, []);

  const handleSimulationStarted = useCallback(() => {
    setMonitorKey(generateUniqueId());
  }, []);

  const currentPrice = coinsData[selectedCoin]?.price || 0;

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Market Overview */}
            <VSCodeCard 
              title="Market Overview" 
              subtitle="Real-time market data"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              <MarketOverview />
            </VSCodeCard>

            {/* Coin Selector */}
            <VSCodeCard 
              title="Asset Selection" 
              subtitle="Choose your trading pair"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <CoinSelector />
            </VSCodeCard>

            {/* Chart */}
            <VSCodeCard 
              title="Price Chart" 
              subtitle={`${selectedCoin} price analysis`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
              headerActions={
                <button
                  onClick={() => setUseSimpleChart(!useSimpleChart)}
                  className="vscode-button-secondary text-sm px-3 py-1.5"
                >
                  {useSimpleChart ? 'Advanced Chart' : 'Simple Chart'}
                </button>
              }
            >
              <div className="h-96">
                {useSimpleChart ? <SimplePriceChart /> : <CandlestickChart />}
              </div>
            </VSCodeCard>
          </div>
        );

      case 'trading':
        return (
          <div className="space-y-6">
            {/* Trading Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VSCodeCard 
                title="Account Balance" 
                subtitle="Your current holdings"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
              >
                <BalanceDisplay key={balanceUpdateKey} />
              </VSCodeCard>
              
              <VSCodeCard 
                title="Place Order" 
                subtitle="Execute your trading strategy"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                <OrderForm
                  onSimulationStartSuccess={handleSimulationStarted}
                  onOrderSuccess={handleDataRefresh}
                />
              </VSCodeCard>
            </div>

            {/* Trailing Stop Monitor */}
            <VSCodeCard 
              title="Trailing Stop Monitor" 
              subtitle="Active trailing stop orders"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <TrailingStopMonitor
                key={monitorKey}
                onSimulationTriggered={handleDataRefresh}
              />
            </VSCodeCard>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <VSCodeCard 
              title="Order History" 
              subtitle="Your recent trading activity"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <OrderHistory
                key={orderHistoryKey}
                currentPrice={currentPrice}
                onBalanceUpdate={handleDataRefresh}
              />
            </VSCodeCard>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <VSCodeCard title="Trading Analytics" subtitle="Performance metrics and insights">
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-[var(--muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Analytics Coming Soon</h3>
                <p className="text-[var(--muted)]">Advanced trading analytics and performance metrics will be available in a future update.</p>
              </div>
            </VSCodeCard>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <VSCodeCard title="Settings" subtitle="Configure your trading preferences">
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-[var(--muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Settings Coming Soon</h3>
                <p className="text-[var(--muted)]">Customization options and preferences will be available in a future update.</p>
              </div>
            </VSCodeCard>
          </div>
        );

      default:
        return renderContent();
    }
  };

  return (
    <VSCodeLayout 
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
    >
      {renderContent()}
    </VSCodeLayout>
  );
}

export default function Home() {
  return (
    <TradingProvider>
      <TradingDashboard />
    </TradingProvider>
  );
}