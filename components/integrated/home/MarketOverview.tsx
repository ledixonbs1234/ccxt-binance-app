// File: components/integrated/home/MarketOverview.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Progress, 
  Tag,
  Space,
  Tooltip
} from 'antd';
import { 
  DollarOutlined, 
  BarChartOutlined, 
  RiseOutlined, 
  FallOutlined,
  TrophyOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { stateUtils } from '../../../lib/stateSync';

const { Title, Text } = Typography;

interface MarketOverviewProps {
  className?: string;
}

export default function MarketOverview({ className = '' }: MarketOverviewProps) {
  const { state: marketState } = useMarket();

  // Calculate market statistics
  const marketStats = useMemo(() => {
    const { coins, overview } = marketState;
    
    if (!overview || coins.length === 0) {
      return {
        totalMarketCap: 0,
        totalVolume: 0,
        btcDominance: 0,
        activeCoins: 0,
        marketCapChange: 0,
        gainers: 0,
        losers: 0,
        topGainer: null,
        topLoser: null,
      };
    }

    const gainers = coins.filter(coin => coin.changePercent24h > 0);
    const losers = coins.filter(coin => coin.changePercent24h < 0);
    
    const topGainer = coins.reduce((max, coin) => 
      coin.changePercent24h > (max?.changePercent24h || -Infinity) ? coin : max, 
      coins[0]
    );
    
    const topLoser = coins.reduce((min, coin) => 
      coin.changePercent24h < (min?.changePercent24h || Infinity) ? coin : min, 
      coins[0]
    );

    return {
      totalMarketCap: overview.totalMarketCap,
      totalVolume: overview.totalVolume24h,
      btcDominance: overview.btcDominance,
      activeCoins: overview.activeCoins,
      marketCapChange: overview.marketCapChange24h,
      gainers: gainers.length,
      losers: losers.length,
      topGainer,
      topLoser,
    };
  }, [marketState]);

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    color = 'blue',
    tooltip,
    extra 
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
    tooltip?: string;
    extra?: React.ReactNode;
  }) => (
    <Card size="small" className="h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`text-${color}-500 text-lg`}>
              {icon}
            </div>
            <Text type="secondary" className="text-sm">
              {title}
              {tooltip && (
                <Tooltip title={tooltip}>
                  <InfoCircleOutlined className="ml-1 text-xs" />
                </Tooltip>
              )}
            </Text>
          </div>
          
          <div className="mb-2">
            <Text className="text-xl font-bold">
              {typeof value === 'number' ? formatLargeNumber(value) : value}
            </Text>
          </div>
          
          {change !== undefined && (
            <Tag
              color={change >= 0 ? 'green' : 'red'}
              icon={change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              className="text-xs"
            >
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </Tag>
          )}
          
          {extra && (
            <div className="mt-2">
              {extra}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-1">
            Market Overview
          </Title>
          <Text type="secondary">
            Real-time cryptocurrency market statistics
            {marketState.lastUpdate && (
              <span className="ml-2">
                • Updated {marketState.lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </Text>
        </div>
      </div>

      {/* Main Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Market Cap"
            value={marketStats.totalMarketCap}
            change={marketStats.marketCapChange}
            icon={<DollarOutlined />}
            color="blue"
            tooltip="Total market capitalization of all cryptocurrencies"
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="24h Volume"
            value={marketStats.totalVolume}
            icon={<BarChartOutlined />}
            color="green"
            tooltip="Total trading volume in the last 24 hours"
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="BTC Dominance"
            value={`${marketStats.btcDominance.toFixed(1)}%`}
            icon={<TrophyOutlined />}
            color="orange"
            tooltip="Bitcoin's share of the total cryptocurrency market cap"
            extra={
              <Progress
                percent={marketStats.btcDominance}
                showInfo={false}
                strokeColor="#f59e0b"
                size="small"
              />
            }
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Coins"
            value={marketStats.activeCoins.toLocaleString()}
            icon={<GlobalOutlined />}
            color="purple"
            tooltip="Number of active cryptocurrencies being tracked"
          />
        </Col>
      </Row>

      {/* Market Sentiment */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Market Sentiment" size="small">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <RiseOutlined className="text-green-500" />
                  <Text>Gainers</Text>
                </div>
                <div className="text-right">
                  <Text className="text-green-600 font-bold text-lg">
                    {marketStats.gainers}
                  </Text>
                  <Text type="secondary" className="block text-xs">
                    coins up
                  </Text>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FallOutlined className="text-red-500" />
                  <Text>Losers</Text>
                </div>
                <div className="text-right">
                  <Text className="text-red-600 font-bold text-lg">
                    {marketStats.losers}
                  </Text>
                  <Text type="secondary" className="block text-xs">
                    coins down
                  </Text>
                </div>
              </div>
              
              <div className="pt-2">
                <Progress
                  percent={marketStats.gainers + marketStats.losers > 0 
                    ? (marketStats.gainers / (marketStats.gainers + marketStats.losers)) * 100 
                    : 50}
                  strokeColor="#10b981"
                  trailColor="#ef4444"
                  showInfo={false}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Bearish</span>
                  <span>Bullish</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Top Movers" size="small">
            <div className="space-y-3">
              {marketStats.topGainer && (
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div>
                    <Text strong className="text-green-700 dark:text-green-400">
                      🚀 Top Gainer
                    </Text>
                    <div className="text-sm">
                      {marketStats.topGainer.name} ({marketStats.topGainer.symbol})
                    </div>
                  </div>
                  <div className="text-right">
                    <Tag color="green" className="font-mono">
                      +{marketStats.topGainer.changePercent24h.toFixed(2)}%
                    </Tag>
                    <div className="text-xs text-gray-500">
                      ${stateUtils.formatPrice(marketStats.topGainer.price, marketStats.topGainer.symbol)}
                    </div>
                  </div>
                </div>
              )}
              
              {marketStats.topLoser && (
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div>
                    <Text strong className="text-red-700 dark:text-red-400">
                      📉 Top Loser
                    </Text>
                    <div className="text-sm">
                      {marketStats.topLoser.name} ({marketStats.topLoser.symbol})
                    </div>
                  </div>
                  <div className="text-right">
                    <Tag color="red" className="font-mono">
                      {marketStats.topLoser.changePercent24h.toFixed(2)}%
                    </Tag>
                    <div className="text-xs text-gray-500">
                      ${stateUtils.formatPrice(marketStats.topLoser.price, marketStats.topLoser.symbol)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
