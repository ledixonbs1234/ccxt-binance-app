// File: components/integrated/analytics/MarketAnalytics.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Typography, 
  Space,
  Select,
  Button,
  Tooltip,
  Progress
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Line, Column, Heatmap, Scatter } from '@ant-design/plots';
import { useMarket } from '../../../contexts/integrated/MarketContext';

const { Text, Title } = Typography;
const { Option } = Select;

interface MarketAnalyticsProps {
  className?: string;
}

export default function MarketAnalytics({ className = '' }: MarketAnalyticsProps) {
  const { state: marketState } = useMarket();
  const [timeframe, setTimeframe] = useState('24h');
  const [sortBy, setSortBy] = useState('volume');

  // Mock market data
  const [marketData, setMarketData] = useState({
    overview: {
      totalMarketCap: 2.1e12,
      totalVolume: 89.5e9,
      btcDominance: 42.3,
      fearGreedIndex: 68,
      activeCoins: 2847
    },
    topMovers: [
      { symbol: 'BTC', price: 109000, change24h: 3.2, volume: 28.5e9, marketCap: 2.1e12 },
      { symbol: 'ETH', price: 3800, change24h: 5.1, volume: 15.2e9, marketCap: 456e9 },
      { symbol: 'SOL', price: 245, change24h: 12.8, volume: 3.8e9, marketCap: 115e9 },
      { symbol: 'ADA', price: 1.15, change24h: -2.3, volume: 1.2e9, marketCap: 41e9 },
      { symbol: 'DOT', price: 8.95, change24h: 7.4, volume: 890e6, marketCap: 12.5e9 },
      { symbol: 'LINK', price: 25.80, change24h: -1.8, volume: 1.1e9, marketCap: 15.2e9 },
      { symbol: 'MATIC', price: 0.95, change24h: 15.2, volume: 650e6, marketCap: 9.8e9 },
      { symbol: 'AVAX', price: 42.50, change24h: -4.1, volume: 780e6, marketCap: 17.1e9 }
    ],
    sectors: [
      { name: 'DeFi', change: 8.5, volume: 12.5e9, dominance: 15.2 },
      { name: 'Layer 1', change: 5.2, volume: 35.8e9, dominance: 45.8 },
      { name: 'NFT', change: -2.1, volume: 2.1e9, dominance: 3.2 },
      { name: 'Gaming', change: 12.8, volume: 1.8e9, dominance: 2.8 },
      { name: 'Metaverse', change: -5.4, volume: 980e6, dominance: 1.5 }
    ],
    correlations: generateCorrelationData(),
    trends: generateTrendData()
  });

  function generateCorrelationData() {
    const assets = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'SOL'];
    const data = [];
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        let correlation;
        if (i === j) {
          correlation = 1;
        } else {
          // Generate realistic correlations (crypto assets tend to be correlated)
          correlation = 0.3 + Math.random() * 0.6;
          if (Math.random() < 0.1) correlation *= -1; // Some negative correlations
        }
        
        data.push({
          x: assets[i],
          y: assets[j],
          value: correlation
        });
      }
    }
    
    return data;
  }

  function generateTrendData() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      
      data.push({
        date: date.toISOString().split('T')[0],
        btc: 100000 + Math.sin(i * 0.2) * 5000 + Math.random() * 2000,
        eth: 3500 + Math.sin(i * 0.15) * 300 + Math.random() * 200,
        total_cap: 2e12 + Math.sin(i * 0.1) * 200e9 + Math.random() * 100e9
      });
    }
    
    return data;
  }

  const trendChartConfig = {
    data: marketData.trends.flatMap(d => [
      { date: d.date, value: d.btc, type: 'BTC' },
      { date: d.date, value: d.eth, type: 'ETH' }
    ]),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#f7931a', '#627eea'],
    legend: { position: 'top' as const },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `$${datum.value.toLocaleString()}`,
      }),
    },
  };

  const volumeChartConfig = {
    data: marketData.topMovers.slice(0, 8),
    xField: 'symbol',
    yField: 'volume',
    color: '#1890ff',
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Volume',
        value: `$${(datum.volume / 1e9).toFixed(1)}B`,
      }),
    },
  };

  const correlationHeatmapConfig = {
    data: marketData.correlations,
    xField: 'x',
    yField: 'y',
    colorField: 'value',
    color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    tooltip: {
      formatter: (datum: any) => ({
        name: `${datum.x} vs ${datum.y}`,
        value: datum.value.toFixed(3),
      }),
    },
  };

  const topMoversColumns = [
    {
      title: 'Asset',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold">
            {symbol.slice(0, 2)}
          </div>
          <Text strong>{symbol}</Text>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (price: number) => `$${price.toLocaleString()}`,
    },
    {
      title: '24h Change',
      dataIndex: 'change24h',
      key: 'change24h',
      align: 'right' as const,
      render: (change: number) => (
        <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <RiseOutlined className="mr-1" /> : <FallOutlined className="mr-1" />}
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      align: 'right' as const,
      render: (volume: number) => `$${(volume / 1e9).toFixed(1)}B`,
    },
    {
      title: 'Market Cap',
      dataIndex: 'marketCap',
      key: 'marketCap',
      align: 'right' as const,
      render: (cap: number) => `$${(cap / 1e9).toFixed(1)}B`,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Overview */}
      <Row gutter={16}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                ${(marketData.overview.totalMarketCap / 1e12).toFixed(1)}T
              </div>
              <div className="text-sm text-gray-500">Market Cap</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ${(marketData.overview.totalVolume / 1e9).toFixed(1)}B
              </div>
              <div className="text-sm text-gray-500">24h Volume</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {marketData.overview.btcDominance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">BTC Dominance</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <div className="text-lg font-semibold text-purple-600">
                  {marketData.overview.fearGreedIndex}
                </div>
                <FireOutlined className="text-purple-600" />
              </div>
              <div className="text-sm text-gray-500">Fear & Greed</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div className="text-center">
              <div className="text-lg font-semibold text-teal-600">
                {marketData.overview.activeCoins.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Active Coins</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Price Trends */}
      <Card 
        title="Price Trends" 
        size="small"
        extra={
          <Select
            value={timeframe}
            onChange={setTimeframe}
            size="small"
            style={{ width: 80 }}
          >
            <Option value="1h">1H</Option>
            <Option value="24h">24H</Option>
            <Option value="7d">7D</Option>
            <Option value="30d">30D</Option>
          </Select>
        }
      >
        <Line {...trendChartConfig} height={300} />
      </Card>

      <Row gutter={16}>
        {/* Top Movers */}
        <Col xs={24} lg={14}>
          <Card 
            title="Top Movers" 
            size="small"
            extra={
              <Select
                value={sortBy}
                onChange={setSortBy}
                size="small"
                style={{ width: 100 }}
              >
                <Option value="volume">Volume</Option>
                <Option value="change">Change</Option>
                <Option value="marketCap">Market Cap</Option>
              </Select>
            }
          >
            <Table
              columns={topMoversColumns}
              dataSource={marketData.topMovers}
              rowKey="symbol"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Sector Performance */}
        <Col xs={24} lg={10}>
          <Card title="Sector Performance" size="small">
            <div className="space-y-4">
              {marketData.sectors.map((sector) => (
                <div key={sector.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{sector.name}</div>
                    <div className="text-sm text-gray-500">
                      ${(sector.volume / 1e9).toFixed(1)}B volume
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${sector.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                    </div>
                    <Progress 
                      percent={sector.dominance} 
                      size="small" 
                      showInfo={false}
                      strokeColor={sector.change >= 0 ? '#52c41a' : '#ff4d4f'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Volume Analysis */}
        <Col xs={24} lg={12}>
          <Card title="Volume Analysis" size="small">
            <Column {...volumeChartConfig} height={250} />
          </Card>
        </Col>

        {/* Correlation Matrix */}
        <Col xs={24} lg={12}>
          <Card title="Asset Correlations" size="small">
            <Heatmap {...correlationHeatmapConfig} height={250} />
          </Card>
        </Col>
      </Row>

      {/* Market Alerts */}
      <Card title="Market Alerts" size="small">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
            <RiseOutlined className="text-green-600" />
            <div>
              <div className="font-semibold text-green-800">Strong Bullish Signal</div>
              <div className="text-sm text-green-600">
                SOL showing strong momentum with 12.8% gain and high volume
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
            <ThunderboltOutlined className="text-blue-600" />
            <div>
              <div className="font-semibold text-blue-800">High Volume Alert</div>
              <div className="text-sm text-blue-600">
                BTC volume 25% above average - potential breakout incoming
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
            <FireOutlined className="text-yellow-600" />
            <div>
              <div className="font-semibold text-yellow-800">Fear & Greed Index</div>
              <div className="text-sm text-yellow-600">
                Market sentiment at 68 (Greed) - consider taking profits
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
