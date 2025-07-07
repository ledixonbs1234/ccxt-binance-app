'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Space,
  Select,
  DatePicker,
  Button,
  Alert,
  Divider
} from 'antd';
import { 
  TrendingUpOutlined, 
  TrendingDownOutlined, 
  DollarOutlined,
  PercentageOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import { enhancedTrailingStopService } from '@/lib/enhancedTrailingStopService';
import { TrailingStopPosition, TrailingStopStrategy } from '@/types/trailingStop';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
}

interface StrategyPerformance {
  strategy: TrailingStopStrategy;
  metrics: PerformanceMetrics;
  positions: TrailingStopPosition[];
}

interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
  strategy: string;
  timestamp: Date;
  status: 'completed' | 'active' | 'cancelled';
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

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<StrategyPerformance[]>([]);
  const [overallMetrics, setOverallMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('7d');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);

  // Demo data for trade history when no real data is available
  const demoTradeHistory: TradeHistory[] = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      side: 'buy',
      entryPrice: 43250.00,
      exitPrice: 44100.00,
      quantity: 0.1,
      pnl: 85.00,
      pnlPercent: 1.97,
      duration: '2h 15m',
      strategy: 'Percentage Trailing',
      timestamp: new Date('2024-01-15T10:30:00'),
      status: 'completed'
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      side: 'buy',
      entryPrice: 2580.50,
      exitPrice: 2650.25,
      quantity: 2.5,
      pnl: 174.38,
      pnlPercent: 2.70,
      duration: '4h 45m',
      strategy: 'ATR Trailing',
      timestamp: new Date('2024-01-15T08:15:00'),
      status: 'completed'
    },
    {
      id: '3',
      symbol: 'PEPE/USDT',
      side: 'buy',
      entryPrice: 0.00000667,
      exitPrice: 0.00000645,
      quantity: 15000000,
      pnl: -33.00,
      pnlPercent: -3.30,
      duration: '1h 20m',
      strategy: 'Dynamic Trailing',
      timestamp: new Date('2024-01-15T06:00:00'),
      status: 'completed'
    },
    {
      id: '4',
      symbol: 'BTC/USDT',
      side: 'sell',
      entryPrice: 44200.00,
      exitPrice: 43850.00,
      quantity: 0.05,
      pnl: 17.50,
      pnlPercent: 0.79,
      duration: '3h 30m',
      strategy: 'Fibonacci Trailing',
      timestamp: new Date('2024-01-14T14:20:00'),
      status: 'completed'
    },
    {
      id: '5',
      symbol: 'ETH/USDT',
      side: 'buy',
      entryPrice: 2620.00,
      exitPrice: 2580.00,
      quantity: 1.8,
      pnl: -72.00,
      pnlPercent: -1.53,
      duration: '5h 10m',
      strategy: 'Bollinger Bands',
      timestamp: new Date('2024-01-14T09:45:00'),
      status: 'completed'
    }
  ];

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe, selectedStrategy]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Get all positions from service
      const allPositions = enhancedTrailingStopService.getAllPositions();
      const filteredPositions = filterPositionsByTimeframe(allPositions, selectedTimeframe);

      // Calculate overall metrics
      const overall = calculateMetrics(filteredPositions);
      setOverallMetrics(overall);

      // Calculate strategy-specific performance
      const strategyPerformance = calculateStrategyPerformance(filteredPositions);
      setPerformanceData(strategyPerformance);

      // Generate trade history from positions or use demo data
      const trades = filteredPositions.length > 0
        ? generateTradeHistoryFromPositions(filteredPositions)
        : demoTradeHistory;
      setTradeHistory(trades);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      // Use demo data on error
      setTradeHistory(demoTradeHistory);
    } finally {
      setLoading(false);
    }
  };

  const generateTradeHistoryFromPositions = (positions: TrailingStopPosition[]): TradeHistory[] => {
    return positions
      .filter(p => p.status === 'triggered' || p.status === 'cancelled')
      .map(position => ({
        id: position.id,
        symbol: position.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        quantity: position.quantity,
        pnl: position.unrealizedPnL,
        pnlPercent: position.unrealizedPnLPercent,
        duration: calculateDuration(position.createdAt, position.triggeredAt || Date.now()),
        strategy: STRATEGY_NAMES[position.strategy],
        timestamp: new Date(position.createdAt),
        status: position.status === 'triggered' ? 'completed' : 'cancelled'
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const calculateDuration = (startTime: number, endTime: number): string => {
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filterPositionsByTimeframe = (positions: TrailingStopPosition[], timeframe: string): TrailingStopPosition[] => {
    const now = Date.now();
    let cutoffTime = now;

    switch (timeframe) {
      case '1d':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        return positions;
    }

    return positions.filter(p => p.createdAt >= cutoffTime);
  };

  const calculateMetrics = (positions: TrailingStopPosition[]): PerformanceMetrics => {
    const completedPositions = positions.filter(p => p.status === 'triggered');

    if (completedPositions.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const pnls = completedPositions.map(p => p.unrealizedPnLPercent);
    const pnlsUSD = completedPositions.map(p => p.unrealizedPnL);
    const winningTrades = pnls.filter(pnl => pnl > 0);
    const losingTrades = pnls.filter(pnl => pnl < 0);

    const totalPnL = pnlsUSD.reduce((sum, pnl) => sum + pnl, 0);
    const totalPnLPercent = pnls.reduce((sum, pnl) => sum + pnl, 0);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0) / losingTrades.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    for (const pnl of pnls) {
      runningPnL += pnl;
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Simple Sharpe ratio calculation
    const avgReturn = totalPnL / completedPositions.length;
    const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / completedPositions.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
      totalTrades: completedPositions.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / completedPositions.length) * 100,
      totalPnL,
      totalPnLPercent,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio,
      bestTrade: Math.max(...pnls),
      worstTrade: Math.min(...pnls)
    };
  };

  const calculateStrategyPerformance = (positions: TrailingStopPosition[]): StrategyPerformance[] => {
    const strategyGroups: { [key: string]: TrailingStopPosition[] } = {};
    
    positions.forEach(position => {
      if (!strategyGroups[position.strategy]) {
        strategyGroups[position.strategy] = [];
      }
      strategyGroups[position.strategy].push(position);
    });

    return Object.entries(strategyGroups).map(([strategy, strategyPositions]) => ({
      strategy: strategy as TrailingStopStrategy,
      metrics: calculateMetrics(strategyPositions),
      positions: strategyPositions
    }));
  };

  const getPnLColor = (value: number) => {
    return value >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#52c41a';
    if (winRate >= 50) return '#faad14';
    return '#ff4d4f';
  };

  // Chart data preparation
  const pnlChartData = performanceData.map(item => ({
    strategy: STRATEGY_NAMES[item.strategy],
    pnl: item.metrics.totalPnL,
    winRate: item.metrics.winRate
  }));

  const strategyDistributionData = performanceData.map(item => ({
    type: STRATEGY_NAMES[item.strategy],
    value: item.positions.length
  }));

  const strategyColumns = [
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy: TrailingStopStrategy) => (
        <Tag color="blue">{STRATEGY_NAMES[strategy]}</Tag>
      )
    },
    {
      title: 'Total Trades',
      dataIndex: ['metrics', 'totalTrades'],
      key: 'totalTrades'
    },
    {
      title: 'Win Rate',
      dataIndex: ['metrics', 'winRate'],
      key: 'winRate',
      render: (winRate: number) => (
        <Text style={{ color: getWinRateColor(winRate) }}>
          {winRate.toFixed(1)}%
        </Text>
      )
    },
    {
      title: 'Total P&L',
      dataIndex: ['metrics', 'totalPnL'],
      key: 'totalPnL',
      render: (pnl: number) => (
        <Text style={{ color: getPnLColor(pnl) }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </Text>
      )
    },
    {
      title: 'Profit Factor',
      dataIndex: ['metrics', 'profitFactor'],
      key: 'profitFactor',
      render: (pf: number) => pf.toFixed(2)
    },
    {
      title: 'Max Drawdown',
      dataIndex: ['metrics', 'maxDrawdown'],
      key: 'maxDrawdown',
      render: (dd: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          -{dd.toFixed(2)}%
        </Text>
      )
    },
    {
      title: 'Sharpe Ratio',
      dataIndex: ['metrics', 'sharpeRatio'],
      key: 'sharpeRatio',
      render: (sr: number) => sr.toFixed(2)
    }
  ];

  return (
    <div className="performance-dashboard">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={3} style={{ margin: 0 }}>
              📊 Performance Dashboard
            </Title>
            <Space>
              <Select
                value={selectedTimeframe}
                onChange={setSelectedTimeframe}
                style={{ width: 120 }}
              >
                <Option value="1d">1 Day</Option>
                <Option value="7d">7 Days</Option>
                <Option value="30d">30 Days</Option>
                <Option value="90d">90 Days</Option>
                <Option value="all">All Time</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadPerformanceData}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Overall Metrics */}
        {overallMetrics && (
          <Card title="📈 Overall Performance">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Total Trades"
                  value={overallMetrics.totalTrades}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Win Rate"
                  value={overallMetrics.winRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: getWinRateColor(overallMetrics.winRate) }}
                  prefix={<PercentageOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total P&L"
                  value={overallMetrics.totalPnL}
                  precision={2}
                  prefix="$"
                  suffix={`(${overallMetrics.totalPnLPercent >= 0 ? '+' : ''}${overallMetrics.totalPnLPercent.toFixed(1)}%)`}
                  valueStyle={{ color: getPnLColor(overallMetrics.totalPnL) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Profit Factor"
                  value={overallMetrics.profitFactor}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Best Trade"
                  value={overallMetrics.bestTrade}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Worst Trade"
                  value={overallMetrics.worstTrade}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Max Drawdown"
                  value={overallMetrics.maxDrawdown}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Sharpe Ratio"
                  value={overallMetrics.sharpeRatio}
                  precision={2}
                  prefix={<LineChartOutlined />}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card title="📊 Strategy P&L Comparison">
              {pnlChartData.length > 0 ? (
                <Column
                  data={pnlChartData}
                  xField="strategy"
                  yField="pnl"
                  seriesField="strategy"
                  color={({ pnl }) => pnl >= 0 ? '#52c41a' : '#ff4d4f'}
                  label={{
                    position: 'middle',
                    style: {
                      fill: '#FFFFFF',
                      opacity: 0.6,
                    },
                  }}
                  meta={{
                    pnl: {
                      alias: 'P&L (%)',
                    },
                  }}
                />
              ) : (
                <Alert message="No data available" type="info" />
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card title="🥧 Strategy Distribution">
              {strategyDistributionData.length > 0 ? (
                <Pie
                  data={strategyDistributionData}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  label={{
                    type: 'outer',
                    content: '{name} ({percentage})',
                  }}
                  interactions={[{ type: 'element-active' }]}
                />
              ) : (
                <Alert message="No data available" type="info" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Trade History Table */}
        <Card title="📈 Trade History">
          <Table
            dataSource={tradeHistory}
            columns={[
              {
                title: 'Symbol',
                dataIndex: 'symbol',
                key: 'symbol',
                render: (symbol: string) => <Text strong>{symbol}</Text>
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
                render: (price: number, record: TradeHistory) => {
                  const precision = record.symbol.includes('PEPE') ? 10 : 2;
                  return <Text>{price.toFixed(precision)}</Text>;
                }
              },
              {
                title: 'Exit Price',
                dataIndex: 'exitPrice',
                key: 'exitPrice',
                render: (price: number, record: TradeHistory) => {
                  const precision = record.symbol.includes('PEPE') ? 10 : 2;
                  return <Text>{price.toFixed(precision)}</Text>;
                }
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (qty: number, record: TradeHistory) => {
                  const precision = record.symbol.includes('PEPE') ? 0 : 4;
                  return <Text>{qty.toLocaleString(undefined, { maximumFractionDigits: precision })}</Text>;
                }
              },
              {
                title: 'P&L',
                dataIndex: 'pnl',
                key: 'pnl',
                render: (pnl: number, record: TradeHistory) => (
                  <Space>
                    <Text style={{ color: pnl >= 0 ? '#3f8600' : '#cf1322' }}>
                      ${pnl.toFixed(2)}
                    </Text>
                    <Text style={{ color: record.pnlPercent >= 0 ? '#3f8600' : '#cf1322' }}>
                      ({record.pnlPercent >= 0 ? '+' : ''}{record.pnlPercent.toFixed(2)}%)
                    </Text>
                  </Space>
                )
              },
              {
                title: 'Duration',
                dataIndex: 'duration',
                key: 'duration'
              },
              {
                title: 'Strategy',
                dataIndex: 'strategy',
                key: 'strategy',
                render: (strategy: string) => <Tag color="blue">{strategy}</Tag>
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                  <Tag color={
                    status === 'completed' ? 'green' :
                    status === 'cancelled' ? 'red' : 'orange'
                  }>
                    {status.toUpperCase()}
                  </Tag>
                )
              },
              {
                title: 'Time',
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (timestamp: Date) => (
                  <Text type="secondary">
                    {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
                  </Text>
                )
              }
            ]}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Strategy Performance Table */}
        <Card title="📋 Strategy Performance Breakdown">
          <Table
            dataSource={performanceData}
            columns={strategyColumns}
            rowKey="strategy"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  );
}
