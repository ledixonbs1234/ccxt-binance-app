'use client';

import { Card, Row, Col, Statistic, Typography, Alert, Badge, Space, Spin } from 'antd';
import {
  TrophyOutlined,
  FallOutlined,
  RiseOutlined,
  ExclamationCircleOutlined,
  DotChartOutlined
} from '@ant-design/icons';
import { useTrading } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';

const { Text, Title } = Typography;

export default function MarketOverview() {
  const { coinsData, isLoading, error } = useTrading();
  const t = useTranslations();

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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {Object.entries(coinsData).map(([symbol, data]) => (
          <Col xs={24} md={8} key={symbol}>
            <Card
              hoverable
              style={{ height: '100%' }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}
                  >
                    {symbol}
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                      {symbol}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      USDT
                    </Text>
                  </div>
                </div>
                <Badge
                  count={`${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`}
                  style={{
                    backgroundColor: data.change24h >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                />
              </div>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Statistic
                  title={t.trading.price}
                  value={isLoading ? 0 : data.price}
                  precision={data.price < 0.01 ? 8 : 2}
                  prefix="$"
                  loading={isLoading}
                  valueStyle={{
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: 600
                  }}
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Cao nhất 24h"
                      value={data.high}
                      precision={data.high < 0.01 ? 8 : 2}
                      prefix="$"
                      valueStyle={{
                        color: '#52c41a',
                        fontFamily: 'monospace',
                        fontSize: 14
                      }}
                      prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Thấp nhất 24h"
                      value={data.low}
                      precision={data.low < 0.01 ? 8 : 2}
                      prefix="$"
                      valueStyle={{
                        color: '#ff4d4f',
                        fontFamily: 'monospace',
                        fontSize: 14
                      }}
                      prefix={<FallOutlined style={{ color: '#ff4d4f' }} />}
                    />
                  </Col>
                </Row>

                <Statistic
                  title={t.trading.volume}
                  value={(data.volume / 1000000).toFixed(2)}
                  suffix="M"
                  valueStyle={{
                    fontFamily: 'monospace',
                    fontSize: 14
                  }}
                  prefix={<TrophyOutlined />}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

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
}
