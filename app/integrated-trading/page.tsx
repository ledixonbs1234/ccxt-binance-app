// File: app/integrated-trading/page.tsx
'use client';

import React, { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import {
  LineChartOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  RiseOutlined,
  DollarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { HomePageLayout } from '../../components/integrated/layout';
import {
  ResponsiveGrid,
  GridCol
} from '../../components/integrated/layout';
import {
  MarketOverview,
  CoinListingTable,
  CoinSearchFilter,
  CoinDetailModal
} from '../../components/integrated/home';
import { useMarket } from '../../contexts/integrated/MarketContext';
import { useUser } from '../../contexts/integrated/UserContext';

const { Title, Text, Paragraph } = Typography;

export default function IntegratedTradingHomePage() {
  const { state: marketState, selectCoin } = useMarket();
  const { state: userState } = useUser();

  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [showCoinDetail, setShowCoinDetail] = useState(false);

  const handleCoinSelect = (coin: any) => {
    setSelectedCoin(coin);
    setShowCoinDetail(true);
    selectCoin(coin);
  };

  const handleTrade = (coin: any) => {
    // TODO: Navigate to trading page with selected coin
    console.log('Navigate to trading with:', coin.symbol);
    setShowCoinDetail(false);
  };

  return (
    <HomePageLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        {userState.user && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <Title level={3} className="!text-white !mb-2">
              Welcome back, {userState.user?.name || 'Trader'}!
            </Title>
            <Paragraph className="!text-blue-100 !mb-4">
              Ready to explore the cryptocurrency market? Check out the latest trends and start trading.
            </Paragraph>
            <Space>
              <Button type="default" className="bg-white text-blue-600 border-white hover:bg-blue-50">
                View Portfolio
              </Button>
              <Button type="default" className="bg-transparent text-white border-white hover:bg-white/10">
                Market Analysis
              </Button>
            </Space>
          </div>
        )}

        {/* Market Overview */}
        <MarketOverview />

        {/* Search and Filters */}
        <CoinSearchFilter />

        {/* Coin Listing Table */}
        <CoinListingTable
          onCoinSelect={handleCoinSelect}
          showFilters={false}
          pageSize={20}
          height={600}
        />

        {/* Getting Started Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <Title level={3} className="!mb-4">
            Getting Started
          </Title>
          <ResponsiveGrid gutter={[24, 24]}>
            <GridCol xs={24} md={8}>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <LineChartOutlined className="text-blue-600 text-xl" />
                </div>
                <Title level={4}>Start Trading</Title>
                <Text className="text-slate-600 dark:text-slate-400">
                  Execute trades with real-time market data and advanced charting tools.
                </Text>
              </div>
            </GridCol>
            <GridCol xs={24} md={8}>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ExperimentOutlined className="text-green-600 text-xl" />
                </div>
                <Title level={4}>Test Strategies</Title>
                <Text className="text-slate-600 dark:text-slate-400">
                  Backtest your trading strategies with historical data before going live.
                </Text>
              </div>
            </GridCol>
            <GridCol xs={24} md={8}>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DashboardOutlined className="text-purple-600 text-xl" />
                </div>
                <Title level={4}>Monitor Performance</Title>
                <Text className="text-slate-600 dark:text-slate-400">
                  Track your portfolio performance with detailed analytics and insights.
                </Text>
              </div>
            </GridCol>
          </ResponsiveGrid>
        </div>

        {/* Test Button */}
        <div className="text-center">
          <Button
            type="dashed"
            onClick={() => window.open('/state-test', '_blank')}
          >
            🧪 Test State Management
          </Button>
        </div>
      </div>

      {/* Coin Detail Modal */}
      <CoinDetailModal
        coin={selectedCoin}
        visible={showCoinDetail}
        onClose={() => setShowCoinDetail(false)}
        onTrade={handleTrade}
      />
    </HomePageLayout>
  );
}