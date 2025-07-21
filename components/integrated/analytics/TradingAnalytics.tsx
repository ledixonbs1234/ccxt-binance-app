// File: components/integrated/analytics/TradingAnalytics.tsx
'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Table,
  Tag,
  Progress,
  Select,
  Space,
  Alert
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  PercentageOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/plots';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';

const { Text, Title } = Typography;
const { Option } = Select;

interface TradingAnalyticsProps {
  className?: string;
}

export default function TradingAnalytics({ className = '' }: TradingAnalyticsProps) {
  const { state: tradingState } = useEnhancedTrading();
  const [timeRange, setTimeRange] = useState('1M');
  const [analysisType, setAnalysisType] = useState('performance');

  // Mock trading analytics data
  const [tradingData] = useState({
    performance: {
      totalTrades: 156,
      winningTrades: 89,
      losingTrades: 67,
      winRate: 57.1,
      avgWin: 2.8,
      avgLoss: -1.9,
      profitFactor: 1.65,
      sharpeRatio: 1.42,
      maxDrawdown: -12.5,
      totalPnL: 15420,
      bestTrade: 850,
      worstTrade: -420,
      avgHoldTime: 4.2 // hours
    },
    monthlyPnL: [
      { month: 'Jan', pnl: 1200, trades: 18 },
      { month: 'Feb', pnl: -450, trades: 15 },
      { month: 'Mar', pnl: 2100, trades: 22 },
      { month: 'Apr', pnl: 800, trades: 19 },
      { month: 'May', pnl: 1850, trades: 25 },
      { month: 'Jun', pnl: -320, trades: 14 },
      { month: 'Jul', pnl: 2200, trades: 28 },
      { month: 'Aug', pnl: 1100, trades: 21 },
      { month: 'Sep', pnl: 1650, trades: 24 },
      { month: 'Oct', pnl: 950, trades: 18 },
      { month: 'Nov', pnl: 2800, trades: 32 },
      { month: 'Dec', pnl: 1540, trades: 20 }
    ],
    tradeDistribution: [
      { range: '< -10%', count: 8, color: '#ff4d4f' },
      { range: '-10% to -5%', count: 15, color: '#ff7875' },
      { range: '-5% to 0%', count: 44, color: '#ffa39e' },
      { range: '0% to 5%', count: 52, color: '#95de64' },
      { range: '5% to 10%', count: 28, color: '#52c41a' },
      { range: '> 10%', count: 9, color: '#389e0d' }
    ],
    assetPerformance: [
      { asset: 'BTC', trades: 45, winRate: 62.2, pnL: 5200, avgReturn: 2.1 },
      { asset: 'ETH', trades: 38, winRate: 55.3, pnL: 3800, avgReturn: 1.8 },
      { asset: 'ADA', trades: 25, winRate: 48.0, pnL: -420, avgReturn: -0.5 },
      { asset: 'DOT', trades: 22, winRate: 59.1, pnL: 2100, avgReturn: 1.9 },
      { asset: 'LINK', trades: 18, winRate: 61.1, pnL: 1850, avgReturn: 2.3 },
      { asset: 'SOL', trades: 8, winRate: 75.0, pnL: 2890, avgReturn: 4.2 }
    ],
    equityCurve: generateEquityCurve(),
    drawdownCurve: generateDrawdownCurve()
  });

  function generateEquityCurve() {
    const data = [];
    let equity = 10000;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate trading returns with some volatility
      const dailyReturn = (Math.random() - 0.45) * 0.02; // Slight positive bias
      equity *= (1 + dailyReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        equity: Math.round(equity),
        return: ((equity - 10000) / 10000) * 100
      });
    }
    return data;
  }

  function generateDrawdownCurve() {
    const data = [];
    let peak = 10000;
    let current = 10000;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dailyReturn = (Math.random() - 0.45) * 0.02;
      current *= (1 + dailyReturn);
      
      if (current > peak) {
        peak = current;
      }
      
      const drawdown = ((current - peak) / peak) * 100;
      
      data.push({
        date: date.toISOString().split('T')[0],
        drawdown: Math.min(drawdown, 0)
      });
    }
    return data;
  }

  const equityChartConfig = {
    data: tradingData.equityCurve,
    xField: 'date',
    yField: 'equity',
    smooth: true,
    color: '#1890ff',
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Equity',
        value: `$${datum.equity.toLocaleString()}`,
      }),
    },
  };

  const drawdownChartConfig = {
    data: tradingData.drawdownCurve,
    xField: 'date',
    yField: 'drawdown',
    smooth: true,
    color: '#ff4d4f',
    area: {
      style: {
        fill: 'l(270) 0:#ff4d4f 1:#fff',
        fillOpacity: 0.3,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Drawdown',
        value: `${datum.drawdown.toFixed(2)}%`,
      }),
    },
  };

  const monthlyPnLConfig = {
    data: tradingData.monthlyPnL,
    xField: 'month',
    yField: 'pnl',
    color: (datum: any) => datum.pnl >= 0 ? '#52c41a' : '#ff4d4f',
    tooltip: {
      formatter: (datum: any) => ({
        name: 'PnL',
        value: `$${datum.pnl.toLocaleString()} (${datum.trades} trades)`,
      }),
    },
  };

  const tradeDistributionConfig = {
    data: tradingData.tradeDistribution,
    xField: 'range',
    yField: 'count',
    color: (datum: any) => datum.color,
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Trades',
        value: `${datum.count} trades`,
      }),
    },
  };

  const assetColumns = [
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      render: (asset: string) => <Text strong>{asset}</Text>,
    },
    {
      title: 'Trades',
      dataIndex: 'trades',
      key: 'trades',
      align: 'center' as const,
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'right' as const,
      render: (rate: number) => (
        <div>
          <Text>{rate.toFixed(1)}%</Text>
          <Progress 
            percent={rate} 
            size="small" 
            showInfo={false}
            strokeColor={rate >= 60 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'}
          />
        </div>
      ),
    },
    {
      title: 'PnL',
      dataIndex: 'pnL',
      key: 'pnL',
      align: 'right' as const,
      render: (pnl: number) => (
        <Text className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Avg Return',
      dataIndex: 'avgReturn',
      key: 'avgReturn',
      align: 'right' as const,
      render: (return_: number) => (
        <Text className={return_ >= 0 ? 'text-green-600' : 'text-red-600'}>
          {return_ >= 0 ? '+' : ''}{return_.toFixed(1)}%
        </Text>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview */}
      <Row gutter={16}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Total Trades"
              value={tradingData.performance.totalTrades}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Win Rate"
              value={tradingData.performance.winRate}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: tradingData.performance.winRate >= 60 ? '#3f8600' : 
                       tradingData.performance.winRate >= 50 ? '#faad14' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Total PnL"
              value={tradingData.performance.totalPnL}
              precision={0}
              // prefix="$"
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Profit Factor"
              value={tradingData.performance.profitFactor}
              precision={2}
              valueStyle={{ 
                color: tradingData.performance.profitFactor >= 1.5 ? '#3f8600' : 
                       tradingData.performance.profitFactor >= 1 ? '#faad14' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Sharpe Ratio"
              value={tradingData.performance.sharpeRatio}
              precision={2}
              valueStyle={{ 
                color: tradingData.performance.sharpeRatio >= 1.5 ? '#3f8600' : 
                       tradingData.performance.sharpeRatio >= 1 ? '#faad14' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Max Drawdown"
              value={Math.abs(tradingData.performance.maxDrawdown)}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Best Trade"
              value={tradingData.performance.bestTrade}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Avg Hold Time"
              value={tradingData.performance.avgHoldTime}
              precision={1}
              suffix="h"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Equity Curve */}
      <Card 
        title="Equity Curve" 
        size="small"
        extra={
          <Select
            value={timeRange}
            onChange={setTimeRange}
            size="small"
            style={{ width: 80 }}
          >
            <Option value="1W">1W</Option>
            <Option value="1M">1M</Option>
            <Option value="3M">3M</Option>
            <Option value="1Y">1Y</Option>
          </Select>
        }
      >
        <Line {...equityChartConfig} height={300} />
      </Card>

      {/* Drawdown Analysis */}
      <Card title="Drawdown Analysis" size="small">
        <Area {...drawdownChartConfig} height={200} />
      </Card>

      <Row gutter={16}>
        {/* Monthly PnL */}
        <Col xs={24} lg={12}>
          <Card title="Monthly Performance" size="small">
            <Column {...monthlyPnLConfig} height={250} />
          </Card>
        </Col>

        {/* Trade Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Trade PnL Distribution" size="small">
            <Column {...tradeDistributionConfig} height={250} />
          </Card>
        </Col>
      </Row>

      {/* Asset Performance */}
      <Card title="Asset Performance" size="small">
        <Table
          columns={assetColumns}
          dataSource={tradingData.assetPerformance}
          rowKey="asset"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Trading Insights */}
      <Card title="Trading Insights" size="small">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Alert
              message="Strong Performance"
              description={`Your win rate of ${tradingData.performance.winRate.toFixed(1)}% is above average. Keep following your strategy.`}
              type="success"
              showIcon
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="Risk Management"
              description={`Max drawdown of ${Math.abs(tradingData.performance.maxDrawdown)}% is within acceptable limits.`}
              type="info"
              showIcon
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="Best Asset"
              description="SOL shows the highest win rate (75%) and average return (4.2%). Consider increasing allocation."
              type="warning"
              showIcon
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
