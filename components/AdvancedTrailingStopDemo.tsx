'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Form,
  InputNumber,
  Alert,
  Statistic,
  Badge,
  Space,
  Typography,
  Divider,
  Switch,
  Spin,
  List,
  Tag,
  Progress
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  BarChartOutlined,
  TrophyOutlined,
  SettingOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  RiseOutlined,
  FallOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import { TrailingStopStrategy, TrailingStopSettings, TrailingStopPosition, TrailingStopAlert } from '../types/trailingStop';
import { EnhancedTrailingStopService } from '../lib/enhancedTrailingStopService';
import { useTrading, CoinSymbol } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';
import StrategySelector from './StrategySelector';
import QuickGuideModal from './QuickGuideModal';
import { generateUniqueId } from '../lib/utils';
import StrategyConfigPanel, { StrategyConfig } from './StrategyConfigPanel';
import EnhancedDemoCandlestickChart from './EnhancedDemoCandlestickChart';
import EnhancedTrailingStopPanel from './EnhancedTrailingStopPanel';

const { Title, Text } = Typography;
const { Option } = Select;

interface StrategyPerformance {
  strategy: TrailingStopStrategy;
  name: string;
  performance: {
    winRate: number;
    avgProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}



interface TrailingStopPerformance {
  totalPositions: number;
  activePositions: number;
  triggeredPositions: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  avgHoldTime: number;
  maxDrawdown: number;
}



export default function AdvancedTrailingStopDemo() {
  const { selectedCoin, coinsData } = useTrading();
  const t = useTranslations();
  const [selectedStrategy, setSelectedStrategy] = useState<TrailingStopStrategy>('percentage');
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [performanceData, setPerformanceData] = useState<StrategyPerformance[]>([]);
  const [demoPosition, setDemoPosition] = useState<any>(null);
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
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [form] = Form.useForm();

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
      maxLossPercent: 5,
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
      }
    };

    const trailingService = new EnhancedTrailingStopService(defaultSettings);
    setService(trailingService);

    // Create demo positions for the selected coin
    createDemoPositions(trailingService, selectedCoin);
  }, [selectedCoin]); // Re-initialize when coin changes

  // Helper functions
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

  const getDemoConfigsForCoin = (coin: CoinSymbol) => {
    const currentCoinData = coinsData[coin];
    if (!currentCoinData || currentCoinData.price === 0) {
      return [];
    }

    const currentPrice = currentCoinData.price;
    const strategies: TrailingStopStrategy[] = ['percentage', 'atr', 'fibonacci', 'dynamic'];

    return strategies.map((strategy) => ({
      symbol: `${coin}/USDT`,
      side: Math.random() > 0.5 ? 'sell' : 'buy' as 'buy' | 'sell',
      quantity: coin === 'PEPE' ? 1000000 + Math.random() * 5000000 :
                coin === 'ETH' ? 0.5 + Math.random() * 2 :
                0.01 + Math.random() * 0.05,
      entryPrice: currentPrice * (0.995 + Math.random() * 0.01), // ±0.5% variation
      strategy: strategy,
      trailingPercent: 1.5 + Math.random() * 3, // 1.5-4.5%
      maxLossPercent: 3 + Math.random() * 4, // 3-7%
    }));
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
      avgHoldTime: 0, // Calculate if needed
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
      id: `alert_${generateUniqueId()}`,
      type: 'adjustment',
      message: `Position ${updatedPosition.symbol} updated - Trailing: ${updatedPosition.trailingPercent.toFixed(1)}%`,
      position: updatedPosition,
      timestamp: Date.now(),
      severity: 'info',
    };
    setAlerts(prev => [alert, ...prev.slice(0, 49)]);
  };

  const startService = () => {
    if (service) {
      service.startMonitoring();
      setIsServiceRunning(true);

      const alert: TrailingStopAlert = {
        id: `alert_${generateUniqueId()}`,
        type: 'activation',
        message: 'Advanced trailing stop service started',
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
        id: `alert_${generateUniqueId()}`,
        type: 'trigger',
        message: 'Advanced trailing stop service stopped',
        position: positions[0] || {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'warning',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  };

  const createNewPosition = async () => {
    if (!service) return;

    try {
      // Get real market data from trading context
      const currentCoinData = coinsData[selectedCoin];
      if (!currentCoinData || currentCoinData.price === 0) {
        throw new Error(`No market data available for ${selectedCoin}`);
      }

      const currentPrice = currentCoinData.price;
      const riskAmountUSD = 100; // $100 risk per position
      const maxLossPercent = 5; // 5% max loss

      const calculatePositionSize = (price: number, riskAmount: number, maxLoss: number): number => {
        const maxLossAmount = riskAmount * (maxLoss / 100);
        return maxLossAmount / (price * (maxLoss / 100));
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
        strategy: selectedStrategy,
        trailingPercent: trailingPercent,
        maxLossPercent: maxLossPercent,
      });

      setPositions(prev => {
        const updated = [...prev, newPosition];
        updatePerformanceMetrics(updated);
        return updated;
      });

      const alert: TrailingStopAlert = {
        id: `alert_${generateUniqueId()}`,
        type: 'activation',
        message: `New ${selectedStrategy} position created for ${selectedCoin}`,
        position: newPosition,
        timestamp: Date.now(),
        severity: 'success',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);

    } catch (error) {
      console.error('Error creating new position:', error);
      const alert: TrailingStopAlert = {
        id: `alert_${generateUniqueId()}`,
        type: 'warning',
        message: `Failed to create position: ${error instanceof Error ? error.message : 'Unknown error'}`,
        position: {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'error',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  };

  // Analyze strategies performance
  const analyzeStrategies = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch candles data for analysis
      const response = await fetch(`/api/candles?symbol=${selectedSymbol}&timeframe=1h&limit=48`);
      const data = await response.json();

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error('Failed to fetch candles data');
      }

      // Perform strategy analysis
      const candles = data.data;
      const strategies: TrailingStopStrategy[] = ['percentage', 'atr', 'fibonacci', 'bollinger_bands', 'volume_profile'];
      const results: StrategyPerformance[] = [];

      for (const strategy of strategies) {
        // Simple backtest simulation
        let wins = 0;
        let losses = 0;
        let totalProfit = 0;
        let maxDrawdown = 0;
        let currentDrawdown = 0;
        const returns: number[] = [];

        for (let i = 10; i < candles.length - 1; i++) {
          const entryPrice = candles[i][4]; // Close price
          const exitPrice = candles[i + 1][4];
          const stopLoss = entryPrice * 0.98; // 2% stop loss

          if (exitPrice > entryPrice && exitPrice > stopLoss) {
            const profit = (exitPrice - entryPrice) / entryPrice * 100;
            wins++;
            totalProfit += profit;
            returns.push(profit);
            currentDrawdown = Math.max(0, currentDrawdown - profit);
          } else {
            const loss = (stopLoss - entryPrice) / entryPrice * 100;
            losses++;
            totalProfit += loss;
            returns.push(loss);
            currentDrawdown += Math.abs(loss);
            maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
          }
        }

        const totalTrades = wins + losses;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

        // Calculate Sharpe ratio
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = returns.length > 1 ? Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)) : 1;
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

        results.push({
          strategy,
          name: getStrategyDisplayName(strategy),
          performance: {
            winRate: Math.round(winRate * 100) / 100,
            avgProfit: Math.round(avgProfit * 100) / 100,
            maxDrawdown: Math.round(maxDrawdown * 100) / 100,
            sharpeRatio: Math.round(sharpeRatio * 100) / 100
          }
        });
      }

      // Sort by Sharpe ratio (best performing strategies first)
      results.sort((a, b) => b.performance.sharpeRatio - a.performance.sharpeRatio);

      setPerformanceData(results);

    } catch (error) {
      console.error('Strategy analysis failed:', error);
      const alert: TrailingStopAlert = {
        id: `alert_${generateUniqueId()}`,
        type: 'warning',
        message: `Strategy analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        position: {} as TrailingStopPosition,
        timestamp: Date.now(),
        severity: 'error',
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to get strategy display name
  const getStrategyDisplayName = (strategy: TrailingStopStrategy): string => {
    const names: Record<TrailingStopStrategy, string> = {
      'percentage': 'Percentage Based',
      'atr': 'ATR Based',
      'support_resistance': 'Support/Resistance',
      'dynamic': 'Dynamic Volatility',
      'hybrid': 'Hybrid Multi-Strategy',
      'fibonacci': 'Fibonacci Retracement',
      'bollinger_bands': 'Bollinger Bands',
      'volume_profile': 'Volume Profile',
      'smart_money': 'Smart Money Concepts',
      'ichimoku': 'Ichimoku Cloud',
      'pivot_points': 'Pivot Points'
    };
    return names[strategy] || strategy;
  };

  // Create demo position
  const createDemoPosition = async () => {
    if (!service) return;

    try {
      const position = await service.createPositionWithStrategy({
        symbol: selectedSymbol,
        side: 'sell',
        quantity: 0.01,
        strategy: selectedStrategy,
        strategyConfig: strategyConfig || {},
        maxLossPercent: 5,
        accountBalance: 1000,
        riskPercent: 2
      });
      
      setDemoPosition(position);
      service.startMonitoring();
    } catch (error) {
      console.error('Failed to create demo position:', error);
    }
  };

  // Stop demo position
  const stopDemoPosition = async () => {
    if (!service || !demoPosition) return;

    try {
      await service.removePosition(demoPosition.id);
      setDemoPosition(null);
      service.stopMonitoring();
    } catch (error) {
      console.error('Failed to stop demo position:', error);
    }
  };


  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-container)' }}>
      {/* Header */}
      <Card style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large" align="center">
                <TrophyOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                <div>
                  <Title level={2} style={{ margin: 0 }}>Advanced Trailing Stop System</Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    Hệ thống trailing stop nâng cao với 11 chiến lược và real-time monitoring
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size="middle" wrap>
                <Badge
                  status={isServiceRunning ? 'processing' : 'default'}
                  text={isServiceRunning ? 'Running' : 'Stopped'}
                />
                <Button
                  type={isServiceRunning ? 'default' : 'primary'}
                  icon={isServiceRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={isServiceRunning ? stopService : startService}
                >
                  {isServiceRunning ? 'Stop' : 'Start'} Service
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettings(!showSettings)}
                >
                  Settings
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Performance Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Positions"
                value={performance.totalPositions}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Active"
                value={performance.activePositions}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total P&L"
                value={performance.totalPnL}
                precision={2}
                prefix="$"
                valueStyle={{ color: performance.totalPnL >= 0 ? '#3f8600' : '#cf1322' }}
                suffix={`(${performance.totalPnLPercent >= 0 ? '+' : ''}${performance.totalPnLPercent.toFixed(1)}%)`}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Win Rate"
                value={performance.winRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: performance.winRate >= 50 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Configuration Panel */}
          <Col xs={24} lg={12}>
            <Card
              title="Strategy Configuration"
              size="small"
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<QuestionCircleOutlined />}
                    onClick={() => setShowQuickGuide(true)}
                    type="dashed"
                  >
                    Help
                  </Button>
                  <Button
                    size="small"
                    icon={<BookOutlined />}
                    href="/guide"
                    target="_blank"
                  >
                    Guide
                  </Button>
                </Space>
              }
            >
              <Form form={form} layout="vertical">
                <Form.Item label="Symbol">
                  <Select
                    value={selectedSymbol}
                    onChange={setSelectedSymbol}
                    style={{ width: '100%' }}
                  >
                    <Option value="BTC/USDT">BTC/USDT</Option>
                    <Option value="ETH/USDT">ETH/USDT</Option>
                    <Option value="PEPE/USDT">PEPE/USDT</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Strategy">
                  <StrategySelector
                    value={selectedStrategy}
                  onChange={setSelectedStrategy}
                  size="small"
                />
              </Form.Item>

              <StrategyConfigPanel
                strategy={selectedStrategy}
                onChange={setStrategyConfig}
              />

              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={createNewPosition}
                  disabled={!isServiceRunning}
                >
                  Create Position
                </Button>

                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={createDemoPosition}
                  disabled={!!demoPosition}
                >
                  Demo Position
                </Button>

                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={stopDemoPosition}
                  disabled={!demoPosition}
                >
                  Stop Demo
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* Alerts Panel */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BellOutlined />
                Real-time Alerts
                <Badge count={alerts.length} showZero />
              </Space>
            }
            size="small"
            style={{ height: 400 }}
          >
            <div style={{ height: 320, overflowY: 'auto' }}>
              <List
                dataSource={alerts.slice(0, 20)}
                rowKey="id"
                renderItem={(alert) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tag color={
                          alert.severity === 'success' ? 'green' :
                          alert.severity === 'warning' ? 'orange' :
                          alert.severity === 'error' ? 'red' : 'blue'
                        }>
                          {alert.type.toUpperCase()}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                      <Text style={{ fontSize: '13px', display: 'block', marginTop: 4 }}>
                        {alert.message}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Positions Panel */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <EnhancedTrailingStopPanel
            positions={positions}
            alerts={alerts}
            performance={performance}
            onPositionUpdate={handlePositionUpdate}
          />
        </Col>
      </Row>

      {/* Chart Visualization */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Price Chart with Trailing Stops" size="small">
            <EnhancedDemoCandlestickChart
              height={400}
            />
          </Card>
        </Col>
      </Row>

      {/* Strategy Performance Analysis */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="Strategy Performance Analysis"
            size="small"
            extra={
              <Button
                type="primary"
                size="small"
                loading={isAnalyzing}
                onClick={analyzeStrategies}
              >
                Analyze Strategies
              </Button>
            }
          >
            {performanceData.length > 0 ? (
              <Row gutter={[16, 16]}>
                {performanceData.slice(0, 6).map((item, index) => (
                  <Col xs={24} sm={12} lg={8} key={item.strategy}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Space direction="vertical" size="small">
                        <Badge
                          count={index + 1}
                          style={{ backgroundColor: index === 0 ? '#52c41a' : '#1890ff' }}
                        />
                        <Text strong>{item.name}</Text>
                        <Row gutter={8}>
                          <Col span={12}>
                            <Statistic
                              title="Win Rate"
                              value={item.performance.winRate}
                              precision={1}
                              suffix="%"
                              valueStyle={{
                                fontSize: '14px',
                                color: item.performance.winRate >= 50 ? '#52c41a' : '#ff4d4f'
                              }}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic
                              title="Avg Profit"
                              value={item.performance.avgProfit}
                              precision={2}
                              suffix="%"
                              valueStyle={{
                                fontSize: '14px',
                                color: item.performance.avgProfit >= 0 ? '#52c41a' : '#ff4d4f'
                              }}
                            />
                          </Col>
                        </Row>
                        <Progress
                          percent={Math.min(item.performance.sharpeRatio * 50, 100)}
                          size="small"
                          status={item.performance.sharpeRatio >= 1 ? 'success' : 'normal'}
                          format={() => `Sharpe: ${item.performance.sharpeRatio.toFixed(2)}`}
                        />
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Click "Analyze Strategies" to see performance comparison</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  </div>

  {/* Quick Guide Modal */}
  <QuickGuideModal
    visible={showQuickGuide}
    onClose={() => setShowQuickGuide(false)}
  />
  </>
  );
};
