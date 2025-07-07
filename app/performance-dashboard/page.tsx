'use client';

import React from 'react';
import { Alert } from 'antd';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import PageContainer from '@/components/PageContainer';

export default function PerformanceDashboardPage() {
  return (
    <PageContainer
      title="📊 Performance Dashboard"
      subtitle="Theo dõi và phân tích hiệu suất của các chiến lược trailing stop với metrics chi tiết, biểu đồ trực quan và so sánh performance giữa các strategies"
    >
      <Alert
        message="Trailing Stop Performance Analytics"
        description="Theo dõi và phân tích hiệu suất của các chiến lược trailing stop với metrics chi tiết, biểu đồ trực quan và so sánh performance giữa các strategies"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <PerformanceDashboard />
    </PageContainer>
  );
}
