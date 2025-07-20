// File: app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import BalanceDisplay from '../components/BalanceDisplay';
import OrderForm from '../components/OrderForm';
import OrderHistory from '../components/OrderHistory';
import TrailingStopMonitor from '../components/TrailingStopMonitor';
import TrailingStopTester from '../components/TrailingStopTester';
import SmartTrailingMonitor from '../components/SmartTrailingMonitor';
import CandlestickChart from '../components/CandlestickChart';
import SimplePriceChart from '../components/SimplePriceChart';
import MarketSelector from '../components/MarketSelector';
import VSCodeLayout from '../components/VSCodeLayout';
import VSCodeCard from '../components/VSCodeCard';
import { useTranslations } from '../contexts/LanguageContext';
import { TradingProvider, useTrading } from '../contexts/TradingContext';
import { SmartTrailingProvider } from '../contexts/SmartTrailingContext';
import { usePrice, PriceProvider } from '../contexts/PriceContext';
import { generateUniqueId } from '../lib/utils';

function TradingDashboard() {
  const { selectedCoin } = useTrading();
  const { price } = usePrice();
  const t = useTranslations();
  const [balanceUpdateKey, setBalanceUpdateKey] = useState(generateUniqueId());
  const [orderHistoryKey, setOrderHistoryKey] = useState(generateUniqueId());
  const [monitorKey, setMonitorKey] = useState(generateUniqueId());
  const [useSimpleChart, setUseSimpleChart] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');

  const handleDataRefresh = useCallback(() => {
    setBalanceUpdateKey(generateUniqueId());
    setOrderHistoryKey(generateUniqueId());
    setMonitorKey(generateUniqueId());
  }, []);

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <MarketSelector />
            <VSCodeCard
              title={t.trading.priceChart}
              subtitle={`${t.trading.realTimeAnalysis} ${selectedCoin}/USDT`}
              headerActions={
                <button
                  onClick={() => setUseSimpleChart(!useSimpleChart)}
                  className="vscode-button-secondary text-sm"
                >
                  {useSimpleChart ? t.trading.switchToAdvancedChart : t.trading.switchToSimpleChart}
                </button>
              }
            >
              <div className="h-[450px] w-full">
                {useSimpleChart ? <SimplePriceChart /> : <CandlestickChart />}
              </div>
            </VSCodeCard>
          </div>
        );

      case 'trading':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              <OrderForm onOrderSuccess={handleDataRefresh} onSimulationStartSuccess={handleDataRefresh} />
              <TrailingStopMonitor key={monitorKey} onSimulationTriggered={handleDataRefresh} />
              <TrailingStopTester />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <BalanceDisplay key={balanceUpdateKey} />
              <OrderHistory key={orderHistoryKey} currentPrice={price} onBalanceUpdate={handleDataRefresh} />
            </div>
          </div>
        );

      case 'smart-trailing':
        return (
          <div className="animate-fade-in">
            <SmartTrailingMonitor />
          </div>
        );

      case 'enhanced-trailing-demo':
        // Redirect to the enhanced trailing demo page
        if (typeof window !== 'undefined') {
          window.location.href = '/enhanced-trailing-demo';
        }
        return (
          <div className="h-full flex items-center justify-center animate-fade-in">
            <VSCodeCard className="text-center w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-2">Enhanced Trailing Demo</h2>
              <p className="text-muted">Redirecting to enhanced trailing stop demo...</p>
            </VSCodeCard>
          </div>
        );

      case 'ai-backtesting':
        // Redirect to the AI backtesting page
        if (typeof window !== 'undefined') {
          window.location.href = '/ai-backtesting';
        }
        return (
          <div className="h-full flex items-center justify-center animate-fade-in">
            <VSCodeCard className="text-center w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-2">🤖 AI Backtesting</h2>
              <p className="text-muted">Redirecting to AI backtesting system...</p>
            </VSCodeCard>
          </div>
        );

      // Placeholder for future sections
      case 'portfolio':
      case 'analytics':
      case 'history':
      case 'settings':
        return (
            <div className="h-full flex items-center justify-center animate-fade-in">
                <VSCodeCard className="text-center w-full max-w-lg">
                    <h2 className="text-2xl font-bold mb-2 capitalize">
                      {currentSection === 'history' ? t.navigation.history :
                       currentSection === 'settings' ? t.navigation.settings :
                       currentSection}
                    </h2>
                    <p className="text-muted">Phần này đang được phát triển và sẽ có sẵn trong bản cập nhật tương lai.</p>
                </VSCodeCard>
            </div>
        );

      default:
        return <div>Không tìm thấy phần này</div>;
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
    <PriceProvider>
      <TradingProvider>
        <SmartTrailingProvider>
          <TradingDashboard />
        </SmartTrailingProvider>
      </TradingProvider>
    </PriceProvider>
  );
}