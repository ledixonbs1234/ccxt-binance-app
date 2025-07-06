'use client';

import { Card, Row, Col, Typography, Spin, Badge } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTrading, CoinSymbol } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';

const { Text, Title } = Typography;

const COIN_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  PEPE: { name: 'Pepe', icon: '🐸', color: '#4caf50' }
};

export default function CoinSelector() {
  const { selectedCoin, setSelectedCoin, coinsData, isLoading } = useTrading();
  const t = useTranslations();

  return (
    <Row gutter={[16, 16]}>
      {Object.entries(COIN_INFO).map(([coin, info]) => {
        const coinData = coinsData[coin as CoinSymbol];
        const isSelected = selectedCoin === coin;

        return (
          <Col xs={24} sm={8} key={coin}>
            <Card
              hoverable
              onClick={() => setSelectedCoin(coin as CoinSymbol)}
              style={{
                borderColor: isSelected ? '#1890ff' : undefined,
                transform: isSelected ? 'scale(1.02)' : undefined,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 20,
                      background: `linear-gradient(135deg, ${info.color}, ${info.color}CC)`,
                      boxShadow: `0 4px 14px 0 ${info.color}40`
                    }}
                  >
                    {info.icon}
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0, fontSize: 20 }}>
                      {coin}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {info.name}
                    </Text>
                  </div>
                </div>
                {isSelected && (
                  <Badge
                    status="processing"
                    text={<Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 500 }}>ĐANG CHỌN</Text>}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 14 }}>{t.trading.price}</Text>
                  <div style={{ textAlign: 'right' }}>
                    {isLoading || !coinData ? (
                      <Spin size="small" />
                    ) : (
                      <Text strong style={{ fontSize: 20, fontFamily: 'monospace' }}>
                        ${coinData.price < 0.01 ? coinData.price.toFixed(8) : coinData.price.toLocaleString()}
                      </Text>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 14 }}>Thay đổi 24h</Text>
                  {!coinData ? (
                    <Spin size="small" />
                  ) : (
                    <Badge
                      count={`${coinData.change24h >= 0 ? '+' : ''}${coinData.change24h.toFixed(2)}%`}
                      style={{
                        backgroundColor: coinData.change24h >= 0 ? '#52c41a' : '#ff4d4f',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    />
                  )}
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
