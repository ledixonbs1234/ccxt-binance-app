'use client';

import React from 'react';
import { Alert } from 'antd';
import MarketAnalysisPanel from '@/components/MarketAnalysisPanel';
import PageContainer from '@/components/PageContainer';

export default function MarketAnalysisPage() {
  return (
    <PageContainer
      title="📊 Market Analysis"
      subtitle="Hệ thống phân tích thị trường tự động với AI - phân tích trend, volatility, support/resistance, volume profile và đưa ra khuyến nghị strategy tối ưu cho trailing stop"
    >
      <Alert
        message="Advanced Market Analysis System"
        description="Hệ thống phân tích thị trường tự động với AI - phân tích trend, volatility, support/resistance, volume profile và đưa ra khuyến nghị strategy tối ưu cho trailing stop"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <MarketAnalysisPanel />
    </PageContainer>
  );
}
