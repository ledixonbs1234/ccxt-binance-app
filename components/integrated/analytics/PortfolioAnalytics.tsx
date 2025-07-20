// File: components/integrated/analytics/PortfolioAnalytics.tsx
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
  Alert,
  Space,
  Button,
  Tooltip
} from 'antd';
import { 
  PieChartOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Pie, Column, Radar, Treemap } from '@ant-design/plots';

const { Text, Title } = Typography;

interface PortfolioAnalyticsProps {
  className?: string;
}

export default function PortfolioAnalytics({ className = '' }: PortfolioAnalyticsProps) {
  const [analysisType, setAnalysisType] = useState('allocation');

  // Mock portfolio data
  const [portfolioData] = useState({
    overview: {
      totalValue: 125000,
      totalCost: 108500,
      unrealizedPnL: 16500,
      realizedPnL: 8200,
      totalReturn: 15.2,
      diversificationScore: 7.2,
      riskScore: 6.8,
      sharpeRatio: 1.85
    },
    holdings: [
      { 
        asset: 'BTC', 
        value: 45000, 
        cost: 38000, 
        allocation: 36.0, 
        targetAllocation: 35.0,
        pnl: 7000, 
        pnlPercent: 18.4,
        risk: 'High',
        beta: 1.0,
        correlation: 1.0
      },
      { 
        asset: 'ETH', 
        value: 32000, 
        cost: 28500, 
        allocation: 25.6, 
        targetAllocation: 25.0,
        pnl: 3500, 
        pnlPercent: 12.3,
        risk: 'High',
        beta: 1.2,
        correlation: 0.85
      },
      { 
        asset: 'ADA', 
        value: 18000, 
        cost: 19200, 
        allocation: 14.4, 
        targetAllocation: 15.0,
        pnl: -1200, 
        pnlPercent: -6.3,
        risk: 'Medium',
        beta: 0.8,
        correlation: 0.72
      },
      { 
        asset: 'DOT', 
        value: 15000, 
        cost: 13500, 
        allocation: 12.0, 
        targetAllocation: 12.0,
        pnl: 1500, 
        pnlPercent: 11.1,
        risk: 'Medium',
        beta: 0.9,
        correlation: 0.68
      },
      { 
        asset: 'LINK', 
        value: 15000, 
        cost: 13800, 
        allocation: 12.0, 
        targetAllocation: 13.0,
        pnl: 1200, 
        pnlPercent: 8.7,
        risk: 'Medium',
        beta: 0.7,
        correlation: 0.65
      }
    ],
    riskMetrics: {
      portfolioVolatility: 28.5,
      var95: -3.2,
      var99: -4.8,
      expectedShortfall: -6.1,
      maxDrawdown: -15.2,
      correlationRisk: 'High',
      concentrationRisk: 'Medium'
    },
    rebalancing: [
      { asset: 'BTC', current: 36.0, target: 35.0, action: 'Sell', amount: 1250 },
      { asset: 'ETH', current: 25.6, target: 25.0, action: 'Sell', amount: 750 },
      { asset: 'ADA', current: 14.4, target: 15.0, action: 'Buy', amount: 750 },
      { asset: 'LINK', current: 12.0, target: 13.0, action: 'Buy', amount: 1250 }
    ],
    performance: generatePerformanceData()
  });

  function generatePerformanceData() {
    return [
      { metric: 'Return', portfolio: 15.2, benchmark: 12.8, category: 'Performance' },
      { metric: 'Volatility', portfolio: 28.5, benchmark: 32.1, category: 'Risk' },
      { metric: 'Sharpe', portfolio: 1.85, benchmark: 1.42, category: 'Risk-Adjusted' },
      { metric: 'Max DD', portfolio: 15.2, benchmark: 18.9, category: 'Risk' },
      { metric: 'Correlation', portfolio: 0.85, benchmark: 1.0, category: 'Diversification' }
    ];
  }

  const allocationChartConfig = {
    data: portfolioData.holdings.map(h => ({
      type: h.asset,
      value: h.allocation
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [{ type: 'element-active' }],
    legend: { position: 'bottom' as const },
  };

  const performanceComparisonConfig = {
    data: portfolioData.performance.flatMap(p => [
      { metric: p.metric, value: p.portfolio, type: 'Portfolio' },
      { metric: p.metric, value: p.benchmark, type: 'Benchmark' }
    ]),
    xField: 'metric',
    yField: 'value',
    seriesField: 'type',
    color: ['#1890ff', '#52c41a'],
    legend: { position: 'top' as const },
  };

  const riskRadarConfig = {
    data: [
      { metric: 'Volatility', value: 7.2, max: 10 },
      { metric: 'Concentration', value: 6.8, max: 10 },
      { metric: 'Correlation', value: 8.5, max: 10 },
      { metric: 'Liquidity', value: 9.2, max: 10 },
      { metric: 'Market Risk', value: 7.8, max: 10 },
      { metric: 'Credit Risk', value: 3.2, max: 10 }
    ],
    xField: 'metric',
    yField: 'value',
    area: {},
    point: { size: 3 },
  };

  const holdingsColumns = [
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      render: (asset: string) => <Text strong>{asset}</Text>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      align: 'right' as const,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Allocation',
      key: 'allocation',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div>
          <Text>{record.allocation.toFixed(1)}%</Text>
          <div className="mt-1">
            <Progress 
              percent={record.allocation} 
              size="small" 
              showInfo={false}
              strokeColor={Math.abs(record.allocation - record.targetAllocation) <= 1 ? '#52c41a' : '#faad14'}
            />
            <Text type="secondary" className="text-xs">
              Target: {record.targetAllocation}%
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'PnL',
      key: 'pnl',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div>
          <Text className={record.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
            {record.pnl >= 0 ? '+' : ''}${record.pnl.toLocaleString()}
          </Text>
          <div className={`text-xs ${record.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {record.pnlPercent >= 0 ? '+' : ''}{record.pnlPercent.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      title: 'Risk',
      dataIndex: 'risk',
      key: 'risk',
      align: 'center' as const,
      render: (risk: string) => (
        <Tag color={
          risk === 'High' ? 'red' : 
          risk === 'Medium' ? 'orange' : 'green'
        }>
          {risk}
        </Tag>
      ),
    },
    {
      title: 'Beta',
      dataIndex: 'beta',
      key: 'beta',
      align: 'right' as const,
      render: (beta: number) => beta.toFixed(2),
    },
  ];

  const rebalancingColumns = [
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      render: (asset: string) => <Text strong>{asset}</Text>,
    },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current',
      align: 'right' as const,
      render: (current: number) => `${current.toFixed(1)}%`,
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
      align: 'right' as const,
      render: (target: number) => `${target.toFixed(1)}%`,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Tag color={record.action === 'Buy' ? 'green' : 'red'}>
          {record.action} ${record.amount.toLocaleString()}
        </Tag>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Overview */}
      <Row gutter={16}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Total Value"
              value={portfolioData.overview.totalValue}
              precision={0}
              prefix="$"
              formatter={(value) => `$${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Total Return"
              value={portfolioData.overview.totalReturn}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Unrealized PnL"
              value={portfolioData.overview.unrealizedPnL}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Diversification"
              value={portfolioData.overview.diversificationScore}
              precision={1}
              suffix="/10"
              valueStyle={{ 
                color: portfolioData.overview.diversificationScore >= 8 ? '#3f8600' : 
                       portfolioData.overview.diversificationScore >= 6 ? '#faad14' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Asset Allocation */}
        <Col xs={24} lg={12}>
          <Card title="Asset Allocation" size="small">
            <Pie {...allocationChartConfig} height={300} />
          </Card>
        </Col>

        {/* Risk Assessment */}
        <Col xs={24} lg={12}>
          <Card title="Risk Profile" size="small">
            <Radar {...riskRadarConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Performance Comparison */}
      <Card title="Performance vs Benchmark" size="small">
        <Column {...performanceComparisonConfig} height={250} />
      </Card>

      {/* Holdings Table */}
      <Card title="Portfolio Holdings" size="small">
        <Table
          columns={holdingsColumns}
          dataSource={portfolioData.holdings}
          rowKey="asset"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Risk Metrics */}
      <Card title="Risk Metrics" size="small">
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-lg font-semibold text-red-600">
                {portfolioData.riskMetrics.var95.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">VaR (95%)</div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-lg font-semibold text-orange-600">
                {portfolioData.riskMetrics.portfolioVolatility.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Volatility</div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {Math.abs(portfolioData.riskMetrics.maxDrawdown).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Max Drawdown</div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-lg font-semibold text-purple-600">
                {portfolioData.riskMetrics.expectedShortfall.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Expected Shortfall</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Rebalancing Suggestions */}
      <Card 
        title="Rebalancing Suggestions" 
        size="small"
        extra={
          <Button type="primary" size="small">
            Execute Rebalancing
          </Button>
        }
      >
        <Table
          columns={rebalancingColumns}
          dataSource={portfolioData.rebalancing}
          rowKey="asset"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Portfolio Insights */}
      <Card title="Portfolio Insights" size="small">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Alert
              message="Allocation Alert"
              description="BTC allocation is 1% above target. Consider rebalancing to reduce concentration risk."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="Performance"
              description="Portfolio outperforming benchmark by 2.4%. Strong risk-adjusted returns."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="Risk Assessment"
              description="High correlation between assets (0.85). Consider adding uncorrelated assets."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
