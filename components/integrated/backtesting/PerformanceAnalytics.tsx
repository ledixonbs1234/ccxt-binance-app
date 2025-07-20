// File: components/integrated/backtesting/PerformanceAnalytics.tsx
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
  Tabs,
  Alert,
  Space,
  Button,
  Tooltip
} from 'antd';
import { 
  TrendingUpOutlined,
  TrendingDownOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface PerformanceAnalyticsProps {
  results?: any;
  className?: string;
}

export default function PerformanceAnalytics({ 
  results,
  className = '' 
}: PerformanceAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!results) {
    return (
      <Card className={className}>
        <Alert
          message="No Results Available"
          description="Run a backtest to see performance analytics"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const { performance, trades, equity, drawdown } = results;

  // Prepare equity curve data
  const equityData = equity.map((point: any) => ({
    date: point.date,
    value: point.equity,
    type: 'Portfolio'
  }));

  // Add benchmark (buy and hold)
  const benchmarkData = equity.map((point: any, index: number) => ({
    date: point.date,
    value: results.config.initialCapital * (1 + (index / equity.length) * 0.3), // Mock 30% benchmark
    type: 'Benchmark'
  }));

  const combinedEquityData = [...equityData, ...benchmarkData];

  // Prepare drawdown data
  const drawdownData = drawdown.map((point: any) => ({
    date: point.date,
    drawdown: point.drawdown
  }));

  // Prepare monthly returns data
  const monthlyReturns = [];
  for (let i = 0; i < 12; i++) {
    monthlyReturns.push({
      month: dayjs().month(i).format('MMM'),
      return: (Math.random() - 0.4) * 10 // Mock data
    });
  }

  // Prepare trade distribution data
  const tradeDistribution = [
    { range: '< -5%', count: trades.filter((t: any) => t.pnlPercent < -5).length },
    { range: '-5% to -2%', count: trades.filter((t: any) => t.pnlPercent >= -5 && t.pnlPercent < -2).length },
    { range: '-2% to 0%', count: trades.filter((t: any) => t.pnlPercent >= -2 && t.pnlPercent < 0).length },
    { range: '0% to 2%', count: trades.filter((t: any) => t.pnlPercent >= 0 && t.pnlPercent < 2).length },
    { range: '2% to 5%', count: trades.filter((t: any) => t.pnlPercent >= 2 && t.pnlPercent < 5).length },
    { range: '> 5%', count: trades.filter((t: any) => t.pnlPercent >= 5).length },
  ];

  // Win/Loss pie chart data
  const winLossData = [
    { type: 'Winning Trades', value: trades.filter((t: any) => t.pnl > 0).length },
    { type: 'Losing Trades', value: trades.filter((t: any) => t.pnl <= 0).length },
  ];

  const equityConfig = {
    data: combinedEquityData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a'],
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `$${datum.value.toLocaleString()}`,
      }),
    },
  };

  const drawdownConfig = {
    data: drawdownData,
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

  const monthlyReturnsConfig = {
    data: monthlyReturns,
    xField: 'month',
    yField: 'return',
    color: (datum: any) => datum.return >= 0 ? '#52c41a' : '#ff4d4f',
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Return',
        value: `${datum.return.toFixed(2)}%`,
      }),
    },
  };

  const tradeDistributionConfig = {
    data: tradeDistribution,
    xField: 'range',
    yField: 'count',
    color: '#1890ff',
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Trades',
        value: datum.count,
      }),
    },
  };

  const winLossConfig = {
    data: winLossData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: ['#52c41a', '#ff4d4f'],
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: datum.value,
      }),
    },
  };

  const tradeColumns = [
    {
      title: 'Trade #',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Entry Time',
      dataIndex: 'entryTime',
      key: 'entryTime',
      render: (time: string) => dayjs(time).format('MM/DD HH:mm'),
      width: 120,
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      render: (side: string) => (
        <Tag color={side === 'long' ? 'green' : 'red'}>
          {side.toUpperCase()}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Entry Price',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (price: number) => `$${price.toLocaleString()}`,
      align: 'right' as const,
      width: 120,
    },
    {
      title: 'Exit Price',
      dataIndex: 'exitPrice',
      key: 'exitPrice',
      render: (price: number) => `$${price.toLocaleString()}`,
      align: 'right' as const,
      width: 120,
    },
    {
      title: 'PnL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl: number) => (
        <Text className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
        </Text>
      ),
      align: 'right' as const,
      width: 100,
    },
    {
      title: 'PnL %',
      dataIndex: 'pnlPercent',
      key: 'pnlPercent',
      render: (pnl: number) => (
        <Text className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </Text>
      ),
      align: 'right' as const,
      width: 100,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}m`;
      },
      align: 'right' as const,
      width: 100,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div className="space-y-6">
          {/* Key Metrics */}
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Total Return"
                  value={performance.totalReturn}
                  precision={2}
                  suffix="%"
                  valueStyle={{ 
                    color: performance.totalReturn >= 0 ? '#3f8600' : '#cf1322' 
                  }}
                  prefix={performance.totalReturn >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Annualized Return"
                  value={performance.annualizedReturn}
                  precision={2}
                  suffix="%"
                  valueStyle={{ 
                    color: performance.annualizedReturn >= 0 ? '#3f8600' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Sharpe Ratio"
                  value={performance.sharpeRatio}
                  precision={2}
                  valueStyle={{ 
                    color: performance.sharpeRatio >= 1 ? '#3f8600' : 
                           performance.sharpeRatio >= 0.5 ? '#faad14' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Max Drawdown"
                  value={Math.abs(performance.maxDrawdown)}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<TrendingDownOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Win Rate"
                  value={performance.winRate}
                  precision={1}
                  suffix="%"
                />
                <Progress 
                  percent={performance.winRate} 
                  size="small" 
                  strokeColor={performance.winRate >= 50 ? '#52c41a' : '#faad14'}
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Profit Factor"
                  value={performance.profitFactor}
                  precision={2}
                  valueStyle={{ 
                    color: performance.profitFactor >= 1.5 ? '#3f8600' : 
                           performance.profitFactor >= 1 ? '#faad14' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Total Trades"
                  value={performance.totalTrades}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Avg Trade"
                  value={performance.avgTrade}
                  precision={2}
                  suffix="%"
                  valueStyle={{ 
                    color: performance.avgTrade >= 0 ? '#3f8600' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Equity Curve */}
          <Card title="Equity Curve" size="small">
            <Line {...equityConfig} height={300} />
          </Card>

          {/* Drawdown Chart */}
          <Card title="Drawdown" size="small">
            <Line {...drawdownConfig} height={200} />
          </Card>
        </div>
      ),
    },
    {
      key: 'analysis',
      label: 'Analysis',
      children: (
        <div className="space-y-6">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title="Monthly Returns" size="small">
                <Column {...monthlyReturnsConfig} height={250} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Win/Loss Distribution" size="small">
                <Pie {...winLossConfig} height={250} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Card title="Trade PnL Distribution" size="small">
                <Column {...tradeDistributionConfig} height={250} />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'trades',
      label: 'Trade History',
      children: (
        <Card title="All Trades" size="small">
          <Table
            columns={tradeColumns}
            dataSource={trades}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} trades`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className={`${className}`}>
      <Card 
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">Performance Analytics</Title>
            <Space>
              <Tooltip title="Export Results">
                <Button icon={<DownloadOutlined />} size="small">
                  Export
                </Button>
              </Tooltip>
              <Tooltip title="Share Results">
                <Button icon={<ShareAltOutlined />} size="small">
                  Share
                </Button>
              </Tooltip>
            </Space>
          </div>
        }
        extra={
          <Tag color="blue">
            {results.strategy?.name || 'Strategy Results'}
          </Tag>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}
