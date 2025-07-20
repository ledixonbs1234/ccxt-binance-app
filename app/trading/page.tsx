// File: app/trading/page.tsx
'use client';

import React from 'react';
import { Typography, Alert, Space } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import TradingDashboard from '../../components/integrated/trading/TradingDashboard';
import { EnhancedTradingProvider } from '../../contexts/integrated/EnhancedTradingContext';
import { MarketProvider } from '../../contexts/integrated/MarketContext';
import { NotificationProvider } from '../../contexts/integrated/NotificationContext';

const { Title, Text } = Typography;

export default function TradingPage() {
  return (
    <NotificationProvider>
      <MarketProvider>
        <EnhancedTradingProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-6">
              {/* Page Header */}
              <div className="mb-6">
                <Space align="center" className="mb-4">
                  <DollarOutlined className="text-2xl text-blue-600" />
                  <Title level={2} className="!mb-0">
                    Trading Interface
                  </Title>
                </Space>
                
                <Text type="secondary" className="text-base">
                  Advanced trading interface with real-time market data, order management, and position tracking
                </Text>
              </div>

              {/* Demo Notice */}
              <Alert
                message="Demo Trading Mode"
                description="This is a demonstration trading interface. All trades are simulated and no real money is involved."
                type="info"
                showIcon
                className="mb-6"
                banner
              />

              {/* Trading Dashboard */}
              <TradingDashboard />
            </div>
          </div>
        </EnhancedTradingProvider>
      </MarketProvider>
    </NotificationProvider>
  );
}
