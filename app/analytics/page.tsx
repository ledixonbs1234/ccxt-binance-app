// File: app/analytics/page.tsx
'use client';

import React from 'react';
import { Typography, Alert, Space } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import AnalyticsDashboard from '../../components/integrated/analytics/AnalyticsDashboard';
import { NotificationProvider } from '../../contexts/integrated/NotificationContext';
import { MarketProvider } from '../../contexts/integrated/MarketContext';
import { EnhancedTradingProvider } from '../../contexts/integrated/EnhancedTradingContext';

const { Title, Text } = Typography;

export default function AnalyticsPage() {
  return (
    <NotificationProvider>
      <MarketProvider>
        <EnhancedTradingProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-6">
              {/* Page Header */}
              <div className="mb-6">
                <Space align="center" className="mb-4">
                  <BarChartOutlined className="text-2xl text-blue-600" />
                  <Title level={2} className="!mb-0">
                    Analytics Dashboard
                  </Title>
                </Space>
                
                <Text type="secondary" className="text-base">
                  Comprehensive analytics for portfolio performance, market trends, and trading insights
                </Text>
              </div>

              {/* Demo Notice */}
              <Alert
                message="Demo Analytics Environment"
                description="This analytics dashboard displays simulated data for demonstration purposes. All metrics, charts, and insights are generated from mock data."
                type="info"
                showIcon
                className="mb-6"
                banner
              />

              {/* Analytics Dashboard */}
              <AnalyticsDashboard />
            </div>
          </div>
        </EnhancedTradingProvider>
      </MarketProvider>
    </NotificationProvider>
  );
}
