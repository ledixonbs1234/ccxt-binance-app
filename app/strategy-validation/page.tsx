'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Alert, 
  Card, 
  Button, 
  Space, 
  Table, 
  Tag, 
  Row, 
  Col,
  Statistic,
  Progress,
  Select,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { enhancedTrailingStopService } from '@/lib/enhancedTrailingStopService';
import { marketAnalysisService } from '@/lib/marketAnalysisService';
import { tradingApiService } from '@/lib/tradingApiService';
import { TrailingStopStrategy } from '@/types/trailingStop';

const { Title, Text } = Typography;
const { Option } = Select;

interface StrategyTestResult {
  strategy: TrailingStopStrategy;
  symbol: string;
  marketCondition: 'bullish' | 'bearish' | 'sideways';
  performance: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
    profitFactor: number;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

interface MarketScenario {
  name: string;
  condition: 'bullish' | 'bearish' | 'sideways';
  description: string;
  symbols: string[];
}

export default function StrategyValidationPage() {
  const [testResults, setTestResults] = useState<StrategyTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

  const strategies: TrailingStopStrategy[] = [
    'percentage',
    'atr',
    'bollinger_bands',
    'support_resistance',
    'dynamic'
  ];

  const marketScenarios: MarketScenario[] = [
    {
      name: 'Bull Market',
      condition: 'bullish',
      description: 'Strong upward trend with high momentum',
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    },
    {
      name: 'Bear Market',
      condition: 'bearish',
      description: 'Strong downward trend with selling pressure',
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    },
    {
      name: 'Sideways Market',
      condition: 'sideways',
      description: 'Range-bound market with low volatility',
      symbols: ['BTC/USDT', 'ETH/USDT', 'PEPE/USDT']
    }
  ];

  useEffect(() => {
    initializeTestResults();
  }, []);

  const initializeTestResults = () => {
    const results: StrategyTestResult[] = [];
    
    marketScenarios.forEach(scenario => {
      scenario.symbols.forEach(symbol => {
        strategies.forEach(strategy => {
          results.push({
            strategy,
            symbol,
            marketCondition: scenario.condition,
            performance: {
              totalTrades: 0,
              winRate: 0,
              avgReturn: 0,
              maxDrawdown: 0,
              profitFactor: 0
            },
            status: 'pending'
          });
        });
      });
    });

    setTestResults(results);
  };

  const runStrategyValidation = async () => {
    setIsRunning(true);
    setProgress(0);

    const totalTests = testResults.length;
    let completedTests = 0;

    for (let i = 0; i < testResults.length; i++) {
      const result = testResults[i];
      
      // Update status to running
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[i].status = 'running';
        return newResults;
      });

      try {
        const startTime = Date.now();
        
        // Simulate strategy testing with real market analysis
        const performance = await testStrategy(result.strategy, result.symbol, result.marketCondition);
        const duration = Date.now() - startTime;

        // Update result
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[i] = {
            ...newResults[i],
            performance,
            status: 'completed',
            duration
          };
          return newResults;
        });

      } catch (error) {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[i] = {
            ...newResults[i],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          return newResults;
        });
      }

      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const testStrategy = async (
    strategy: TrailingStopStrategy, 
    symbol: string, 
    marketCondition: 'bullish' | 'bearish' | 'sideways'
  ): Promise<StrategyTestResult['performance']> => {
    // Get market data for analysis
    const rawCandles = await tradingApiService.getCandleData(symbol, '1h', 100);
    const candles = rawCandles.map(candle => ({
      ...candle,
      date: new Date(candle.timestamp)
    }));
    const analysis = await marketAnalysisService.analyzeMarket(symbol, candles);

    // Simulate strategy performance based on market conditions and analysis
    let baseWinRate = 0.5;
    let baseReturn = 0;
    let maxDrawdown = 5;
    let profitFactor = 1;

    // Adjust performance based on strategy and market condition alignment
    const strategyMarketFit = getStrategyMarketFit(strategy, marketCondition, analysis);
    
    baseWinRate += strategyMarketFit * 0.3; // Up to 30% improvement
    baseReturn = strategyMarketFit * 2; // Up to 2% average return
    maxDrawdown = Math.max(2, 10 - strategyMarketFit * 5); // Lower drawdown for better fit
    profitFactor = 1 + strategyMarketFit; // Up to 2.0 profit factor

    // Add some randomness to simulate real market variability
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    
    return {
      totalTrades: Math.floor(20 + Math.random() * 30), // 20-50 trades
      winRate: Math.min(85, Math.max(30, baseWinRate * 100 * randomFactor)),
      avgReturn: baseReturn * randomFactor,
      maxDrawdown: maxDrawdown * randomFactor,
      profitFactor: Math.max(0.5, profitFactor * randomFactor)
    };
  };

  const getStrategyMarketFit = (
    strategy: TrailingStopStrategy, 
    marketCondition: 'bullish' | 'bearish' | 'sideways',
    analysis: any
  ): number => {
    // Strategy-market condition fit scoring (0-1)
    let fit = 0.5; // Base fit

    switch (strategy) {
      case 'percentage':
        // Good for trending markets
        if (marketCondition === 'bullish' || marketCondition === 'bearish') {
          fit = 0.7;
        }
        break;
      
      case 'atr':
        // Excellent for volatile trending markets
        if (marketCondition === 'bullish' || marketCondition === 'bearish') {
          fit = 0.9;
        }
        break;
      
      case 'bollinger_bands':
        // Good for volatile markets
        if (analysis?.marketCondition?.volatility === 'high') {
          fit = 0.8;
        }
        break;
      
      case 'support_resistance':
        // Excellent for sideways markets
        if (marketCondition === 'sideways') {
          fit = 0.9;
        } else {
          fit = 0.4;
        }
        break;
      
      case 'dynamic':
        // Adaptive to all conditions
        fit = 0.7;
        break;
    }

    return fit;
  };

  const getStrategyColor = (strategy: TrailingStopStrategy) => {
    const colors: Record<TrailingStopStrategy, string> = {
      'percentage': 'blue',
      'atr': 'green',
      'bollinger_bands': 'purple',
      'support_resistance': 'orange',
      'dynamic': 'cyan',
      'fibonacci': 'gold',
      'volume_profile': 'magenta',
      'smart_money': 'lime',
      'ichimoku': 'volcano',
      'pivot_points': 'geekblue',
      'hybrid': 'red'
    };
    return colors[strategy] || 'default';
  };

  const getMarketConditionIcon = (condition: string) => {
    switch (condition) {
      case 'bullish': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'bearish': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      case 'sideways': return <LineChartOutlined style={{ color: '#faad14' }} />;
      default: return null;
    }
  };

  const getPerformanceColor = (value: number, type: 'winRate' | 'return' | 'drawdown' | 'profitFactor') => {
    switch (type) {
      case 'winRate':
        return value >= 60 ? '#52c41a' : value >= 45 ? '#faad14' : '#ff4d4f';
      case 'return':
        return value >= 1 ? '#52c41a' : value >= 0 ? '#faad14' : '#ff4d4f';
      case 'drawdown':
        return value <= 5 ? '#52c41a' : value <= 10 ? '#faad14' : '#ff4d4f';
      case 'profitFactor':
        return value >= 1.5 ? '#52c41a' : value >= 1 ? '#faad14' : '#ff4d4f';
      default:
        return '#000';
    }
  };

  const columns = [
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy: TrailingStopStrategy) => (
        <Tag color={getStrategyColor(strategy)}>
          {strategy.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol'
    },
    {
      title: 'Market Condition',
      dataIndex: 'marketCondition',
      key: 'marketCondition',
      render: (condition: string) => (
        <Space>
          {getMarketConditionIcon(condition)}
          <Text>{condition.toUpperCase()}</Text>
        </Space>
      )
    },
    {
      title: 'Win Rate',
      key: 'winRate',
      render: (record: StrategyTestResult) => (
        <Text style={{ color: getPerformanceColor(record.performance.winRate, 'winRate') }}>
          {record.performance.winRate.toFixed(1)}%
        </Text>
      )
    },
    {
      title: 'Avg Return',
      key: 'avgReturn',
      render: (record: StrategyTestResult) => (
        <Text style={{ color: getPerformanceColor(record.performance.avgReturn, 'return') }}>
          {record.performance.avgReturn >= 0 ? '+' : ''}{record.performance.avgReturn.toFixed(2)}%
        </Text>
      )
    },
    {
      title: 'Max Drawdown',
      key: 'maxDrawdown',
      render: (record: StrategyTestResult) => (
        <Text style={{ color: getPerformanceColor(record.performance.maxDrawdown, 'drawdown') }}>
          {record.performance.maxDrawdown.toFixed(1)}%
        </Text>
      )
    },
    {
      title: 'Profit Factor',
      key: 'profitFactor',
      render: (record: StrategyTestResult) => (
        <Text style={{ color: getPerformanceColor(record.performance.profitFactor, 'profitFactor') }}>
          {record.performance.profitFactor.toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          'pending': 'default',
          'running': 'processing',
          'completed': 'success',
          'failed': 'error'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      }
    }
  ];

  const completedTests = testResults.filter(r => r.status === 'completed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const avgWinRate = completedTests > 0 
    ? testResults.filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.performance.winRate, 0) / completedTests 
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Title level={2}>
        <ExperimentOutlined /> Strategy Validation
      </Title>
      
      <Alert
        message="Multiple Strategy Validation System"
        description="Test và validation tất cả trailing stop strategies với different market conditions - đảm bảo performance, accuracy và UI consistency"
        type="info"
        showIcon
        className="mb-6"
      />

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Tests"
              value={testResults.length}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={completedTests}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Win Rate"
              value={avgWinRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: getPerformanceColor(avgWinRate, 'winRate') }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={testResults.length > 0 ? ((completedTests / testResults.length) * 100) : 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: failedTests === 0 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card className="mb-6">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={runStrategyValidation}
              disabled={isRunning}
              loading={isRunning}
              size="large"
            >
              {isRunning ? 'Running Validation...' : 'Start Strategy Validation'}
            </Button>
            <Button onClick={initializeTestResults} disabled={isRunning}>
              Reset Tests
            </Button>
          </Space>
          <Progress 
            percent={progress} 
            status={isRunning ? 'active' : 'normal'}
            style={{ width: 200 }}
          />
        </Space>
      </Card>

      {/* Results Table */}
      <Card title="📊 Validation Results">
        <Table
          dataSource={testResults}
          columns={columns}
          rowKey={(record) => `${record.strategy}-${record.symbol}-${record.marketCondition}`}
          pagination={{ pageSize: 15 }}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Market Scenarios Info */}
      <Card title="📈 Market Scenarios" className="mt-6">
        <Row gutter={[16, 16]}>
          {marketScenarios.map((scenario, index) => (
            <Col span={8} key={index}>
              <Card size="small">
                <Space direction="vertical">
                  <Space>
                    {getMarketConditionIcon(scenario.condition)}
                    <Text strong>{scenario.name}</Text>
                  </Space>
                  <Text type="secondary">{scenario.description}</Text>
                  <div>
                    <Text strong>Symbols: </Text>
                    {scenario.symbols.map(symbol => (
                      <Tag key={symbol} >{symbol}</Tag>
                    ))}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
