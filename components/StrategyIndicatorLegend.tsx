'use client';

import React from 'react';
import { Card, Space, Typography, Tag, Tooltip, Row, Col } from 'antd';
import {
  LineChartOutlined,
  RiseOutlined,
  BarChartOutlined,
  DotChartOutlined,
  RadarChartOutlined,
  FunctionOutlined
} from '@ant-design/icons';
import { TrailingStopPosition, TrailingStopStrategy } from '../types/trailingStop';
import { formatSmartPrice } from '../lib/priceFormatter';

const { Text, Title } = Typography;

interface StrategyIndicatorLegendProps {
  positions: TrailingStopPosition[];
  symbol: string;
  currentPrice: number;
}

// Strategy metadata for display
const STRATEGY_METADATA = {
  percentage: {
    name: 'Phần Trăm',
    icon: <LineChartOutlined />,
    color: '#1890ff',
    indicators: ['SMA'],
    description: 'Trailing stop cơ bản theo phần trăm'
  },
  atr: {
    name: 'ATR',
    icon: <RiseOutlined />,
    color: '#f5222d',
    indicators: ['ATR 1.5x', 'ATR 2.0x', 'ATR 2.5x'],
    description: 'Dựa trên Average True Range'
  },
  fibonacci: {
    name: 'Fibonacci',
    icon: <FunctionOutlined />,
    color: '#fa8c16',
    indicators: ['Fib 23.6%', 'Fib 38.2%', 'Fib 61.8%', 'Fib 78.6%', 'Ext 127.2%', 'Ext 161.8%'],
    description: 'Fibonacci retracement và extension'
  },
  bollinger_bands: {
    name: 'Bollinger Bands',
    icon: <BarChartOutlined />,
    color: '#722ed1',
    indicators: ['BB Upper', 'BB Middle', 'BB Lower'],
    description: 'Bollinger Bands với độ lệch chuẩn'
  },
  volume_profile: {
    name: 'Volume Profile',
    icon: <DotChartOutlined />,
    color: '#13c2c2',
    indicators: ['VPOC', 'HVN', 'LVN'],
    description: 'Phân tích khối lượng theo giá'
  },
  ichimoku: {
    name: 'Ichimoku',
    icon: <RadarChartOutlined />,
    color: '#52c41a',
    indicators: ['Tenkan-sen', 'Kijun-sen', 'Senkou A', 'Senkou B'],
    description: 'Hệ thống Ichimoku Kinko Hyo'
  },
  pivot_points: {
    name: 'Pivot Points',
    icon: <LineChartOutlined />,
    color: '#eb2f96',
    indicators: ['R2', 'R1', 'PP', 'S1', 'S2'],
    description: 'Điểm pivot và support/resistance'
  },
  support_resistance: {
    name: 'S/R',
    icon: <BarChartOutlined />,
    color: '#faad14',
    indicators: ['Support', 'Resistance'],
    description: 'Vùng hỗ trợ và kháng cự'
  },
  hybrid: {
    name: 'Hybrid',
    icon: <FunctionOutlined />,
    color: '#9254de',
    indicators: ['ATR', 'Fibonacci', 'Volume Profile'],
    description: 'Kết hợp nhiều chiến lược'
  },
  smart_money: {
    name: 'Smart Money',
    icon: <RiseOutlined />,
    color: '#096dd9',
    indicators: ['Smart Money Flow'],
    description: 'Theo dõi dòng tiền thông minh'
  }
};

export default function StrategyIndicatorLegend({
  positions,
  symbol,
  currentPrice
}: StrategyIndicatorLegendProps) {
  // Filter positions for current symbol
  const relevantPositions = positions.filter(position => 
    position.symbol.replace('/', '') === symbol.replace('/', '') && 
    position.status === 'active'
  );

  if (relevantPositions.length === 0) {
    return null;
  }

  // Group positions by strategy
  const strategiesInUse = relevantPositions.reduce((acc, position) => {
    if (!acc[position.strategy]) {
      acc[position.strategy] = [];
    }
    acc[position.strategy].push(position);
    return acc;
  }, {} as Record<TrailingStopStrategy, TrailingStopPosition[]>);

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-md">
      <Card 
        size="small" 
        className="bg-background/95 backdrop-blur-sm border border-border shadow-lg"
        bodyStyle={{ padding: '12px' }}
      >
        <div className="mb-2">
          <Title level={5} className="text-foreground m-0 flex items-center gap-2">
            <LineChartOutlined className="text-accent" />
            Strategy Indicators
          </Title>
          <Text type="secondary" className="text-xs">
            {symbol} • {formatSmartPrice(currentPrice)}
          </Text>
        </div>

        <Space direction="vertical" size="small" className="w-full">
          {Object.entries(strategiesInUse).map(([strategy, strategyPositions]) => {
            const metadata = STRATEGY_METADATA[strategy as TrailingStopStrategy];
            if (!metadata) return null;

            return (
              <div key={strategy} className="border-l-2 pl-3" style={{ borderColor: metadata.color }}>
                <Row justify="space-between" align="middle" className="mb-1">
                  <Col>
                    <Space align="center" size="small">
                      <span style={{ color: metadata.color }}>{metadata.icon}</span>
                      <Text strong className="text-foreground text-sm">
                        {metadata.name}
                      </Text>
                      <Tag size="small" color={metadata.color}>
                        {strategyPositions.length}
                      </Tag>
                    </Space>
                  </Col>
                </Row>

                <div className="mb-2">
                  <Text type="secondary" className="text-xs">
                    {metadata.description}
                  </Text>
                </div>

                {/* Indicators */}
                <div className="flex flex-wrap gap-1">
                  {metadata.indicators.map((indicator, index) => (
                    <Tooltip key={index} title={`${indicator} indicator`}>
                      <Tag 
                        size="small" 
                        className="text-xs cursor-help"
                        style={{ 
                          borderColor: metadata.color,
                          color: metadata.color,
                          backgroundColor: 'transparent'
                        }}
                      >
                        {indicator}
                      </Tag>
                    </Tooltip>
                  ))}
                </div>

                {/* Position Details */}
                {strategyPositions.map((position, index) => (
                  <div key={position.id} className="mt-2 p-2 bg-secondary-bg/50 rounded text-xs">
                    <Row justify="space-between">
                      <Col>
                        <Text className="text-foreground">
                          {position.side.toUpperCase()} • {position.quantity}
                        </Text>
                      </Col>
                      <Col>
                        <Text 
                          className={position.unrealizedPnLPercent >= 0 ? 'text-success' : 'text-destructive'}
                        >
                          {position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                        </Text>
                      </Col>
                    </Row>
                    <Row justify="space-between" className="mt-1">
                      <Col>
                        <Text type="secondary">Entry: {formatSmartPrice(position.entryPrice)}</Text>
                      </Col>
                      <Col>
                        <Text type="secondary">Stop: {formatSmartPrice(position.stopLossPrice)}</Text>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            );
          })}
        </Space>

        {/* Legend Footer */}
        <div className="mt-3 pt-2 border-t border-border">
          <Text type="secondary" className="text-xs">
            💡 Các chỉ báo được hiển thị trực tiếp trên biểu đồ
          </Text>
        </div>
      </Card>
    </div>
  );
}
