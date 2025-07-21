'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Select, 
  Switch, 
  Slider, 
  Space, 
  Typography, 
  Row, 
  Col,
  Divider,
  Alert,
  Tooltip,
  Badge
} from 'antd';
import { 
  InfoCircleOutlined, 
  CalculatorOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { TrailingStopStrategy, TrailingStopPosition } from '../types/trailingStop';

const { Title, Text } = Typography;
const { Option } = Select;

interface StrategyConfigPanelProps {
  strategy: TrailingStopStrategy;
  position?: Partial<TrailingStopPosition>;
  onChange: (config: StrategyConfig) => void;
  currentPrice?: number;
  symbol?: string;
  showPreview?: boolean;
}

export interface StrategyConfig {
  strategy: TrailingStopStrategy;
  trailingPercent: number;
  
  // ATR Configuration
  atrMultiplier?: number;
  atrPeriod?: number;
  
  // Fibonacci Configuration
  fibonacciLevel?: number;
  fibonacciLookback?: number;
  
  // Bollinger Bands Configuration
  bollingerPeriod?: number;
  bollingerStdDev?: number;
  
  // Volume Profile Configuration
  volumeProfilePeriod?: number;
  valueAreaPercent?: number;
  
  // Smart Money Configuration
  smartMoneyStructure?: 'bos' | 'choch' | 'liquidity';
  orderBlockPeriod?: number;
  
  // Ichimoku Configuration
  ichimokuTenkan?: number;
  ichimokuKijun?: number;
  ichimokuSenkou?: number;
  
  // Pivot Points Configuration
  pivotType?: 'standard' | 'fibonacci' | 'woodie' | 'camarilla';
  pivotPeriod?: 'daily' | 'weekly' | 'monthly';
  
  // Risk Management
  maxLossPercent?: number;
  profitProtectionPercent?: number;
}

const DEFAULT_CONFIGS: Record<TrailingStopStrategy, Partial<StrategyConfig>> = {
  percentage: {
    trailingPercent: 2.0,
    maxLossPercent: 5.0
  },
  atr: {
    trailingPercent: 1.5,
    atrMultiplier: 2.0,
    atrPeriod: 14,
    maxLossPercent: 5.0
  },
  fibonacci: {
    trailingPercent: 1.0,
    fibonacciLevel: 0.618,
    fibonacciLookback: 20,
    maxLossPercent: 4.0
  },
  bollinger_bands: {
    trailingPercent: 1.5,
    bollingerPeriod: 20,
    bollingerStdDev: 2.0,
    maxLossPercent: 4.5
  },
  volume_profile: {
    trailingPercent: 1.2,
    volumeProfilePeriod: 50,
    valueAreaPercent: 70,
    maxLossPercent: 4.0
  },
  smart_money: {
    trailingPercent: 0.8,
    smartMoneyStructure: 'bos',
    orderBlockPeriod: 10,
    maxLossPercent: 3.5
  },
  ichimoku: {
    trailingPercent: 1.5,
    ichimokuTenkan: 9,
    ichimokuKijun: 26,
    ichimokuSenkou: 52,
    maxLossPercent: 4.5
  },
  pivot_points: {
    trailingPercent: 1.8,
    pivotType: 'standard',
    pivotPeriod: 'daily',
    maxLossPercent: 5.0
  },
  support_resistance: {
    trailingPercent: 2.0,
    maxLossPercent: 5.0
  },
  dynamic: {
    trailingPercent: 1.5,
    atrMultiplier: 1.5,
    atrPeriod: 14,
    maxLossPercent: 4.0
  },
  hybrid: {
    trailingPercent: 1.2,
    atrMultiplier: 1.8,
    atrPeriod: 14,
    fibonacciLevel: 0.618,
    maxLossPercent: 3.5
  }
};

export default function StrategyConfigPanel({
  strategy,
  position,
  onChange,
  currentPrice = 0,
  symbol = '',
  showPreview = true
}: StrategyConfigPanelProps) {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<StrategyConfig>({
    strategy,
    ...DEFAULT_CONFIGS[strategy]
  } as StrategyConfig);

  useEffect(() => {
    const newConfig = {
      strategy,
      ...DEFAULT_CONFIGS[strategy]
    } as StrategyConfig;
    setConfig(newConfig);
    form.setFieldsValue(newConfig);
    onChange(newConfig);
  }, [strategy, form, onChange]);

  const handleFormChange = (changedValues: any, allValues: any) => {
    const newConfig = { ...config, ...changedValues };
    setConfig(newConfig);
    onChange(newConfig);
  };

  const calculatePreview = () => {
    if (!currentPrice || currentPrice === 0) return null;
    
    const stopLoss = currentPrice * (1 - (config.trailingPercent || 2) / 100);
    const maxLoss = currentPrice * (1 - (config.maxLossPercent || 5) / 100);
    
    return {
      stopLoss,
      maxLoss,
      trailingDistance: currentPrice - stopLoss,
      maxLossDistance: currentPrice - maxLoss
    };
  };

  const preview = calculatePreview();

  const renderStrategySpecificFields = () => {
    switch (strategy) {
      case 'atr':
      case 'dynamic':
        return (
          <>
            <Form.Item
              name="atrPeriod"
              label="ATR Period"
              tooltip="Số chu kỳ để tính ATR"
            >
              <InputNumber min={5} max={50} step={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="atrMultiplier"
              label="ATR Multiplier"
              tooltip="Hệ số nhân với ATR"
            >
              <Slider min={0.5} max={5} step={0.1} marks={{ 1: '1x', 2: '2x', 3: '3x' }} />
            </Form.Item>
          </>
        );

      case 'fibonacci':
        return (
          <>
            <Form.Item
              name="fibonacciLevel"
              label="Fibonacci Level"
              tooltip="Mức Fibonacci để sử dụng"
            >
              <Select style={{ width: '100%' }}>
                <Option value={0.236}>23.6%</Option>
                <Option value={0.382}>38.2%</Option>
                <Option value={0.5}>50.0%</Option>
                <Option value={0.618}>61.8%</Option>
                <Option value={0.786}>78.6%</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="fibonacciLookback"
              label="Lookback Period"
              tooltip="Số chu kỳ để tìm swing high/low"
            >
              <InputNumber min={10} max={100} step={5} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );

      case 'bollinger_bands':
        return (
          <>
            <Form.Item
              name="bollingerPeriod"
              label="Bollinger Period"
              tooltip="Chu kỳ tính toán Bollinger Bands"
            >
              <InputNumber min={10} max={50} step={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="bollingerStdDev"
              label="Standard Deviation"
              tooltip="Độ lệch chuẩn"
            >
              <Slider min={1} max={3} step={0.1} marks={{ 1: '1σ', 2: '2σ', 3: '3σ' }} />
            </Form.Item>
          </>
        );

      case 'volume_profile':
        return (
          <>
            <Form.Item
              name="volumeProfilePeriod"
              label="Analysis Period"
              tooltip="Chu kỳ phân tích volume profile"
            >
              <InputNumber min={20} max={200} step={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="valueAreaPercent"
              label="Value Area %"
              tooltip="Phần trăm value area"
            >
              <Slider min={60} max={80} step={5} marks={{ 70: '70%' }} />
            </Form.Item>
          </>
        );

      case 'smart_money':
        return (
          <>
            <Form.Item
              name="smartMoneyStructure"
              label="Structure Type"
              tooltip="Loại cấu trúc smart money"
            >
              <Select style={{ width: '100%' }}>
                <Option value="bos">Break of Structure (BOS)</Option>
                <Option value="choch">Change of Character (CHOCH)</Option>
                <Option value="liquidity">Liquidity Sweep</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="orderBlockPeriod"
              label="Order Block Period"
              tooltip="Chu kỳ xác định order block"
            >
              <InputNumber min={5} max={30} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );

      case 'ichimoku':
        return (
          <>
            <Form.Item
              name="ichimokuTenkan"
              label="Tenkan-sen"
              tooltip="Conversion Line period"
            >
              <InputNumber min={5} max={20} step={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="ichimokuKijun"
              label="Kijun-sen"
              tooltip="Base Line period"
            >
              <InputNumber min={15} max={50} step={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="ichimokuSenkou"
              label="Senkou Span B"
              tooltip="Leading Span B period"
            >
              <InputNumber min={30} max={100} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );

      case 'pivot_points':
        return (
          <>
            <Form.Item
              name="pivotType"
              label="Pivot Type"
              tooltip="Loại pivot point"
            >
              <Select style={{ width: '100%' }}>
                <Option value="standard">Standard</Option>
                <Option value="fibonacci">Fibonacci</Option>
                <Option value="woodie">Woodie</Option>
                <Option value="camarilla">Camarilla</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="pivotPeriod"
              label="Period"
              tooltip="Chu kỳ tính pivot"
            >
              <Select style={{ width: '100%' }}>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      title={
        <Space>
          <SettingOutlined />
          <span>Cấu Hình Chiến Lược</span>
        </Space>
      }
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        onValuesChange={handleFormChange}
        size="small"
      >
        {/* Basic Configuration */}
        <Title level={5}>Cấu Hình Cơ Bản</Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="trailingPercent"
              label="Trailing %"
              tooltip="Phần trăm trailing stop"
              rules={[{ required: true, message: 'Vui lòng nhập trailing %' }]}
            >
              <InputNumber
                min={0.1}
                max={10}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
                formatter={value => `${value}%`}
                parser={(value: string | undefined) => parseFloat(value!.replace('%', '')) as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="maxLossPercent"
              label="Max Loss %"
              tooltip="Phần trăm thua lỗ tối đa"
            >
              <InputNumber
                min={1}
                max={20}
                step={0.5}
                precision={1}
                style={{ width: '100%' }}
                formatter={value => `${value}%`}
                parser={(value: string | undefined) => parseFloat(value!.replace('%', '')) as any}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Strategy Specific Configuration */}
        <Divider />
        <Title level={5}>Cấu Hình Chuyên Biệt</Title>
        {renderStrategySpecificFields()}

        {/* Preview */}
        {showPreview && preview && currentPrice > 0 && (
          <>
            <Divider />
            <Alert
              message="Preview Tính Toán"
              description={
                <Space direction="vertical" size="small">
                  <Text>Giá hiện tại: <strong>${currentPrice.toFixed(4)}</strong></Text>
                  <Text>Stop Loss: <strong>${preview.stopLoss.toFixed(4)}</strong></Text>
                  <Text>Max Loss: <strong>${preview.maxLoss.toFixed(4)}</strong></Text>
                  <Text>Khoảng cách Trailing: <strong>${preview.trailingDistance.toFixed(4)}</strong></Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<CalculatorOutlined />}
            />
          </>
        )}
      </Form>
    </Card>
  );
}
