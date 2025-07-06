// File: components/VSCodeStatusBar.tsx
'use client';

import { Layout, Space, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTrading } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';
import { useEffect, useState } from 'react';

const { Footer } = Layout;
const { Text } = Typography;

export default function VSCodeStatusBar() {
  const { selectedCoin } = useTrading();
  const t = useTranslations();
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('vi-VN')), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Footer style={{
      height: 32,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: 12,
      fontFamily: 'monospace',
      position: 'fixed',
      bottom: 0,
      width: '100%',
      zIndex: 1
    }}>
      <Space size="large">
        <Text style={{ color: 'white', fontSize: 12 }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          {t.status.binanceTestnet}
        </Text>
        <Text style={{ color: 'white', fontSize: 12 }}>
          {t.trading.pair}: {selectedCoin}/USDT
        </Text>
      </Space>
      <Text style={{ color: 'white', fontSize: 12, fontFamily: 'monospace' }}>
        {time}
      </Text>
    </Footer>
  );
}