// File: components/integrated/backtesting/BacktestRunner.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Progress,
  Alert,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Spin,
  Statistic,
  Tag,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface BacktestRunnerProps {
  strategy?: any;
  onBacktestComplete?: (results: any) => void;
  className?: string;
}

interface BacktestConfig {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
}

interface BacktestProgress {
  current: number;
  total: number;
  stage: string;
  message: string;
}

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'ADAUSDT', label: 'ADA/USDT' },
  { value: 'DOTUSDT', label: 'DOT/USDT' },
  { value: 'LINKUSDT', label: 'LINK/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'MATICUSDT', label: 'MATIC/USDT' }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' }
];

export default function BacktestRunner({ 
  strategy, 
  onBacktestComplete,
  className = '' 
}: BacktestRunnerProps) {
  const [form] = Form.useForm();
  const { addNotification } = useNotification();
  
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    startDate: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    initialCapital: 10000,
    commission: 0.1,
    slippage: 0.05
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BacktestProgress>({
    current: 0,
    total: 100,
    stage: 'idle',
    message: 'Ready to start backtest'
  });
  
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Calculate estimated time based on config
  useEffect(() => {
    const start = dayjs(config.startDate);
    const end = dayjs(config.endDate);
    const days = end.diff(start, 'day');
    
    // Rough estimation based on timeframe and date range
    const timeframeMultiplier = {
      '1m': 1440,
      '5m': 288,
      '15m': 96,
      '1h': 24,
      '4h': 6,
      '1d': 1
    };
    
    const dataPoints = days * (timeframeMultiplier[config.timeframe as keyof typeof timeframeMultiplier] || 24);
    const estimatedSeconds = Math.max(5, Math.min(300, dataPoints / 1000)); // 5s to 5min
    
    setEstimatedTime(estimatedSeconds);
  }, [config]);

  const simulateBacktest = async () => {
    if (!strategy) {
      addNotification({
        type: 'error',
        title: 'No Strategy',
        message: 'Please create or select a strategy first',
        category: 'backtesting',
        priority: 'high',
        persistent: true,
      });
      return;
    }

    setIsRunning(true);
    setStartTime(Date.now());
    
    try {
      // Stage 1: Data Loading
      setProgress({
        current: 10,
        total: 100,
        stage: 'loading',
        message: 'Loading historical data...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 2: Indicator Calculation
      setProgress({
        current: 30,
        total: 100,
        stage: 'indicators',
        message: 'Calculating technical indicators...'
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 3: Strategy Execution
      setProgress({
        current: 60,
        total: 100,
        stage: 'execution',
        message: 'Executing strategy logic...'
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 4: Performance Calculation
      setProgress({
        current: 90,
        total: 100,
        stage: 'analysis',
        message: 'Calculating performance metrics...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 5: Complete
      setProgress({
        current: 100,
        total: 100,
        stage: 'complete',
        message: 'Backtest completed successfully!'
      });

      // Generate mock results
      const mockResults = {
        strategy: strategy,
        config: config,
        performance: {
          totalReturn: Math.random() * 100 - 20, // -20% to 80%
          annualizedReturn: Math.random() * 50 - 10, // -10% to 40%
          sharpeRatio: Math.random() * 3,
          maxDrawdown: Math.random() * -30, // 0% to -30%
          winRate: 40 + Math.random() * 40, // 40% to 80%
          profitFactor: 0.8 + Math.random() * 1.5, // 0.8 to 2.3
          totalTrades: Math.floor(50 + Math.random() * 200),
          avgTrade: Math.random() * 2 - 0.5, // -0.5% to 1.5%
        },
        trades: generateMockTrades(),
        equity: generateMockEquityCurve(),
        drawdown: generateMockDrawdown(),
        completedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      onBacktestComplete?.(mockResults);
      
      addNotification({
        type: 'success',
        title: 'Backtest Complete',
        message: `Strategy "${strategy.name}" backtested successfully`,
        category: 'backtesting',
        priority: 'high',
        persistent: false,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Backtest Failed',
        message: error.message || 'An error occurred during backtesting',
        category: 'backtesting',
        priority: 'high',
        persistent: true,
      });
      
      setProgress({
        current: 0,
        total: 100,
        stage: 'error',
        message: 'Backtest failed'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const generateMockTrades = () => {
    const trades = [];
    const numTrades = Math.floor(20 + Math.random() * 50);
    
    for (let i = 0; i < numTrades; i++) {
      trades.push({
        id: i + 1,
        entryTime: dayjs(config.startDate).add(Math.random() * 365, 'day').toISOString(),
        exitTime: dayjs(config.startDate).add(Math.random() * 365, 'day').toISOString(),
        side: Math.random() > 0.5 ? 'long' : 'short',
        entryPrice: 30000 + Math.random() * 40000,
        exitPrice: 30000 + Math.random() * 40000,
        quantity: Math.random() * 0.1,
        pnl: (Math.random() - 0.4) * 1000, // Slightly negative bias
        pnlPercent: (Math.random() - 0.4) * 10,
        commission: Math.random() * 10,
        duration: Math.floor(Math.random() * 24 * 60) // minutes
      });
    }
    
    return trades.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
  };

  const generateMockEquityCurve = () => {
    const points = [];
    let equity = config.initialCapital;
    const numPoints = 100;
    
    for (let i = 0; i <= numPoints; i++) {
      const change = (Math.random() - 0.48) * equity * 0.02; // Slight upward bias
      equity += change;
      
      points.push({
        date: dayjs(config.startDate).add((i / numPoints) * 365, 'day').format('YYYY-MM-DD'),
        equity: Math.max(equity, config.initialCapital * 0.3) // Don't go below 30%
      });
    }
    
    return points;
  };

  const generateMockDrawdown = () => {
    const points = [];
    let peak = config.initialCapital;
    let current = config.initialCapital;
    const numPoints = 100;
    
    for (let i = 0; i <= numPoints; i++) {
      const change = (Math.random() - 0.48) * current * 0.02;
      current += change;
      
      if (current > peak) {
        peak = current;
      }
      
      const drawdown = ((current - peak) / peak) * 100;
      
      points.push({
        date: dayjs(config.startDate).add((i / numPoints) * 365, 'day').format('YYYY-MM-DD'),
        drawdown: Math.min(drawdown, 0)
      });
    }
    
    return points;
  };

  const stopBacktest = () => {
    setIsRunning(false);
    setProgress({
      current: 0,
      total: 100,
      stage: 'stopped',
      message: 'Backtest stopped by user'
    });
    
    addNotification({
      type: 'warning',
      title: 'Backtest Stopped',
      message: 'Backtest was stopped by user',
      category: 'backtesting',
      priority: 'medium',
      persistent: false,
    });
  };

  const getProgressColor = () => {
    switch (progress.stage) {
      case 'complete': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'stopped': return '#faad14';
      default: return '#1890ff';
    }
  };

  return (
    <div className={`${className}`}>
      <Card 
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">Backtest Runner</Title>
            <Space>
              {!isRunning ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={simulateBacktest}
                  disabled={!strategy}
                >
                  Run Backtest
                </Button>
              ) : (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={stopBacktest}
                >
                  Stop Backtest
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Strategy Info */}
          {strategy && (
            <Alert
              message={`Strategy: ${strategy.name}`}
              description={strategy.description}
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          {/* Configuration */}
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Symbol">
                  <Select
                    value={config.symbol}
                    onChange={(value) => setConfig(prev => ({ ...prev, symbol: value }))}
                    className="w-full"
                  >
                    {SYMBOLS.map(symbol => (
                      <Option key={symbol.value} value={symbol.value}>
                        {symbol.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Timeframe">
                  <Select
                    value={config.timeframe}
                    onChange={(value) => setConfig(prev => ({ ...prev, timeframe: value }))}
                    className="w-full"
                  >
                    {TIMEFRAMES.map(tf => (
                      <Option key={tf.value} value={tf.value}>
                        {tf.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Initial Capital">
                  <InputNumber
                    value={config.initialCapital}
                    onChange={(value) => setConfig(prev => ({ ...prev, initialCapital: value || 10000 }))}
                    className="w-full"
                    min={1000}
                    max={1000000}
                    step={1000}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Commission (%)">
                  <InputNumber
                    value={config.commission}
                    onChange={(value) => setConfig(prev => ({ ...prev, commission: value || 0.1 }))}
                    className="w-full"
                    min={0}
                    max={1}
                    step={0.01}
                    precision={3}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Date Range">
                  <RangePicker
                    value={[dayjs(config.startDate), dayjs(config.endDate)]}
                    onChange={(dates) => {
                      if (dates) {
                        setConfig(prev => ({
                          ...prev,
                          startDate: dates[0]!.format('YYYY-MM-DD'),
                          endDate: dates[1]!.format('YYYY-MM-DD')
                        }));
                      }
                    }}
                    className="w-full"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="Slippage (%)">
                  <InputNumber
                    value={config.slippage}
                    onChange={(value) => setConfig(prev => ({ ...prev, slippage: value || 0.05 }))}
                    className="w-full"
                    min={0}
                    max={1}
                    step={0.01}
                    precision={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {/* Progress */}
          {(isRunning || progress.stage !== 'idle') && (
            <div className="space-y-4">
              <Divider />
              
              <div className="flex items-center justify-between">
                <Text strong>Backtest Progress</Text>
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">
                    Est. {estimatedTime}s
                  </Text>
                </Space>
              </div>
              
              <Progress
                percent={progress.current}
                status={progress.stage === 'error' ? 'exception' : 
                       progress.stage === 'complete' ? 'success' : 'active'}
                strokeColor={getProgressColor()}
              />
              
              <div className="flex items-center justify-between">
                <Text type="secondary">{progress.message}</Text>
                <Tag color={getProgressColor()}>
                  {progress.stage.toUpperCase()}
                </Tag>
              </div>
              
              {isRunning && (
                <div className="text-center">
                  <Spin size="small" />
                  <Text type="secondary" className="ml-2">
                    Running backtest...
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
