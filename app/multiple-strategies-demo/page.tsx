'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Select,
  InputNumber,
  Form,
  Alert,
  Divider,
  Tag,
  Table,
  Progress,
  Statistic
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SwapOutlined,
  TrendingUpOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { enhancedTrailingStopService } from '@/lib/enhancedTrailingStopService';
import { TrailingStopStrategy, TrailingStopPosition } from '@/types/trailingStop';
import StrategySwitchingPanel from '@/components/StrategySwitchingPanel';
import StrategySelector from '@/components/StrategySelector';
import StrategyConfigPanel from '@/components/StrategyConfigPanel';
import PageContainer from '@/components/PageContainer';

const { Text } = Typography;
const { Option } = Select;

const STRATEGY_NAMES: Record<TrailingStopStrategy, string> = {
  'percentage': 'Percentage',
  'atr': 'ATR',
  'support_resistance': 'Support/Resistance',
  'dynamic': 'Dynamic',
  'hybrid': 'Hybrid',
  'fibonacci': 'Fibonacci',
  'bollinger_bands': 'Bollinger Bands',
  'volume_profile': 'Volume Profile',
  'smart_money': 'Smart Money',
  'ichimoku': 'Ichimoku',
  'pivot_points': 'Pivot Points'
};

export default function MultipleStrategiesDemoPage() {
  const [positions, setPositions] = useState<TrailingStopPosition[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<TrailingStopStrategy>('dynamic');
  const [strategyConfig, setStrategyConfig] = useState<any>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadPositions = () => {
    const activePositions = enhancedTrailingStopService.getActivePositions();
    setPositions(activePositions);
    setIsMonitoring(enhancedTrailingStopService.getServiceStats().isMonitoring);
  };

  const handleCreatePosition = async () => {
    try {
      const values = await form.validateFields();
      
      await enhancedTrailingStopService.createPositionWithStrategy({
        symbol: values.symbol,
        side: values.side,
        quantity: values.quantity,
        strategy: selectedStrategy,
        strategyConfig: {
          ...strategyConfig,
          trailingPercent: values.trailingPercent,
          maxLossPercent: values.maxLossPercent
        },
        maxLossPercent: values.maxLossPercent,
        accountBalance: values.accountBalance,
        riskPercent: values.riskPercent
      });

      loadPositions();
      form.resetFields();
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  };

  const handleStartMonitoring = () => {
    enhancedTrailingStopService.startMonitoring();
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    enhancedTrailingStopService.stopMonitoring();
    setIsMonitoring(false);
  };

  const getStrategyColor = (strategy: TrailingStopStrategy) => {
    const colors: Record<TrailingStopStrategy, string> = {
      'percentage': 'blue',
      'atr': 'green',
      'support_resistance': 'orange',
      'dynamic': 'purple',
      'hybrid': 'magenta',
      'fibonacci': 'gold',
      'bollinger_bands': 'cyan',
      'volume_profile': 'lime',
      'smart_money': 'red',
      'ichimoku': 'geekblue',
      'pivot_points': 'volcano'
    };
    return colors[strategy] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'active': 'green',
      'triggered': 'red',
      'cancelled': 'default',
      'error': 'red'
    };
    return colors[status] || 'default';
  };

  const positionsColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => <Text strong>{symbol}</Text>
    },
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy: TrailingStopStrategy) => (
        <Tag color={getStrategyColor(strategy)}>
          {STRATEGY_NAMES[strategy]}
        </Tag>
      )
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      render: (side: string) => (
        <Tag color={side === 'buy' ? 'green' : 'red'}>
          {side.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Entry Price',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (price: number) => price.toFixed(4)
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => price.toFixed(4)
    },
    {
      title: 'Stop Loss',
      dataIndex: 'stopLossPrice',
      key: 'stopLossPrice',
      render: (price: number) => (
        <Text style={{ color: '#ef4444' }}>{price.toFixed(4)}</Text>
      )
    },
    {
      title: 'P&L',
      dataIndex: 'unrealizedPnLPercent',
      key: 'unrealizedPnLPercent',
      render: (pnl: number) => (
        <Text style={{ color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ];

  const serviceStats = enhancedTrailingStopService.getServiceStats();

  return (
    <PageContainer
      title="🎯 Multiple Strategies Demo"
      subtitle="Demo hệ thống trailing stop với nhiều chiến lược và tự động chuyển đổi strategy dựa trên điều kiện thị trường"
    >
      <Alert
        message="Advanced Trailing Stop Strategies"
        description="Demo hệ thống trailing stop với nhiều chiến lược và tự động chuyển đổi strategy dựa trên điều kiện thị trường"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {/* Control Panel */}
        <Col span={24}>
          <Card title="🎛️ Control Panel">
            <Space size="large">
              <Statistic title="Active Positions" value={serviceStats.activePositions} />
              <Statistic title="Pending Positions" value={serviceStats.pendingPositions} />
              <Statistic title="Total Alerts" value={serviceStats.totalAlerts} />
              <Statistic 
                title="Monitoring Status" 
                value={isMonitoring ? 'RUNNING' : 'STOPPED'} 
                valueStyle={{ color: isMonitoring ? '#52c41a' : '#ff4d4f' }}
              />
            </Space>
            
            <Divider />
            
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartMonitoring}
                disabled={isMonitoring}
              >
                Start Monitoring
              </Button>
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handleStopMonitoring}
                disabled={!isMonitoring}
              >
                Stop Monitoring
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Create Position */}
        <Col span={12}>
          <Card title="➕ Create New Position">
            <Form form={form} layout="vertical">
              <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
                <Select placeholder="Select symbol">
                  <Option value="BTC/USDT">BTC/USDT</Option>
                  <Option value="ETH/USDT">ETH/USDT</Option>
                  <Option value="PEPE/USDT">PEPE/USDT</Option>
                  <Option value="SOL/USDT">SOL/USDT</Option>
                </Select>
              </Form.Item>

              <Form.Item name="side" label="Side" rules={[{ required: true }]}>
                <Select placeholder="Select side">
                  <Option value="buy">Buy</Option>
                  <Option value="sell">Sell</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="trailingPercent" label="Trailing %" rules={[{ required: true }]}>
                    <InputNumber min={0.1} max={10} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="maxLossPercent" label="Max Loss %" rules={[{ required: true }]}>
                    <InputNumber min={1} max={20} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="riskPercent" label="Risk %" rules={[{ required: true }]}>
                    <InputNumber min={0.5} max={5} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="accountBalance" label="Account Balance" rules={[{ required: true }]}>
                <InputNumber min={100} step={100} style={{ width: '100%' }} />
              </Form.Item>

              <Button type="primary" onClick={handleCreatePosition} block>
                Create Position
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Strategy Selection */}
        <Col span={12}>
          <Card title="🎯 Strategy Selection">
            <StrategySelector
              selectedStrategy={selectedStrategy}
              onStrategyChange={setSelectedStrategy}
              showDescription={true}
            />
            
            <Divider />
            
            <StrategyConfigPanel
              strategy={selectedStrategy}
              config={strategyConfig}
              onConfigChange={setStrategyConfig}
            />
          </Card>
        </Col>

        {/* Active Positions */}
        <Col span={24}>
          <Card title="📊 Active Positions">
            <Table
              dataSource={positions}
              columns={positionsColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        {/* Strategy Switching Management */}
        <Col span={24}>
          <StrategySwitchingPanel />
        </Col>
      </Row>
    </PageContainer>
  );
}
