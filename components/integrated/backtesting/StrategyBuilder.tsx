// File: components/integrated/backtesting/StrategyBuilder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Row,
  Col,
  InputNumber,
  Switch,
  Alert,
  Tabs,
  Tag,
  Tooltip,
  Modal,
  List
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useNotification } from '../../../contexts/integrated/NotificationContext';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface StrategyBuilderProps {
  onStrategyCreate?: (strategy: any) => void;
  onStrategyTest?: (strategy: any) => void;
  className?: string;
}

interface StrategyCondition {
  id: string;
  indicator: string;
  operator: string;
  value: number | string;
  timeframe?: string;
}

interface Strategy {
  id?: string;
  name: string;
  description: string;
  type: 'trend_following' | 'mean_reversion' | 'momentum' | 'custom';
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    maxPositions: number;
  };
  parameters: Record<string, any>;
}

const STRATEGY_TEMPLATES = {
  sma_crossover: {
    name: 'SMA Crossover',
    description: 'Simple Moving Average crossover strategy',
    type: 'trend_following' as const,
    entryConditions: [
      { id: '1', indicator: 'SMA_FAST', operator: 'crosses_above', value: 'SMA_SLOW', timeframe: '1h' }
    ],
    exitConditions: [
      { id: '2', indicator: 'SMA_FAST', operator: 'crosses_below', value: 'SMA_SLOW', timeframe: '1h' }
    ],
    parameters: { sma_fast: 10, sma_slow: 30 }
  },
  rsi_oversold: {
    name: 'RSI Oversold/Overbought',
    description: 'RSI mean reversion strategy',
    type: 'mean_reversion' as const,
    entryConditions: [
      { id: '1', indicator: 'RSI', operator: 'less_than', value: 30, timeframe: '1h' }
    ],
    exitConditions: [
      { id: '2', indicator: 'RSI', operator: 'greater_than', value: 70, timeframe: '1h' }
    ],
    parameters: { rsi_period: 14 }
  },
  macd_momentum: {
    name: 'MACD Momentum',
    description: 'MACD momentum strategy',
    type: 'momentum' as const,
    entryConditions: [
      { id: '1', indicator: 'MACD_LINE', operator: 'crosses_above', value: 'MACD_SIGNAL', timeframe: '1h' },
      { id: '2', indicator: 'MACD_HISTOGRAM', operator: 'greater_than', value: 0, timeframe: '1h' }
    ],
    exitConditions: [
      { id: '3', indicator: 'MACD_LINE', operator: 'crosses_below', value: 'MACD_SIGNAL', timeframe: '1h' }
    ],
    parameters: { macd_fast: 12, macd_slow: 26, macd_signal: 9 }
  }
};

const INDICATORS = [
  { value: 'SMA', label: 'Simple Moving Average' },
  { value: 'EMA', label: 'Exponential Moving Average' },
  { value: 'RSI', label: 'Relative Strength Index' },
  { value: 'MACD_LINE', label: 'MACD Line' },
  { value: 'MACD_SIGNAL', label: 'MACD Signal' },
  { value: 'MACD_HISTOGRAM', label: 'MACD Histogram' },
  { value: 'BOLLINGER_UPPER', label: 'Bollinger Upper' },
  { value: 'BOLLINGER_LOWER', label: 'Bollinger Lower' },
  { value: 'STOCHASTIC_K', label: 'Stochastic %K' },
  { value: 'STOCHASTIC_D', label: 'Stochastic %D' },
  { value: 'PRICE', label: 'Price' },
  { value: 'VOLUME', label: 'Volume' }
];

const OPERATORS = [
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'equals', label: '=' },
  { value: 'crosses_above', label: 'Crosses Above' },
  { value: 'crosses_below', label: 'Crosses Below' },
  { value: 'between', label: 'Between' }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' }
];

export default function StrategyBuilder({ 
  onStrategyCreate, 
  onStrategyTest,
  className = '' 
}: StrategyBuilderProps) {
  const [form] = Form.useForm();
  const { addNotification } = useNotification();
  
  const [strategy, setStrategy] = useState<Strategy>({
    name: '',
    description: '',
    type: 'custom',
    entryConditions: [],
    exitConditions: [],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 4,
      positionSize: 10,
      maxPositions: 3
    },
    parameters: {}
  });
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition: StrategyCondition = {
      id: Date.now().toString(),
      indicator: 'SMA',
      operator: 'greater_than',
      value: 0,
      timeframe: '1h'
    };
    
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: [...prev.entryConditions, newCondition]
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: [...prev.exitConditions, newCondition]
      }));
    }
  };

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: prev.entryConditions.filter(c => c.id !== id)
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: prev.exitConditions.filter(c => c.id !== id)
      }));
    }
  };

  const updateCondition = (type: 'entry' | 'exit', id: string, field: string, value: any) => {
    const updateConditions = (conditions: StrategyCondition[]) =>
      conditions.map(c => c.id === id ? { ...c, [field]: value } : c);
    
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: updateConditions(prev.entryConditions)
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: updateConditions(prev.exitConditions)
      }));
    }
  };

  const loadTemplate = (templateKey: string) => {
    const template = STRATEGY_TEMPLATES[templateKey as keyof typeof STRATEGY_TEMPLATES];
    if (template) {
      setStrategy(prev => ({
        ...prev,
        ...template,
        riskManagement: prev.riskManagement // Keep current risk management
      }));
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        type: template.type
      });
      setShowTemplates(false);
      
      addNotification({
        type: 'success',
        title: 'Template Loaded',
        message: `${template.name} template loaded successfully`,
        category: 'backtesting',
        priority: 'medium',
        persistent: false,
      });
    }
  };

  const validateStrategy = () => {
    if (!strategy.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Strategy name is required',
        category: 'backtesting',
        priority: 'high',
        persistent: true,
      });
      return false;
    }
    
    if (strategy.entryConditions.length === 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'At least one entry condition is required',
        category: 'backtesting',
        priority: 'high',
        persistent: true,
      });
      return false;
    }
    
    return true;
  };

  const handleSaveStrategy = () => {
    if (!validateStrategy()) return;
    
    const strategyToSave = {
      ...strategy,
      id: strategy.id || Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    onStrategyCreate?.(strategyToSave);
    
    addNotification({
      type: 'success',
      title: 'Strategy Saved',
      message: `Strategy "${strategy.name}" saved successfully`,
      category: 'backtesting',
      priority: 'medium',
      persistent: false,
    });
  };

  const handleTestStrategy = () => {
    if (!validateStrategy()) return;
    
    onStrategyTest?.(strategy);
    
    addNotification({
      type: 'info',
      title: 'Strategy Test Started',
      message: `Testing strategy "${strategy.name}"`,
      category: 'backtesting',
      priority: 'medium',
      persistent: false,
    });
  };

  const renderCondition = (condition: StrategyCondition, type: 'entry' | 'exit', index: number) => (
    <Card key={condition.id} size="small" className="mb-3">
      <Row gutter={16} align="middle">
        <Col span={5}>
          <Select
            value={condition.indicator}
            onChange={(value) => updateCondition(type, condition.id, 'indicator', value)}
            className="w-full"
            size="small"
          >
            {INDICATORS.map(ind => (
              <Option key={ind.value} value={ind.value}>{ind.label}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            value={condition.operator}
            onChange={(value) => updateCondition(type, condition.id, 'operator', value)}
            className="w-full"
            size="small"
          >
            {OPERATORS.map(op => (
              <Option key={op.value} value={op.value}>{op.label}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <InputNumber
            value={condition.value as number}
            onChange={(value) => updateCondition(type, condition.id, 'value', value)}
            className="w-full"
            size="small"
            placeholder="Value"
          />
        </Col>
        <Col span={4}>
          <Select
            value={condition.timeframe}
            onChange={(value) => updateCondition(type, condition.id, 'timeframe', value)}
            className="w-full"
            size="small"
          >
            {TIMEFRAMES.map(tf => (
              <Option key={tf.value} value={tf.value}>{tf.label}</Option>
            ))}
          </Select>
        </Col>
        <Col span={2}>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeCondition(type, condition.id)}
          />
        </Col>
      </Row>
    </Card>
  );

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <div className="space-y-4">
          <Form.Item label="Strategy Name" required>
            <Input
              value={strategy.name}
              onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter strategy name"
            />
          </Form.Item>
          
          <Form.Item label="Description">
            <TextArea
              value={strategy.description}
              onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your strategy"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item label="Strategy Type">
            <Select
              value={strategy.type}
              onChange={(value) => setStrategy(prev => ({ ...prev, type: value }))}
              className="w-full"
            >
              <Option value="trend_following">Trend Following</Option>
              <Option value="mean_reversion">Mean Reversion</Option>
              <Option value="momentum">Momentum</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'conditions',
      label: 'Entry/Exit Conditions',
      children: (
        <div className="space-y-6">
          {/* Entry Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Title level={5} className="!mb-0">Entry Conditions</Title>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addCondition('entry')}
              >
                Add Entry Condition
              </Button>
            </div>
            {strategy.entryConditions.length === 0 ? (
              <Alert
                message="No entry conditions defined"
                description="Add at least one entry condition to define when to enter trades"
                type="info"
                showIcon
              />
            ) : (
              strategy.entryConditions.map((condition, index) =>
                renderCondition(condition, 'entry', index)
              )
            )}
          </div>

          <Divider />

          {/* Exit Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Title level={5} className="!mb-0">Exit Conditions</Title>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addCondition('exit')}
              >
                Add Exit Condition
              </Button>
            </div>
            {strategy.exitConditions.length === 0 ? (
              <Alert
                message="No exit conditions defined"
                description="Exit conditions are optional. If not defined, only risk management rules will be used"
                type="warning"
                showIcon
              />
            ) : (
              strategy.exitConditions.map((condition, index) =>
                renderCondition(condition, 'exit', index)
              )
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'risk',
      label: 'Risk Management',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Stop Loss (%)">
              <InputNumber
                value={strategy.riskManagement.stopLoss}
                onChange={(value) => setStrategy(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, stopLoss: value || 0 }
                }))}
                min={0}
                max={50}
                step={0.1}
                className="w-full"
                suffix="%"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Take Profit (%)">
              <InputNumber
                value={strategy.riskManagement.takeProfit}
                onChange={(value) => setStrategy(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, takeProfit: value || 0 }
                }))}
                min={0}
                max={100}
                step={0.1}
                className="w-full"
                suffix="%"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Position Size (%)">
              <InputNumber
                value={strategy.riskManagement.positionSize}
                onChange={(value) => setStrategy(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, positionSize: value || 0 }
                }))}
                min={1}
                max={100}
                step={1}
                className="w-full"
                suffix="%"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Max Positions">
              <InputNumber
                value={strategy.riskManagement.maxPositions}
                onChange={(value) => setStrategy(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, maxPositions: value || 1 }
                }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className={`${className}`}>
      <Card 
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">Strategy Builder</Title>
            <Space>
              <Button
                icon={<BulbOutlined />}
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTestStrategy}
              >
                Test Strategy
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveStrategy}
              >
                Save Strategy
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Form>
      </Card>

      {/* Templates Modal */}
      <Modal
        title="Strategy Templates"
        open={showTemplates}
        onCancel={() => setShowTemplates(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={Object.entries(STRATEGY_TEMPLATES)}
          renderItem={([key, template]) => (
            <List.Item
              actions={[
                <Button
                  key="load"
                  type="primary"
                  size="small"
                  onClick={() => loadTemplate(key)}
                >
                  Load Template
                </Button>
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={template.description}
              />
              <Tag color="blue">{template.type.replace('_', ' ')}</Tag>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
