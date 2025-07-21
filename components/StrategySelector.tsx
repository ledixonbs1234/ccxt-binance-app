'use client';

import React, { useState } from 'react';
import { 
  Select, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Tooltip, 
  Badge,
  Row,
  Col,
  Divider,
  Alert
} from 'antd';
import { 
  InfoCircleOutlined, 
  TrophyOutlined, 
  WarningOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { TrailingStopStrategy, StrategyMetadata } from '../types/trailingStop';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface StrategySelectorProps {
  value: TrailingStopStrategy;
  onChange: (strategy: TrailingStopStrategy) => void;
  showDetails?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

// Strategy Metadata Configuration
const STRATEGY_METADATA: Record<TrailingStopStrategy, StrategyMetadata> = {
  percentage: {
    id: 'percentage',
    name: 'Percentage Trailing',
    nameVi: 'Trailing Theo Phần Trăm',
    description: 'Traditional percentage-based trailing stop',
    descriptionVi: 'Trailing stop truyền thống dựa trên phần trăm',
    complexity: 'beginner',
    marketCondition: 'any',
    requiredIndicators: [],
    parameters: [],
    pros: ['Simple to understand', 'Works in all markets', 'Low resource usage'],
    cons: ['May be too rigid', 'Doesn\'t adapt to volatility'],
    bestTimeframes: ['1m', '5m', '15m', '1h'],
    riskLevel: 'low'
  },
  atr: {
    id: 'atr',
    name: 'ATR Based',
    nameVi: 'Dựa Trên ATR',
    description: 'Uses Average True Range for dynamic stops',
    descriptionVi: 'Sử dụng Average True Range cho stop động',
    complexity: 'intermediate',
    marketCondition: 'volatile',
    requiredIndicators: ['ATR'],
    parameters: [],
    pros: ['Adapts to volatility', 'More precise entries', 'Reduces false signals'],
    cons: ['More complex', 'Requires calculation', 'May lag in fast moves'],
    bestTimeframes: ['15m', '1h', '4h'],
    riskLevel: 'medium'
  },
  fibonacci: {
    id: 'fibonacci',
    name: 'Fibonacci Retracement',
    nameVi: 'Fibonacci Retracement',
    description: 'Uses Fibonacci levels for support/resistance',
    descriptionVi: 'Sử dụng các mức Fibonacci làm hỗ trợ/kháng cự',
    complexity: 'intermediate',
    marketCondition: 'trending',
    requiredIndicators: ['Fibonacci'],
    parameters: [],
    pros: ['Natural support levels', 'High accuracy in trends', 'Widely respected levels'],
    cons: ['Subjective swing points', 'Less effective in ranging markets'],
    bestTimeframes: ['1h', '4h', '1d'],
    riskLevel: 'medium'
  },
  bollinger_bands: {
    id: 'bollinger_bands',
    name: 'Bollinger Bands',
    nameVi: 'Bollinger Bands',
    description: 'Uses Bollinger Bands for dynamic support/resistance',
    descriptionVi: 'Sử dụng Bollinger Bands cho hỗ trợ/kháng cự động',
    complexity: 'intermediate',
    marketCondition: 'ranging',
    requiredIndicators: ['Bollinger Bands', 'Moving Average'],
    parameters: [],
    pros: ['Dynamic levels', 'Good for ranging markets', 'Visual clarity'],
    cons: ['Lagging indicator', 'False signals in trends'],
    bestTimeframes: ['15m', '1h', '4h'],
    riskLevel: 'medium'
  },
  volume_profile: {
    id: 'volume_profile',
    name: 'Volume Profile',
    nameVi: 'Volume Profile',
    description: 'Uses volume-based support/resistance levels',
    descriptionVi: 'Sử dụng các mức hỗ trợ/kháng cự dựa trên volume',
    complexity: 'advanced',
    marketCondition: 'any',
    requiredIndicators: ['Volume Profile', 'POC'],
    parameters: [],
    pros: ['High probability levels', 'Institution-grade analysis', 'Works across timeframes'],
    cons: ['Complex calculation', 'Requires volume data', 'Resource intensive'],
    bestTimeframes: ['1h', '4h', '1d'],
    riskLevel: 'medium'
  },
  smart_money: {
    id: 'smart_money',
    name: 'Smart Money Concepts',
    nameVi: 'Smart Money Concepts',
    description: 'Uses institutional trading concepts',
    descriptionVi: 'Sử dụng các khái niệm giao dịch tổ chức',
    complexity: 'expert',
    marketCondition: 'trending',
    requiredIndicators: ['Order Blocks', 'Liquidity Levels', 'BOS/CHOCH'],
    parameters: [],
    pros: ['Institution-level analysis', 'High win rate', 'Advanced market structure'],
    cons: ['Very complex', 'Requires deep knowledge', 'Subjective interpretation'],
    bestTimeframes: ['15m', '1h', '4h'],
    riskLevel: 'high'
  },
  support_resistance: {
    id: 'support_resistance',
    name: 'Support/Resistance',
    nameVi: 'Hỗ Trợ/Kháng Cự',
    description: 'Uses key support and resistance levels',
    descriptionVi: 'Sử dụng các mức hỗ trợ và kháng cự chính',
    complexity: 'intermediate',
    marketCondition: 'any',
    requiredIndicators: ['Support/Resistance'],
    parameters: [],
    pros: ['Clear levels', 'Time-tested method', 'Works across markets'],
    cons: ['Subjective identification', 'May break unexpectedly'],
    bestTimeframes: ['1h', '4h', '1d'],
    riskLevel: 'medium'
  },
  dynamic: {
    id: 'dynamic',
    name: 'Dynamic Volatility',
    nameVi: 'Volatility Động',
    description: 'Adapts to market volatility in real-time',
    descriptionVi: 'Thích ứng với volatility thị trường theo thời gian thực',
    complexity: 'advanced',
    marketCondition: 'volatile',
    requiredIndicators: ['Volatility Index', 'ATR', 'Standard Deviation'],
    parameters: [],
    pros: ['Real-time adaptation', 'Handles all market conditions', 'Advanced algorithm'],
    cons: ['Complex parameters', 'May over-optimize', 'Resource intensive'],
    bestTimeframes: ['5m', '15m', '1h'],
    riskLevel: 'high'
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid Strategy',
    nameVi: 'Chiến Lược Kết Hợp',
    description: 'Combines multiple strategies for optimal performance',
    descriptionVi: 'Kết hợp nhiều chiến lược để đạt hiệu suất tối ưu',
    complexity: 'expert',
    marketCondition: 'any',
    requiredIndicators: ['Multiple'],
    parameters: [],
    pros: ['Best of all strategies', 'Adaptive', 'High performance potential'],
    cons: ['Most complex', 'Requires tuning', 'Resource intensive'],
    bestTimeframes: ['15m', '1h', '4h'],
    riskLevel: 'high'
  },
  ichimoku: {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    nameVi: 'Ichimoku Cloud',
    description: 'Uses Ichimoku cloud system for comprehensive analysis',
    descriptionVi: 'Sử dụng hệ thống Ichimoku cloud để phân tích toàn diện',
    complexity: 'advanced',
    marketCondition: 'trending',
    requiredIndicators: ['Ichimoku Cloud'],
    parameters: [],
    pros: ['Complete system', 'Multiple confirmations', 'Strong in trends'],
    cons: ['Complex interpretation', 'Lagging signals', 'Less effective in ranging'],
    bestTimeframes: ['1h', '4h', '1d'],
    riskLevel: 'medium'
  },
  pivot_points: {
    id: 'pivot_points',
    name: 'Pivot Points',
    nameVi: 'Pivot Points',
    description: 'Uses pivot point calculations for support/resistance',
    descriptionVi: 'Sử dụng tính toán pivot point cho hỗ trợ/kháng cự',
    complexity: 'intermediate',
    marketCondition: 'ranging',
    requiredIndicators: ['Pivot Points'],
    parameters: [],
    pros: ['Mathematical precision', 'Clear levels', 'Day trading friendly'],
    cons: ['Daily recalculation', 'Less effective in strong trends'],
    bestTimeframes: ['5m', '15m', '1h'],
    riskLevel: 'medium'
  }
};

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'beginner': return 'green';
    case 'intermediate': return 'blue';
    case 'advanced': return 'orange';
    case 'expert': return 'red';
    default: return 'default';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'green';
    case 'medium': return 'orange';
    case 'high': return 'red';
    default: return 'default';
  }
};

export default function StrategySelector({
  value,
  onChange,
  showDetails = true,
  size = 'middle',
  className
}: StrategySelectorProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<TrailingStopStrategy>(value);
  
  const handleChange = (newStrategy: TrailingStopStrategy) => {
    setSelectedStrategy(newStrategy);
    onChange(newStrategy);
  };

  const currentMetadata = STRATEGY_METADATA[selectedStrategy];

  return (
    <div className={className}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Strategy Selector */}
        <Select
          value={selectedStrategy}
          onChange={handleChange}
          size={size}
          style={{ width: '100%' }}
          placeholder="Chọn chiến lược trailing stop"
        >
          {Object.values(STRATEGY_METADATA).map((strategy) => (
            <Option key={strategy.id} value={strategy.id}>
              <Space>
                <span>{strategy.nameVi}</span>
                <Tag color={getComplexityColor(strategy.complexity)}>
                  {strategy.complexity}
                </Tag>
              </Space>
            </Option>
          ))}
        </Select>

        {/* Strategy Details */}
        {showDetails && currentMetadata && (
          <Card size="small" className="strategy-details">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {/* Header */}
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={5} style={{ margin: 0 }}>
                    {currentMetadata.nameVi}
                  </Title>
                </Col>
                <Col>
                  <Space>
                    <Tag color={getComplexityColor(currentMetadata.complexity)}>
                      {currentMetadata.complexity}
                    </Tag>
                    <Tag color={getRiskColor(currentMetadata.riskLevel)}>
                      Risk: {currentMetadata.riskLevel}
                    </Tag>
                  </Space>
                </Col>
              </Row>

              {/* Description */}
              <Paragraph style={{ margin: 0, fontSize: '13px' }}>
                {currentMetadata.descriptionVi}
              </Paragraph>

              {/* Market Condition & Timeframes */}
              <Row gutter={16}>
                <Col span={12}>
                  <Space size="small">
                    <BarChartOutlined />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Thị trường: {currentMetadata.marketCondition}
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space size="small">
                    <ClockCircleOutlined />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Khung thời gian: {currentMetadata.bestTimeframes.join(', ')}
                    </Text>
                  </Space>
                </Col>
              </Row>

              {/* Required Indicators */}
              {currentMetadata.requiredIndicators.length > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Chỉ báo cần thiết:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {currentMetadata.requiredIndicators.map((indicator) => (
                      <Tag key={indicator} style={{ margin: '2px', fontSize: '12px' }}>
                        {indicator}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}
