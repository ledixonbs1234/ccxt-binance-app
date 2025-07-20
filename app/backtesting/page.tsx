// File: app/backtesting/page.tsx
'use client';

import React from 'react';
import { Typography, Alert, Space } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import BacktestDashboard from '../../components/integrated/backtesting/BacktestDashboard';
import { NotificationProvider } from '../../contexts/integrated/NotificationContext';

const { Title, Text } = Typography;

export default function BacktestingPage() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <Space align="center" className="mb-4">
              <ExperimentOutlined className="text-2xl text-blue-600" />
              <Title level={2} className="!mb-0">
                Backtesting System
              </Title>
            </Space>
            
            <Text type="secondary" className="text-base">
              Build, test, and analyze trading strategies using historical market data
            </Text>
          </div>

          {/* Demo Notice */}
          <Alert
            message="Demo Backtesting Environment"
            description="This backtesting system uses simulated data and results. All strategies and performance metrics are for demonstration purposes only."
            type="info"
            showIcon
            className="mb-6"
            banner
          />

          {/* Backtesting Dashboard */}
          <BacktestDashboard />
        </div>
      </div>
    </NotificationProvider>
  );
}
