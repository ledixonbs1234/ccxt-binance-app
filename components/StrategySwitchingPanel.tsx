'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Switch, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  Form, 
  Select, 
  InputNumber,
  Divider,
  Alert,
  Tooltip,
  Badge
} from 'antd';
import { 
  SettingOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  InfoCircleOutlined,
  SwapOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined
} from '@ant-design/icons';
import { StrategySwitchingService, StrategySwitchingRule, StrategySwitchingEvent } from '@/lib/strategySwitchingService';
import { TrailingStopStrategy } from '@/types/trailingStop';

const { Title, Text } = Typography;
const { Option } = Select;

interface StrategySwitchingPanelProps {
  className?: string;
}

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

export default function StrategySwitchingPanel({ className }: StrategySwitchingPanelProps) {
  const [switchingService] = useState(() => new StrategySwitchingService());
  const [switchingRules, setSwitchingRules] = useState<StrategySwitchingRule[]>([]);
  const [switchingHistory, setSwitchingHistory] = useState<StrategySwitchingEvent[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<StrategySwitchingRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSwitchingRules(switchingService.getSwitchingRules());
    setSwitchingHistory(switchingService.getSwitchingHistory());
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    switchingService.toggleSwitchingRule(ruleId, enabled);
    loadData();
  };

  const handleDeleteRule = (ruleId: string) => {
    switchingService.removeSwitchingRule(ruleId);
    loadData();
  };

  const handleAddRule = () => {
    setEditingRule(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRule = (rule: StrategySwitchingRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setIsModalVisible(true);
  };

  const handleSaveRule = async () => {
    try {
      const values = await form.validateFields();
      
      const rule: StrategySwitchingRule = {
        id: editingRule?.id || `rule_${Date.now()}`,
        name: values.name,
        nameVi: values.nameVi,
        fromStrategy: values.fromStrategy,
        toStrategy: values.toStrategy,
        condition: {
          type: values.conditionType,
          trendStrength: values.trendStrength ? { min: values.trendStrengthMin, max: values.trendStrengthMax } : undefined,
          volatilityLevel: values.volatilityLevel ? { min: values.volatilityMin, max: values.volatilityMax } : undefined,
          unrealizedPnL: values.unrealizedPnL ? { min: values.pnlMin, max: values.pnlMax } : undefined,
          drawdown: values.drawdown ? { max: values.drawdownMax } : undefined,
          timeInPosition: values.timeInPosition ? { min: values.timeMin, max: values.timeMax } : undefined,
          priceMovement: values.priceMovement ? {
            direction: values.priceDirection,
            percentage: values.pricePercentage,
            timeframe: values.priceTimeframe
          } : undefined
        },
        priority: values.priority,
        enabled: values.enabled ?? true
      };

      if (editingRule) {
        // Update existing rule (remove and add)
        switchingService.removeSwitchingRule(editingRule.id);
      }
      
      switchingService.addSwitchingRule(rule);
      loadData();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const getRuleStatusColor = (enabled: boolean) => {
    return enabled ? 'success' : 'default';
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

  const rulesColumns = [
    {
      title: 'Tên Rule',
      dataIndex: 'nameVi',
      key: 'nameVi',
      render: (text: string, record: StrategySwitchingRule) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Priority: {record.priority}
          </Text>
        </Space>
      )
    },
    {
      title: 'Strategy Chuyển đổi',
      key: 'strategies',
      render: (record: StrategySwitchingRule) => (
        <Space>
          <Tag color={getStrategyColor(record.fromStrategy)}>
            {STRATEGY_NAMES[record.fromStrategy]}
          </Tag>
          <SwapOutlined />
          <Tag color={getStrategyColor(record.toStrategy)}>
            {STRATEGY_NAMES[record.toStrategy]}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Điều kiện',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: any) => (
        <Tag color="processing">
          {condition.type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: StrategySwitchingRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (record: StrategySwitchingRule) => (
        <Space>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handleEditRule(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record.id)}
          />
        </Space>
      )
    }
  ];

  const historyColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString('vi-VN')
    },
    {
      title: 'Position ID',
      dataIndex: 'positionId',
      key: 'positionId',
      render: (id: string) => (
        <Text code>{id.substring(0, 8)}...</Text>
      )
    },
    {
      title: 'Strategy Change',
      key: 'strategyChange',
      render: (record: StrategySwitchingEvent) => (
        <Space>
          <Tag color={getStrategyColor(record.fromStrategy)}>
            {STRATEGY_NAMES[record.fromStrategy]}
          </Tag>
          <SwapOutlined />
          <Tag color={getStrategyColor(record.toStrategy)}>
            {STRATEGY_NAMES[record.toStrategy]}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: StrategySwitchingEvent) => {
        const pnl = record.performance.beforeSwitch;
        return (
          <Space>
            {pnl >= 0 ? <TrendingUpOutlined style={{ color: '#52c41a' }} /> : <TrendingDownOutlined style={{ color: '#ff4d4f' }} />}
            <Text style={{ color: pnl >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {pnl.toFixed(2)}%
            </Text>
          </Space>
        );
      }
    }
  ];

  return (
    <div className={className}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                🔄 Strategy Switching Management
              </Title>
              <Tooltip title="Hệ thống tự động chuyển đổi chiến lược trailing stop dựa trên điều kiện thị trường">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRule}
            >
              Thêm Rule
            </Button>
          </Space>
        </Card>

        {/* Statistics */}
        <Card>
          <Space size="large">
            <Badge count={switchingRules.filter(r => r.enabled).length} color="green">
              <Text>Active Rules</Text>
            </Badge>
            <Badge count={switchingRules.filter(r => !r.enabled).length} color="default">
              <Text>Disabled Rules</Text>
            </Badge>
            <Badge count={switchingHistory.length} color="blue">
              <Text>Total Switches</Text>
            </Badge>
          </Space>
        </Card>

        {/* Switching Rules */}
        <Card title="📋 Switching Rules">
          <Table
            dataSource={switchingRules}
            columns={rulesColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Switching History */}
        <Card title="📊 Switching History">
          <Table
            dataSource={switchingHistory.slice(-50)} // Show last 50 events
            columns={historyColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Add/Edit Rule Modal */}
        <Modal
          title={editingRule ? 'Chỉnh sửa Rule' : 'Thêm Rule mới'}
          open={isModalVisible}
          onOk={handleSaveRule}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="nameVi" label="Tên Rule (Tiếng Việt)" rules={[{ required: true }]}>
              <input className="ant-input" placeholder="Ví dụ: Chuyển sang ATR khi xu hướng mạnh" />
            </Form.Item>
            
            <Form.Item name="name" label="Tên Rule (English)" rules={[{ required: true }]}>
              <input className="ant-input" placeholder="Example: Switch to ATR on Strong Trend" />
            </Form.Item>

            <Space style={{ width: '100%' }}>
              <Form.Item name="fromStrategy" label="Từ Strategy" rules={[{ required: true }]}>
                <Select style={{ width: 150 }}>
                  {Object.entries(STRATEGY_NAMES).map(([key, name]) => (
                    <Option key={key} value={key}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="toStrategy" label="Đến Strategy" rules={[{ required: true }]}>
                <Select style={{ width: 150 }}>
                  {Object.entries(STRATEGY_NAMES).map(([key, name]) => (
                    <Option key={key} value={key}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Space>

            <Form.Item name="conditionType" label="Loại điều kiện" rules={[{ required: true }]}>
              <Select>
                <Option value="trend">Trend</Option>
                <Option value="volatility">Volatility</Option>
                <Option value="performance">Performance</Option>
                <Option value="market_condition">Market Condition</Option>
                <Option value="price_action">Price Action</Option>
                <Option value="time">Time</Option>
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
              <InputNumber min={1} max={20} />
            </Form.Item>

            <Alert
              message="Tip"
              description="Priority cao hơn sẽ được kiểm tra trước. Sử dụng priority 15+ cho risk management rules."
              type="info"
              showIcon
            />
          </Form>
        </Modal>
      </Space>
    </div>
  );
}
