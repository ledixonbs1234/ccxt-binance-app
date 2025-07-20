'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import NavigationHelper from './NavigationHelper';

interface AntdLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AntdLayoutWrapper({ children }: AntdLayoutWrapperProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
        },
        components: {
          Card: {
            headerBg: '#fafafa',
          },
          Button: {
            borderRadius: 6,
          },
        },
      }}
    >
      <App>
        {children}
        <NavigationHelper />
      </App>
    </ConfigProvider>
  );
}
