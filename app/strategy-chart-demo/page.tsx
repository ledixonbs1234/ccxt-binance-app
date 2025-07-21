'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Space, Typography, Alert, Spin } from 'antd';
import { LineChartOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import CandlestickChart from '../../components/CandlestickChart';
import { EnhancedTrailingStopService } from '../../lib/enhancedTrailingStopService';
import { TrailingStopPosition, TrailingStopStrategy } from '../../types/trailingStop';
import { useTrading } from '../../contexts/TradingContext';

const { Title, Text } = Typography;
const { Option } = Select;

const DEMO_STRATEGIES: TrailingStopStrategy[] = [
  'percentage',
  'atr', 
  'fibonacci',
  'bollinger_bands',
  'volume_profile',
  'ichimoku',
  'pivot_points',
  'support_resistance',
  'hybrid'
];

export default function StrategyChartDemo() {
  const { selectedCoin, coinsData } = useTrading();
  const [service, setService] = useState<EnhancedTrailingStopService | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<TrailingStopStrategy>('fibonacci');
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [demoPositions, setDemoPositions] = useState<TrailingStopPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize service
  useEffect(() => {
    const trailingService = new EnhancedTrailingStopService({
      defaultStrategy: 'fibonacci',
      defaultTrailingPercent: 2.5,
      defaultMaxLoss: 5,
      atrPeriod: 14,
      atrMultiplier: 2,
      volatilityLookback: 20,
      volatilityMultiplier: 0.5,
      maxPositions: 10,
      maxRiskPerPosition: 2,
      updateInterval: 5000,
      priceChangeThreshold: 0.1,

      // Advanced Strategy Settings
      fibonacciSettings: {
        levels: [0.236, 0.382, 0.5, 0.618, 0.786],
        lookbackPeriod: 50,
        defaultLevel: 0.618
      },
      bollingerSettings: {
        period: 20,
        stdDev: 2,
        useUpperBand: true,
        useLowerBand: true
      },
      volumeProfileSettings: {
        period: 100,
        valueAreaPercent: 70,
        pocSensitivity: 0.1
      },
      smartMoneySettings: {
        structureTimeframe: '1h',
        liquidityLevels: 3,
        orderBlockPeriod: 20
      },
      ichimokuSettings: {
        tenkanSen: 9,
        kijunSen: 26,
        senkouSpanB: 52,
        displacement: 26
      },
      pivotSettings: {
        type: 'standard',
        period: 'daily',
        levels: 3
      },

      maxLossPercent: 5.0
    });
    setService(trailingService);
  }, []);

  // Create demo position with selected strategy
  const createDemoPosition = async () => {
    if (!service) return;

    setIsCreatingPosition(true);
    setError(null);

    try {
      const currentPrice = coinsData[selectedCoin]?.price || 0;
      if (currentPrice === 0) {
        throw new Error('Không thể lấy giá hiện tại của coin');
      }

      // Strategy-specific configuration
      const strategyConfig = getStrategyConfig(selectedStrategy);

      const position = await service.createPositionWithStrategy({
        symbol: `${selectedCoin}/USDT`,
        side: 'sell',
        quantity: 100,
        entryPrice: currentPrice,
        strategy: selectedStrategy,
        strategyConfig,
        maxLossPercent: 5,
        accountBalance: 10000,
        riskPercent: 2
      });

      // Add to demo positions
      setDemoPositions(prev => [...prev, position]);

    } catch (error) {
      console.error('Error creating demo position:', error);
      setError(error instanceof Error ? error.message : 'Lỗi không xác định');
    } finally {
      setIsCreatingPosition(false);
    }
  };

  // Get strategy-specific configuration
  const getStrategyConfig = (strategy: TrailingStopStrategy): Record<string, any> => {
    switch (strategy) {
      case 'fibonacci':
        return {
          fibonacciLevels: [0.236, 0.382, 0.618, 0.786],
          useExtensions: true,
          extensionLevels: [1.272, 1.618]
        };
      case 'bollinger_bands':
        return {
          bollingerPeriod: 20,
          bollingerStdDev: 2.0,
          useMiddleBand: true
        };
      case 'atr':
        return {
          atrPeriod: 14,
          atrMultiplier: 2.0,
          useMultipleLevels: true
        };
      case 'volume_profile':
        return {
          volumePeriod: 100,
          useVPOC: true,
          showHVN: true,
          showLVN: true
        };
      case 'ichimoku':
        return {
          ichimokuTenkan: 9,
          ichimokuKijun: 26,
          ichimokuSenkou: 52,
          useCloud: true
        };
      case 'pivot_points':
        return {
          pivotPointType: 'standard',
          showAllLevels: true,
          period: 'daily'
        };
      case 'support_resistance':
        return {
          lookbackPeriod: 50,
          minTouches: 2,
          strengthThreshold: 0.5
        };
      case 'hybrid':
        return {
          primaryStrategy: 'atr',
          secondaryStrategy: 'fibonacci',
          volumeConfirmation: true
        };
      default:
        return {
          trailingPercent: 2.5
        };
    }
  };

  // Clear all demo positions
  const clearDemoPositions = () => {
    setDemoPositions([]);
    setError(null);
  };

  // Get strategy display name
  const getStrategyDisplayName = (strategy: TrailingStopStrategy): string => {
    const names: Record<TrailingStopStrategy, string> = {
      percentage: 'Phần Trăm',
      atr: 'ATR (Average True Range)',
      fibonacci: 'Fibonacci Retracement',
      bollinger_bands: 'Bollinger Bands',
      volume_profile: 'Volume Profile',
      smart_money: 'Smart Money',
      ichimoku: 'Ichimoku Kinko Hyo',
      pivot_points: 'Pivot Points',
      support_resistance: 'Support/Resistance',
      hybrid: 'Hybrid Strategy',
      dynamic: 'Dynamic Strategy'
    };
    return names[strategy] || strategy;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Title level={2} className="text-foreground flex items-center gap-3">
          <LineChartOutlined className="text-accent" />
          Strategy Chart Visualization Demo
        </Title>
        <Text type="secondary" className="text-base">
          Demo tích hợp các chiến lược trailing stop với biểu đồ trực quan
        </Text>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" className="w-full">
              <Text strong>Chọn Chiến Lược:</Text>
              <Select
                value={selectedStrategy}
                onChange={setSelectedStrategy}
                className="w-full"
                size="large"
              >
                {DEMO_STRATEGIES.map(strategy => (
                  <Option key={strategy} value={strategy}>
                    {getStrategyDisplayName(strategy)}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" className="w-full">
              <Text strong>Coin Hiện Tại:</Text>
              <div className="p-2 bg-secondary-bg rounded border">
                <Text className="text-foreground font-mono">
                  {selectedCoin} • {coinsData[selectedCoin]?.price?.toFixed(8) || 'Loading...'}
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <Space direction="vertical" size="small" className="w-full">
              <Text strong>Hành Động:</Text>
              <Space className="w-full">
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={createDemoPosition}
                  loading={isCreatingPosition}
                  disabled={!service || coinsData[selectedCoin]?.price === 0}
                >
                  Tạo Position Demo
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={clearDemoPositions}
                  disabled={demoPositions.length === 0}
                >
                  Xóa Tất Cả
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* Status */}
        <Row className="mt-4">
          <Col span={24}>
            <Space>
              <Text type="secondary">
                Demo Positions: <strong>{demoPositions.length}</strong>
              </Text>
              <Text type="secondary">
                Strategy: <strong>{getStrategyDisplayName(selectedStrategy)}</strong>
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Chart */}
      <Card>
        <div className="relative">
          {!service ? (
            <div className="flex justify-center items-center h-96">
              <Spin size="large" />
              <Text className="ml-3">Đang khởi tạo service...</Text>
            </div>
          ) : (
            <CandlestickChart 
              // Pass demo positions to show strategy indicators
              enhancedPositions={demoPositions}
            />
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <Title level={4}>Hướng Dẫn Sử Dụng:</Title>
        <ol className="list-decimal list-inside space-y-2 text-foreground">
          <li>Chọn một chiến lược từ dropdown</li>
          <li>Nhấn "Tạo Position Demo" để tạo position với chiến lược đã chọn</li>
          <li>Quan sát các chỉ báo chiến lược hiển thị trên biểu đồ</li>
          <li>Kiểm tra legend ở góc dưới trái để xem chi tiết các chỉ báo</li>
          <li>Thử nghiệm với các chiến lược khác nhau để so sánh</li>
        </ol>
      </Card>
    </div>
  );
}
