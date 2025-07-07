'use client';

import React from 'react';
import { Typography, Alert } from 'antd';
import RiskManagementPanel from '@/components/RiskManagementPanel';

const { Title } = Typography;

export default function RiskManagementPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Title level={2}>🛡️ Risk Management</Title>
      
      <Alert
        message="Intelligent Risk Management System"
        description="Hệ thống quản lý rủi ro thông minh với tính toán position sizing tối ưu, max loss protection, risk assessment và smart risk management rules"
        type="info"
        showIcon
        className="mb-6"
      />

      <RiskManagementPanel />
    </div>
  );
}
