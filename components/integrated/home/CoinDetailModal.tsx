// File: components/integrated/home/CoinDetailModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Tag, 
  Button, 
  Space,
  Avatar,
  Divider,
  Progress,
  Card,
  Tabs,
  Alert
} from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  RiseOutlined, 
  FallOutlined,
  LineChartOutlined,
  BellOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import { stateUtils } from '../../../lib/stateSync';

const { Title, Text, Paragraph } = Typography;

interface CoinDetailModalProps {
  coin: any;
  visible: boolean;
  onClose: () => void;
  onTrade?: (coin: any) => void;
}

export default function CoinDetailModal({
  coin,
  visible,
  onClose,
  onTrade
}: CoinDetailModalProps) {
  const { updateCoinPrice } = useMarket();
  const { addPriceAlert, addNotification } = useNotification();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Mock price history for demonstration
  useEffect(() => {
    if (coin && visible) {
      // Generate mock price history
      const history = [];
      let currentPrice = coin.price;
      for (let i = 24; i >= 0; i--) {
        const change = (Math.random() - 0.5) * 0.02; // ±1% random change
        currentPrice = currentPrice * (1 + change);
        history.push(currentPrice);
      }
      setPriceHistory(history);
    }
  }, [coin, visible]);

  if (!coin) return null;

  const handleAddPriceAlert = () => {
    addPriceAlert({
      symbol: coin.symbol,
      condition: 'above',
      targetValue: coin.price * 1.05, // 5% above current price
      currentValue: coin.price,
      enabled: true,
    });
    
    addNotification({
      type: 'success',
      title: 'Price Alert Created',
      message: `Alert set for ${coin.symbol} at $${(coin.price * 1.05).toFixed(2)}`,
      category: 'market',
      priority: 'medium',
      persistent: false,
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    addNotification({
      type: 'info',
      title: isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      message: `${coin.name} ${isFavorite ? 'removed from' : 'added to'} your favorites`,
      category: 'system',
      priority: 'low',
      persistent: false,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${coin.name} (${coin.symbol})`,
        text: `Check out ${coin.name} - $${stateUtils.formatPrice(coin.price, coin.symbol)}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${coin.name} (${coin.symbol}) - $${stateUtils.formatPrice(coin.price, coin.symbol)}`
      );
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Coin information copied to clipboard',
        category: 'system',
        priority: 'low',
        persistent: false,
      });
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div className="space-y-4">
          {/* Price Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Current Price"
                value={coin.price}
                precision={coin.symbol.includes('PEPE') ? 8 : 2}
                prefix="$"
                valueStyle={{ color: coin.changePercent24h >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="24h Change"
                value={coin.changePercent24h}
                precision={2}
                suffix="%"
                prefix={coin.changePercent24h >= 0 ? <RiseOutlined /> : <FallOutlined />}
                valueStyle={{ color: coin.changePercent24h >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="24h High"
                value={coin.high24h}
                precision={coin.symbol.includes('PEPE') ? 8 : 2}
                prefix="$"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="24h Low"
                value={coin.low24h}
                precision={coin.symbol.includes('PEPE') ? 8 : 2}
                prefix="$"
              />
            </Col>
          </Row>

          <Divider />

          {/* Market Data */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8}>
              <Statistic
                title="Market Cap"
                value={coin.marketCap}
                formatter={(value) => `$${(Number(value) / 1e9).toFixed(2)}B`}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                title="24h Volume"
                value={coin.volume24h}
                formatter={(value) => `$${(Number(value) / 1e6).toFixed(1)}M`}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                title="Rank"
                value={coin.rank || 'N/A'}
                prefix="#"
              />
            </Col>
          </Row>

          {/* Price Range Indicator */}
          <div className="mt-4">
            <Text type="secondary">24h Range</Text>
            <div className="mt-2">
              <Progress
                percent={((coin.price - coin.low24h) / (coin.high24h - coin.low24h)) * 100}
                showInfo={false}
                strokeColor={coin.changePercent24h >= 0 ? '#52c41a' : '#ff4d4f'}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${stateUtils.formatPrice(coin.low24h, coin.symbol)}</span>
                <span>${stateUtils.formatPrice(coin.high24h, coin.symbol)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'chart',
      label: 'Chart',
      children: (
        <div className="text-center py-8">
          <LineChartOutlined className="text-4xl text-gray-400 mb-4" />
          <Text type="secondary">
            Interactive chart will be integrated here
          </Text>
          <div className="mt-4">
            <Button type="primary" onClick={() => onTrade?.(coin)}>
              Open Trading View
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'alerts',
      label: 'Alerts',
      children: (
        <div className="space-y-4">
          <Alert
            message="Price Alert"
            description="Set up price alerts to get notified when the price reaches your target."
            type="info"
            showIcon
          />
          
          <Card size="small">
            <div className="space-y-3">
              <div>
                <Text strong>Quick Alert Options:</Text>
              </div>
              
              <Space direction="vertical" className="w-full">
                <Button 
                  block 
                  onClick={() => addPriceAlert({
                    symbol: coin.symbol,
                    condition: 'above',
                    targetValue: coin.price * 1.05,
                    currentValue: coin.price,
                    enabled: true,
                  })}
                >
                  Alert when price goes above +5%
                </Button>
                
                <Button 
                  block 
                  onClick={() => addPriceAlert({
                    symbol: coin.symbol,
                    condition: 'below',
                    targetValue: coin.price * 0.95,
                    currentValue: coin.price,
                    enabled: true,
                  })}
                >
                  Alert when price drops below -5%
                </Button>
                
                <Button 
                  block 
                  onClick={() => addPriceAlert({
                    symbol: coin.symbol,
                    condition: 'change_percent',
                    targetValue: 10,
                    currentValue: coin.price,
                    enabled: true,
                  })}
                >
                  Alert on 10% price change
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              size="large"
              src={coin.icon}
              className="bg-gradient-to-br from-blue-500 to-blue-600"
            >
              {coin.symbol.charAt(0)}
            </Avatar>
            <div>
              <Title level={4} className="!mb-0">
                {coin.name}
              </Title>
              <Text type="secondary">{coin.symbol}</Text>
            </div>
          </div>
          
          <Space>
            <Button
              type="text"
              icon={isFavorite ? <StarFilled /> : <StarOutlined />}
              onClick={handleToggleFavorite}
              className={isFavorite ? 'text-yellow-500' : ''}
            />
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={handleAddPriceAlert}
            />
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
            />
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-sm">
              Last updated: {coin.lastUpdated?.toLocaleTimeString() || 'Unknown'}
            </Text>
          </div>
          
          <Space>
            <Button onClick={onClose}>
              Close
            </Button>
            <Button type="primary" onClick={() => onTrade?.(coin)}>
              Trade {coin.symbol}
            </Button>
          </Space>
        </div>
      }
    >
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <div>
            <Text className="text-2xl font-bold">
              ${stateUtils.formatPrice(coin.price, coin.symbol)}
            </Text>
          </div>
          <Tag
            color={coin.changePercent24h >= 0 ? 'green' : 'red'}
            icon={coin.changePercent24h >= 0 ? <RiseOutlined /> : <FallOutlined />}
            className="text-sm"
          >
            {coin.changePercent24h >= 0 ? '+' : ''}{coin.changePercent24h.toFixed(2)}%
          </Tag>
        </div>
      </div>

      <Tabs items={tabItems} />
    </Modal>
  );
}
