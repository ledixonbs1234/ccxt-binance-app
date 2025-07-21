// File: components/integrated/analytics/AnalyticsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Statistic, 
  Typography, 
  Space,
  Button,
  Alert,
  Progress,
  Tag,
  Tooltip,
  Switch,
  Select
} from 'antd';
import {
  DashboardOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  BellOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Gauge } from '@ant-design/plots';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';
import MarketAnalytics from './MarketAnalytics';
import TradingAnalytics from './TradingAnalytics';
import PortfolioAnalytics from './PortfolioAnalytics';

const { Title, Text } = Typography;
const { Option } = Select;

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const { addNotification } = useNotification();
  const { state: marketState } = useMarket();
  const { state: tradingState } = useEnhancedTrading();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('1M');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock analytics data
  const [analyticsData, setAnalyticsData] = useState({
    portfolio: {
      totalValue: 125000,
      totalReturn: 15.2,
      dailyChange: 2.1,
      weeklyChange: -1.5,
      monthlyChange: 8.3,
      sharpeRatio: 1.85,
      maxDrawdown: -8.5,
      volatility: 12.3,
      beta: 0.95
    },
    positions: [
      { symbol: 'BTC', value: 45000, allocation: 36, pnl: 12.5, risk: 'High' },
      { symbol: 'ETH', value: 32000, allocation: 25.6, pnl: 8.2, risk: 'High' },
      { symbol: 'ADA', value: 18000, allocation: 14.4, pnl: -2.1, risk: 'Medium' },
      { symbol: 'DOT', value: 15000, allocation: 12, pnl: 5.8, risk: 'Medium' },
      { symbol: 'LINK', value: 15000, allocation: 12, pnl: 3.2, risk: 'Medium' }
    ],
    performance: generatePerformanceData(),
    riskMetrics: {
      var95: -2.8,
      var99: -4.2,
      expectedShortfall: -5.1,
      correlationBTC: 0.85,
      concentrationRisk: 'Medium'
    }
  });

  function generatePerformanceData() {
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    let value = 100000;
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate realistic portfolio growth with volatility
      const dailyReturn = (Math.random() - 0.45) * 0.03; // Slight positive bias
      value *= (1 + dailyReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        return: ((value - 100000) / 100000) * 100
      });
    }
    return data;
  }

  const performanceChartConfig = {
    data: analyticsData.performance,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 2,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: 'Portfolio Value',
        value: `$${datum.value.toLocaleString()}`,
      }),
    },
    annotations: [
      {
        type: 'line',
        start: ['min', 100000],
        end: ['max', 100000],
        style: {
          stroke: '#52c41a',
          lineDash: [4, 4],
        },
      },
    ],
  };

  const allocationChartConfig = {
    data: analyticsData.positions.map(pos => ({
      type: pos.symbol,
      value: pos.allocation
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  const riskGaugeConfig = {
    percent: Math.abs(analyticsData.portfolio.maxDrawdown) / 20, // Scale to 0-1
    color: ['#30BF78', '#FAAD14', '#F4664A'],
    innerRadius: 0.75,
    radius: 0.95,
    statistic: {
      title: {
        formatter: () => 'Risk Level',
        style: { fontSize: '14px' },
      },
      content: {
        formatter: () => `${Math.abs(analyticsData.portfolio.maxDrawdown)}%`,
        style: { fontSize: '20px', fontWeight: 'bold' },
      },
    },
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined />
          Overview
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Key Metrics */}
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Portfolio Value"
                  value={analyticsData.portfolio.totalValue}
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
                  value={analyticsData.portfolio.totalReturn}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Daily Change"
                  value={analyticsData.portfolio.dailyChange}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: analyticsData.portfolio.dailyChange >= 0 ? '#3f8600' : '#cf1322' 
                  }}
                  prefix={
                    analyticsData.portfolio.dailyChange >= 0 ?
                    <RiseOutlined /> : <FallOutlined />
                  }
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="Sharpe Ratio"
                  value={analyticsData.portfolio.sharpeRatio}
                  precision={2}
                  valueStyle={{ 
                    color: analyticsData.portfolio.sharpeRatio >= 1.5 ? '#3f8600' : 
                           analyticsData.portfolio.sharpeRatio >= 1 ? '#faad14' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Chart */}
          <Card title="Portfolio Performance" size="small">
            <Line {...performanceChartConfig} height={300} />
          </Card>

          {/* Portfolio Allocation & Risk */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title="Asset Allocation" size="small">
                <Pie {...allocationChartConfig} height={250} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Risk Assessment" size="small">
                <div className="space-y-4">
                  <Gauge {...riskGaugeConfig} height={200} />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {analyticsData.portfolio.maxDrawdown}%
                      </div>
                      <div className="text-sm text-gray-500">Max Drawdown</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {analyticsData.portfolio.volatility}%
                      </div>
                      <div className="text-sm text-gray-500">Volatility</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Top Positions */}
          <Card title="Top Positions" size="small">
            <div className="space-y-3">
              {analyticsData.positions.map((position, index) => (
                <div key={position.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{position.symbol}</div>
                      <div className="text-sm text-gray-500">
                        ${position.value.toLocaleString()} ({position.allocation}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl}%
                    </div>
                    <Tag color={
                      position.risk === 'High' ? 'red' : 
                      position.risk === 'Medium' ? 'orange' : 'green'
                    }>
                      {position.risk}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'market',
      label: 'Market Analysis',
      children: <MarketAnalytics />,
    },
    {
      key: 'trading',
      label: 'Trading Analytics',
      children: <TradingAnalytics />,
    },
    {
      key: 'portfolio',
      label: 'Portfolio Analysis',
      children: <PortfolioAnalytics />,
    },
  ];

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate data updates
      setAnalyticsData(prev => ({
        ...prev,
        portfolio: {
          ...prev.portfolio,
          dailyChange: prev.portfolio.dailyChange + (Math.random() - 0.5) * 0.5,
          totalValue: prev.portfolio.totalValue * (1 + (Math.random() - 0.5) * 0.001)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      <Card 
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">Analytics Dashboard</Title>
            <Space>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                size="small"
                style={{ width: 80 }}
              >
                <Option value="1D">1D</Option>
                <Option value="1W">1W</Option>
                <Option value="1M">1M</Option>
                <Option value="3M">3M</Option>
                <Option value="1Y">1Y</Option>
              </Select>
              
              <Tooltip title="Auto Refresh">
                <Switch
                  size="small"
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  checkedChildren="Auto"
                  unCheckedChildren="Manual"
                />
              </Tooltip>
              
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  addNotification({
                    type: 'success',
                    title: 'Data Refreshed',
                    message: 'Analytics data updated successfully',
                    category: 'system',
                    priority: 'low',
                    persistent: false,
                  });
                }}
              />
              
              <Button
                type="text"
                size="small"
                icon={<ExportOutlined />}
                onClick={() => {
                  addNotification({
                    type: 'info',
                    title: 'Export Started',
                    message: 'Analytics report is being generated',
                    category: 'system',
                    priority: 'medium',
                    persistent: false,
                  });
                }}
              />
              
              <Button
                type="text"
                size="small"
                icon={<FullscreenOutlined />}
                onClick={() => setIsFullscreen(!isFullscreen)}
              />
            </Space>
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {isFullscreen && (
        <div className="fixed bottom-4 right-4 z-60">
          <Button
            type="primary"
            shape="circle"
            icon={<FullscreenOutlined />}
            onClick={() => setIsFullscreen(false)}
            size="large"
          />
        </div>
      )}
    </div>
  );
}
