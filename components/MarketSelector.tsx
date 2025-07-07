'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Badge, Space, Spin, Button } from 'antd';
import {
  TrophyOutlined,
  FallOutlined,
  RiseOutlined,
  ExclamationCircleOutlined,
  DotChartOutlined,
  RocketOutlined,
  CheckOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useTrading, CoinSymbol } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';
import { MarketSkeleton } from './skeletons/MarketSkeleton';
import { getSmartPrecision, isMicroCapToken, formatSmartPrice } from '../lib/priceFormatter';
import { usePerformanceMonitor } from './optimized/LazyComponents';

const { Text, Title } = Typography;

// Coin information with icons and colors
const COIN_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  PEPE: { name: 'Pepe', icon: '🐸', color: '#4caf50' }
};

// Helper functions for smart formatting
const getSmartStatisticProps = (value: number) => {
  const precision = getSmartPrecision(value);
  const isMicroCap = isMicroCapToken(value);

  return {
    precision: precision.useScientific ? 2 : precision.precision,
    valueStyle: {
      fontFamily: 'monospace',
      fontSize: isMicroCap ? 14 : 16, // Slightly smaller for compact design
      fontWeight: 600,
      ...(precision.useScientific && {
        fontSize: 12,
        letterSpacing: '0.5px'
      })
    },
    formatter: precision.useScientific
      ? (val: any) => {
          const numVal = typeof val === 'string' ? parseFloat(val) : val;
          return numVal.toExponential(2);
        }
      : undefined
  };
};

const getSmartBadgeStyle = (change: number, isMicroCap: boolean) => ({
  backgroundColor: change >= 0 ? '#52c41a' : '#ff4d4f',
  fontSize: isMicroCap ? 10 : 11, // Smaller for compact design
  fontWeight: 500,
  padding: isMicroCap ? '1px 4px' : '2px 6px'
});

const MarketSelector = memo(() => {
  const { selectedCoin, setSelectedCoin, coinsData, isLoading, error } = useTrading();
  const t = useTranslations();

  // Performance monitoring
  usePerformanceMonitor('MarketSelector');

  // Memoize coin selection handler
  const handleCoinSelect = useCallback((coin: CoinSymbol) => {
    if (coin !== selectedCoin) {
      setSelectedCoin(coin);
    }
  }, [selectedCoin, setSelectedCoin]);

  // Memoize coin data processing
  const processedCoinsData = useMemo(() => {
    return Object.entries(coinsData).map(([coin, data]) => ({
      coin: coin as CoinSymbol,
      data,
      isSelected: coin === selectedCoin
    }));
  }, [coinsData, selectedCoin]);

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu thị trường"
        description={error}
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Show skeleton during initial loading
  if (isLoading && Object.keys(coinsData).length === 0) {
    return <MarketSkeleton />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Trading Hubs Access */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              🚀 Advanced Trading System
            </Title>
            <Text type="secondary">
              Professional trading platform với production features và demo environment
            </Text>
          </div>
          <Space>
            <Link href="/production-hub">
              <Button type="primary" icon={<TrophyOutlined />} size="large">
                Production Hub
              </Button>
            </Link>
            <Link href="/demo-hub">
              <Button icon={<RocketOutlined />} size="large">
                Demo Hub
              </Button>
            </Link>
          </Space>
        </div>
      </Card>

      {/* Market Overview with Coin Selection */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              📊 Thị trường & Chọn Coin
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Click vào coin để chọn cho trading
            </Text>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          {processedCoinsData.map(({ coin, data, isSelected }) => {
            const coinInfo = COIN_INFO[coin];

            return (
              <Col xs={24} md={8} key={coin}>
                <Card
                  hoverable
                  onClick={() => handleCoinSelect(coin)}
                  style={{
                    height: '100%',
                    borderColor: isSelected ? '#1890ff' : undefined,
                    borderWidth: isSelected ? 2 : 1,
                    transform: isSelected ? 'scale(1.02)' : undefined,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 20px rgba(24, 144, 255, 0.3)' : undefined
                  }}
                  styles={{ body: { padding: 20 } }}
                >
                  {/* Header with coin info and selection indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 16,
                          background: `linear-gradient(135deg, ${coinInfo.color}, ${coinInfo.color}CC)`,
                          boxShadow: `0 4px 14px 0 ${coinInfo.color}40`
                        }}
                      >
                        {coinInfo.icon}
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                          {coin}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {coinInfo.name}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isSelected && (
                        <CheckOutlined 
                          style={{ 
                            color: '#1890ff', 
                            fontSize: 16,
                            backgroundColor: '#e6f7ff',
                            padding: 4,
                            borderRadius: '50%'
                          }} 
                        />
                      )}
                      <Badge
                        count={`${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(isMicroCapToken(data.price) ? 4 : 2)}%`}
                        style={getSmartBadgeStyle(data.change24h, isMicroCapToken(data.price))}
                      />
                    </div>
                  </div>

                  {/* Price and market data */}
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Statistic
                      title={t.trading.price}
                      value={isLoading ? 0 : data.price}
                      {...getSmartStatisticProps(data.price)}
                      prefix="$"
                      loading={isLoading}
                    />

                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic
                          title="Cao"
                          value={data.high}
                          {...getSmartStatisticProps(data.high)}
                          prefix="$"
                          valueStyle={{
                            ...getSmartStatisticProps(data.high).valueStyle,
                            color: '#52c41a',
                            fontSize: isMicroCapToken(data.high) ? 11 : 12
                          }}
                          suffix={<RiseOutlined style={{ color: '#52c41a', fontSize: 10 }} />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Thấp"
                          value={data.low}
                          {...getSmartStatisticProps(data.low)}
                          prefix="$"
                          valueStyle={{
                            ...getSmartStatisticProps(data.low).valueStyle,
                            color: '#ff4d4f',
                            fontSize: isMicroCapToken(data.low) ? 11 : 12
                          }}
                          suffix={<FallOutlined style={{ color: '#ff4d4f', fontSize: 10 }} />}
                        />
                      </Col>
                    </Row>

                    <Statistic
                      title={t.trading.volume}
                      value={(data.volume / 1000000).toFixed(2)}
                      suffix="M"
                      valueStyle={{
                        fontFamily: 'monospace',
                        fontSize: 12
                      }}
                      prefix={<TrophyOutlined style={{ fontSize: 10 }} />}
                    />
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Live Data Status */}
      <Card size="small" style={{ textAlign: 'center' }}>
        <Space size="middle" align="center">
          <Badge status="processing" />
          <Text type="secondary" style={{ fontSize: 12 }}>Live Data</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Updates every 5 seconds</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Binance Testnet</Text>
          <DotChartOutlined style={{ color: '#52c41a' }} />
        </Space>
      </Card>
    </Space>
  );
});

MarketSelector.displayName = 'MarketSelector';

export default MarketSelector;
