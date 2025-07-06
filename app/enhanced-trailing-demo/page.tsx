'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Space,
  Typography,
  Badge,
  Alert,
  Statistic,
  Divider,
  Switch,
  Spin
} from 'antd';
import {
  LineChartOutlined,
  StarOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  DownOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { TradingProvider, useTrading, CoinSymbol } from '../../contexts/TradingContext';
import { useTranslations } from '../../contexts/LanguageContext';
import EnhancedDemoCandlestickChart from '../../components/EnhancedDemoCandlestickChart';
import EnhancedTrailingStopPanel from '../../components/EnhancedTrailingStopPanel';
import { EnhancedTrailingStopService } from '../../lib/enhancedTrailingStopService';
import {
  TrailingStopPosition,
  TrailingStopAlert,
  TrailingStopPerformance,
  TrailingStopSettings
} from '../../types/trailingStop';

const { Text, Title } = Typography;
const { Option } = Select;


// Coin selection component
const COIN_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  PEPE: { name: 'Pepe', icon: '🐸', color: '#4caf50' }
};

// Demo position configurations for each coin
const getDemoConfigsForCoin = (coin: CoinSymbol) => {
  const configs = {
    BTC: [
      {
        symbol: 'BTC/USDT',
        side: 'sell' as const,
        quantity: 0.1,
        entryPrice: 45000,
        strategy: 'percentage' as const,
        trailingPercent: 2.5,
        maxLossPercent: 5,
      },
      {
        symbol: 'BTC/USDT',
        side: 'buy' as const,
        quantity: 0.05,
        entryPrice: 44500,
        strategy: 'atr' as const,
        trailingPercent: 3.0,
        maxLossPercent: 7,
        activationPrice: 46000,
      },
    ],
    ETH: [
      {
        symbol: 'ETH/USDT',
        side: 'sell' as const,
        quantity: 2.5,
        entryPrice: 3200,
        strategy: 'atr' as const,
        trailingPercent: 3.0,
        maxLossPercent: 7,
        activationPrice: 3300,
      },
      {
        symbol: 'ETH/USDT',
        side: 'buy' as const,
        quantity: 1.8,
        entryPrice: 3150,
        strategy: 'dynamic' as const,
        trailingPercent: 4.0,
        maxLossPercent: 8,
      },
    ],
    PEPE: [
      {
        symbol: 'PEPE/USDT',
        side: 'buy' as const,
        quantity: 1000000,
        entryPrice: 0.00002,
        strategy: 'dynamic' as const,
        trailingPercent: 5.0,
        maxLossPercent: 10,
      },
      {
        symbol: 'PEPE/USDT',
        side: 'sell' as const,
        quantity: 800000,
        entryPrice: 0.000022,
        strategy: 'percentage' as const,
        trailingPercent: 6.0,
        maxLossPercent: 12,
      },
    ],
  };

  return configs[coin] || [];
};

function CoinSelectorDropdown() {
  const { selectedCoin, setSelectedCoin, coinsData } = useTrading();
  const t = useTranslations();

  const handleCoinChange = (value: CoinSymbol) => {
    setSelectedCoin(value);
  };

  return (
    <Select
      value={selectedCoin}
      onChange={handleCoinChange}
      style={{ width: '100%', minWidth: 200 }}
      size="large"
      suffixIcon={<DownOutlined />}
    >
      {Object.entries(COIN_INFO).map(([coin, info]) => {
        const coinData = coinsData[coin as CoinSymbol];
        return (
          <Option key={coin} value={coin}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                  background: `linear-gradient(135deg, ${info.color}, ${info.color}CC)`,
                }}
              >
                {info.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{coin}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{info.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 600 }}>
                  ${coinData?.price < 0.01
                    ? coinData?.price.toFixed(6)
                    : coinData?.price.toLocaleString() || '0'}
                </div>
                <div style={{
                  fontSize: 12,
                  color: coinData?.change24h >= 0 ? '#52c41a' : '#ff4d4f'
                }}>
                  {coinData?.change24h >= 0 ? '+' : ''}{coinData?.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </Option>
        );
      })}
    </Select>
  );
}

// Main component that uses trading context
function EnhancedTrailingDemoContent() {
  const { selectedCoin, coinsData } = useTrading();
  const t = useTranslations();
  const [service, setService] = useState<EnhancedTrailingStopService | null>(null);
  const [positions, setPositions] = useState<TrailingStopPosition[]>([]);
  const [alerts, setAlerts] = useState<TrailingStopAlert[]>([]);
  const [performance, setPerformance] = useState<TrailingStopPerformance>({
    totalPositions: 0,
    activePositions: 0,
    triggeredPositions: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    winRate: 0,
    avgHoldTime: 0,
    maxDrawdown: 0,
  });
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize service
  useEffect(() => {
    const defaultSettings: TrailingStopSettings = {
      defaultStrategy: 'percentage',
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
    };

    const trailingService = new EnhancedTrailingStopService(defaultSettings);
    setService(trailingService);

    // Create demo positions for the selected coin
    createDemoPositions(trailingService, selectedCoin);
  }, [selectedCoin]); // Re-initialize when coin changes

  const createDemoPositions = async (trailingService: EnhancedTrailingStopService, selectedCoin: CoinSymbol) => {
    try {
      // Create demo positions based on selected coin
      const demoConfigs = getDemoConfigsForCoin(selectedCoin);

      const createdPositions = await Promise.all(
        demoConfigs.map(config => trailingService.createPosition(config))
      );

      setPositions(createdPositions);
      updatePerformanceMetrics(createdPositions);
    } catch (error) {
      console.error('Error creating demo positions:', error);
    }
  };

  const updatePerformanceMetrics = (currentPositions: TrailingStopPosition[]) => {
    const activeCount = currentPositions.filter(p => p.status === 'active' || p.status === 'pending').length;
    const triggeredCount = currentPositions.filter(p => p.status === 'triggered').length;
    const totalPnL = currentPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const totalPnLPercent = currentPositions.length > 0 
      ? currentPositions.reduce((sum, p) => sum + p.unrealizedPnLPercent, 0) / currentPositions.length 
      : 0;
    const winCount = currentPositions.filter(p => p.unrealizedPnLPercent > 0).length;
    const winRate = currentPositions.length > 0 ? (winCount / currentPositions.length) * 100 : 0;
    const maxDrawdown = Math.max(...currentPositions.map(p => p.maxDrawdown), 0);

    setPerformance({
      totalPositions: currentPositions.length,
      activePositions: activeCount,
      triggeredPositions: triggeredCount,
      totalPnL,
      totalPnLPercent,
      winRate,
      avgHoldTime: 2.5 * 3600000, // 2.5 hours in ms
      maxDrawdown,
    });
  };

  const handlePositionUpdate = (updatedPosition: TrailingStopPosition) => {
    setPositions(prev => {
      const updated = prev.map(p => p.id === updatedPosition.id ? updatedPosition : p);
      updatePerformanceMetrics(updated);
      return updated;
    });

    // Add alert for position update
    const alert: TrailingStopAlert = {
      id: `alert_${Date.now()}`,
      type: 'adjustment',
      message: `Position ${updatedPosition.symbol} updated - Trailing: ${updatedPosition.trailingPercent.toFixed(1)}%`,
      position: updatedPosition,
      timestamp: Date.now(),
      severity: 'info',
    };
    setAlerts(prev => [alert, ...prev.slice(0, 49)]);
  };

  const handlePositionRemove = (positionId: string) => {
    setPositions(prev => {
      const filtered = prev.filter(p => p.id !== positionId);
      updatePerformanceMetrics(filtered);
      return filtered;
    });

    const position = positions.find(p => p.id === positionId);
    if (position) {
      const alert: TrailingStopAlert = {
        id: `alert_${Date.now()}`,
        type: 'trigger',
        message: `Position ${position.symbol} removed`,
        position,
        timestamp: Date.now(),
        severity: 'warning',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  const startService = () => {
    if (service) {
      service.startMonitoring();
      setIsServiceRunning(true);
      
      const alert: TrailingStopAlert = {
        id: `alert_${Date.now()}`,
        type: 'activation',
        message: 'Enhanced trailing stop service started',
        position: positions[0] || {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'success',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  };

  const stopService = () => {
    if (service) {
      service.stopMonitoring();
      setIsServiceRunning(false);
      
      const alert: TrailingStopAlert = {
        id: `alert_${Date.now()}`,
        type: 'trigger',
        message: 'Enhanced trailing stop service stopped',
        position: positions[0] || {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'warning',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  };

  // Create new position using real market data instead of hardcoded values
  const createNewPosition = async () => {
    if (!service) return;

    try {
      // Get real market data from trading context
      const currentCoinData = coinsData[selectedCoin];
      if (!currentCoinData || currentCoinData.price === 0) {
        throw new Error(`No market data available for ${selectedCoin}`);
      }

      const currentPrice = currentCoinData.price;

      // Calculate realistic position sizing based on risk management
      // Using a fixed USD amount approach with proper position sizing
      const riskAmountUSD = 100; // Risk $100 per position
      const maxLossPercent = 5; // Maximum 5% loss per position

      // Calculate position quantity based on risk management
      const calculatePositionSize = (price: number, riskAmount: number, maxLoss: number): number => {
        // Position size = Risk Amount / (Price * Max Loss Percentage)
        const baseQuantity = riskAmount / (price * (maxLoss / 100));

        // Apply coin-specific adjustments for realistic quantities
        switch (selectedCoin) {
          case 'BTC':
            return Math.round(baseQuantity * 10000) / 10000; // 4 decimal places
          case 'ETH':
            return Math.round(baseQuantity * 1000) / 1000; // 3 decimal places
          case 'PEPE':
            return Math.round(baseQuantity); // Whole numbers for PEPE
          default:
            return baseQuantity;
        }
      };

      const quantity = calculatePositionSize(currentPrice, riskAmountUSD, maxLossPercent);

      // Use current market price with small realistic variation (±0.1% for entry timing)
      const entryPriceVariation = currentPrice * (Math.random() * 0.002 - 0.001); // ±0.1%
      const entryPrice = currentPrice + entryPriceVariation;

      // Calculate dynamic trailing percentage based on coin volatility
      const calculateTrailingPercent = (coinData: any): number => {
        const volatility = Math.abs(coinData.change24h);

        // Base trailing percentage on 24h volatility
        if (volatility > 10) return 3 + Math.random() * 2; // High volatility: 3-5%
        if (volatility > 5) return 2 + Math.random() * 2;  // Medium volatility: 2-4%
        return 1.5 + Math.random() * 1.5; // Low volatility: 1.5-3%
      };

      const trailingPercent = calculateTrailingPercent(currentCoinData);

      const newPosition = await service.createPosition({
        symbol: `${selectedCoin}/USDT`,
        side: Math.random() > 0.5 ? 'sell' : 'buy',
        quantity: quantity,
        entryPrice: entryPrice,
        strategy: 'percentage',
        trailingPercent: trailingPercent,
        maxLossPercent: maxLossPercent,
      });

      setPositions(prev => {
        const updated = [...prev, newPosition];
        updatePerformanceMetrics(updated);
        return updated;
      });

      const alert: TrailingStopAlert = {
        id: `alert_${Date.now()}`,
        type: 'activation',
        message: `New position created for ${newPosition.symbol} at $${entryPrice.toFixed(selectedCoin === 'PEPE' ? 8 : selectedCoin === 'BTC' ? 2 : 4)} (Qty: ${quantity.toLocaleString()})`,
        position: newPosition,
        timestamp: Date.now(),
        severity: 'success',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    } catch (error) {
      console.error('Error creating new position:', error);

      // Add error alert
      const errorAlert: TrailingStopAlert = {
        id: `alert_${Date.now()}`,
        type: 'trigger',
        message: `Failed to create position for ${selectedCoin}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        position: positions[0] || {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'error',
      };
      setAlerts(prev => [errorAlert, ...prev.slice(0, 49)]);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-container)' }}>
      {/* Header */}
      <Card style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large" align="center">
                <StarOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                <div>
                  <Title level={2} style={{ margin: 0 }}>{t.trading.enhancedTrailingStops}</Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    {t.trading.advancedTrailingStopVisualization}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size="middle" wrap>
                <Button
                  onClick={() => window.location.href = '/'}
                  type="text"
                  icon={
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  }
                >
                  Quay lại ứng dụng chính
                </Button>

                <Badge
                  status={isServiceRunning ? "processing" : "default"}
                  text={
                    <Text style={{ fontSize: 14, fontWeight: 500 }}>
                      {isServiceRunning ? t.trading.serviceRunning : t.trading.serviceStopped}
                    </Text>
                  }
                />

                <Button
                  onClick={createNewPosition}
                  icon={<PlusOutlined />}
                  disabled={!service}
                >
                  {t.trading.createNewPosition}
                </Button>

                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  type="text"
                  icon={<SettingOutlined />}
                  title={showSettings ? t.trading.hideSettings : t.trading.showSettings}
                />

                <Button
                  type={isServiceRunning ? "default" : "primary"}
                  danger={isServiceRunning}
                  icon={isServiceRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={isServiceRunning ? stopService : startService}
                >
                  {isServiceRunning ? t.trading.stopService : t.trading.startService}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <Row gutter={[24, 24]}>
          {/* Chart Section */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Coin Selection */}
              <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>{t.trading.selectCoin}</Title>
                  </Col>
                  <Col>
                    <Text type="secondary">
                      {t.trading.selectedCoin}: <Text strong style={{ color: '#1890ff' }}>{selectedCoin}</Text>
                    </Text>
                  </Col>
                </Row>
                <CoinSelectorDropdown />
              </Card>

              {/* Chart */}
              <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                  <Col>
                    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LineChartOutlined style={{ color: '#1890ff' }} />
                      {t.trading.priceChartWithTrailingStops}
                    </Title>
                  </Col>
                  <Col>
                    <Badge
                      count={positions.filter(p => p.status === 'active').length}
                      style={{ backgroundColor: '#52c41a' }}
                    >
                      <Text type="secondary" style={{ fontWeight: 500 }}>
                        {t.trading.activePositionsVisualized}
                      </Text>
                    </Badge>
                  </Col>
                </Row>
                <EnhancedDemoCandlestickChart height={500} showVolume={true} />
              </Card>

              {/* Feature Highlights */}
              <Card>
                <Title level={4} style={{ marginBottom: 24 }}>{t.trading.enhancedFeatures}</Title>
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.visualChartIntegration}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.visualChartIntegrationDesc}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.multipleStrategies}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.multipleStrategiesDesc}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#722ed1', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.performanceTracking}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.performanceTrackingDesc}</Text>
                        </div>
                      </div>
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#fa8c16', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.advancedAnalytics}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.advancedAnalyticsDesc}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#ff4d4f', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.realTimeAlerts}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.realTimeAlertsDesc}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#13c2c2', borderRadius: '50%', marginTop: 8, flexShrink: 0 }}></div>
                        <div>
                          <Title level={5} style={{ marginBottom: 8 }}>{t.trading.riskManagement}</Title>
                          <Text type="secondary" style={{ lineHeight: 1.6 }}>{t.trading.riskManagementDesc}</Text>
                        </div>
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Space>
          </Col>

          {/* Control Panel */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <EnhancedTrailingStopPanel
                positions={positions}
                alerts={alerts}
                performance={performance}
                onPositionUpdate={handlePositionUpdate}
                onPositionRemove={handlePositionRemove}
                onClearAlerts={handleClearAlerts}
              />

              {/* Quick Stats */}
              <Card size="small">
                <Title level={5} style={{ marginBottom: 12 }}>{t.trading.serviceControls}</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Col><Text type="secondary" style={{ fontSize: 14 }}>Trạng thái dịch vụ:</Text></Col>
                    <Col>
                      <Text style={{
                        fontSize: 14,
                        color: isServiceRunning ? '#52c41a' : '#8c8c8c'
                      }}>
                        {isServiceRunning ? 'Đang chạy' : 'Đã dừng'}
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="space-between">
                    <Col><Text type="secondary" style={{ fontSize: 14 }}>Tổng vị thế:</Text></Col>
                    <Col><Text style={{ fontSize: 14 }}>{positions.length}</Text></Col>
                  </Row>
                  <Row justify="space-between">
                    <Col><Text type="secondary" style={{ fontSize: 14 }}>Cảnh báo hoạt động:</Text></Col>
                    <Col><Text style={{ fontSize: 14 }}>{alerts.length}</Text></Col>
                  </Row>
                  <Row justify="space-between">
                    <Col><Text type="secondary" style={{ fontSize: 14 }}>Tích hợp biểu đồ:</Text></Col>
                    <Col><Text style={{ fontSize: 14, color: '#52c41a' }}>Đã bật</Text></Col>
                  </Row>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}

  // Main export component with TradingProvider
  export default function EnhancedTrailingDemoPage() {
    return (
      <TradingProvider>
        <EnhancedTrailingDemoContent />
      </TradingProvider>
    );
  }
