'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Progress, 
  message, 
  Form, 
  Select, 
  DatePicker, 
  InputNumber,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  ExperimentOutlined, 
  TrophyOutlined,
  RiseOutlined,
  FallOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { aiBacktestingService } from '@/lib/aiBacktestingService';
import { BacktestConfig, PREDEFINED_STRATEGIES } from '@/types/backtesting';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface BacktestResult {
  id: string;
  name: string;
  nameVi: string;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  status: 'completed' | 'running' | 'failed';
}

export default function AIBacktestDemoPage() {
  const [form] = Form.useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['sma_crossover', 'rsi_oversold']);

  const strategies = [
    { value: 'sma_crossover', label: 'SMA Crossover', labelVi: 'Cắt SMA' },
    { value: 'rsi_oversold', label: 'RSI Oversold/Overbought', labelVi: 'RSI Quá bán/Quá mua' },
    { value: 'bollinger_bands', label: 'Bollinger Bands', labelVi: 'Dải Bollinger' },
    { value: 'macd_signal', label: 'MACD Signal', labelVi: 'Tín hiệu MACD' },
    { value: 'stochastic', label: 'Stochastic Oscillator', labelVi: 'Dao động Stochastic' }
  ];

  const symbols = [
    { value: 'BTC/USDT', label: 'Bitcoin (BTC/USDT)' },
    { value: 'ETH/USDT', label: 'Ethereum (ETH/USDT)' },
    { value: 'PEPE/USDT', label: 'Pepe (PEPE/USDT)' },
    { value: 'DOGE/USDT', label: 'Dogecoin (DOGE/USDT)' }
  ];

  const timeframes = [
    { value: '1m', label: '1 phút' },
    { value: '5m', label: '5 phút' },
    { value: '15m', label: '15 phút' },
    { value: '1h', label: '1 giờ' },
    { value: '4h', label: '4 giờ' },
    { value: '1d', label: '1 ngày' }
  ];

  const handleRunBacktest = async () => {
    try {
      const values = await form.validateFields();
      setIsRunning(true);
      setProgress(0);
      setResults([]);

      // Create backtest configuration
      const config: BacktestConfig = {
        symbol: values.symbol,
        timeframe: values.timeframe,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        initialCapital: values.initialCapital,
        positionSize: 10, // 10% per trade
        maxPositions: 3,
        commission: 0.1, // 0.1%
        slippage: 0.05, // 0.05%
        strategies: PREDEFINED_STRATEGIES.filter(s => selectedStrategies.includes(s.id))
      };

      // Progress callback
      const progressCallback = (prog: any) => {
        setProgress(prog.progress);
      };

      // Run real backtest
      const backtestResults = await aiBacktestingService.runBacktest(config, progressCallback);

      // Convert results to display format
      const displayResults: BacktestResult[] = backtestResults.map(result => ({
        id: result.id,
        name: result.id,
        nameVi: PREDEFINED_STRATEGIES.find(s => s.id === result.id)?.nameVi || result.id,
        totalReturn: result.performance.totalReturn,
        sharpeRatio: result.performance.sharpeRatio,
        winRate: result.performance.winRate,
        maxDrawdown: result.performance.maxDrawdown,
        totalTrades: result.performance.totalTrades,
        status: result.status as 'completed' | 'running' | 'failed'
      }));

      setResults(displayResults);
      message.success(`Hoàn thành backtest với ${displayResults.length} chiến lược!`);

      console.log('Backtest results:', backtestResults);
    } catch (error) {
      console.error('Backtest error:', error);
      message.error('Lỗi khi chạy backtest: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const columns = [
    {
      title: 'Chiến lược',
      dataIndex: 'nameVi',
      key: 'strategy',
      render: (text: string, record: BacktestResult) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Tag color="blue">{record.id}</Tag>
        </Space>
      )
    },
    {
      title: 'Tổng lợi nhuận',
      dataIndex: 'totalReturn',
      key: 'totalReturn',
      sorter: (a: BacktestResult, b: BacktestResult) => a.totalReturn - b.totalReturn,
      render: (value: number) => (
        <Space>
          {value >= 0 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {value.toFixed(2)}%
          </Text>
        </Space>
      )
    },
    {
      title: 'Sharpe Ratio',
      dataIndex: 'sharpeRatio',
      key: 'sharpeRatio',
      sorter: (a: BacktestResult, b: BacktestResult) => a.sharpeRatio - b.sharpeRatio,
      render: (value: number) => (
        <Text style={{ color: value >= 1 ? '#52c41a' : value >= 0 ? '#faad14' : '#ff4d4f' }}>
          {value.toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Tỷ lệ thắng',
      dataIndex: 'winRate',
      key: 'winRate',
      sorter: (a: BacktestResult, b: BacktestResult) => a.winRate - b.winRate,
      render: (value: number) => `${value.toFixed(1)}%`
    },
    {
      title: 'Max Drawdown',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      sorter: (a: BacktestResult, b: BacktestResult) => a.maxDrawdown - b.maxDrawdown,
      render: (value: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          -{value.toFixed(2)}%
        </Text>
      )
    },
    {
      title: 'Số giao dịch',
      dataIndex: 'totalTrades',
      key: 'totalTrades',
      sorter: (a: BacktestResult, b: BacktestResult) => a.totalTrades - b.totalTrades
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : status === 'running' ? 'processing' : 'error'}>
          {status === 'completed' ? 'Hoàn thành' : status === 'running' ? 'Đang chạy' : 'Lỗi'}
        </Tag>
      )
    }
  ];

  const getBestStrategy = () => {
    if (results.length === 0) return null;
    return results.reduce((best, current) => 
      current.sharpeRatio > best.sharpeRatio ? current : best
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Header */}
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2}>🤖 AI Trading Backtesting Demo</Title>
              <Text type="secondary">
                Hệ thống test giao dịch AI với dữ liệu lịch sử từ 2020-2024
              </Text>
            </div>
          </Card>

          {/* Alert */}
          <Alert
            message="Demo AI Backtesting System"
            description="Đây là phiên bản demo của hệ thống AI Backtesting. Kết quả được tạo ngẫu nhiên để minh họa giao diện và chức năng."
            type="info"
            showIcon
          />

          {/* Configuration */}
          <Card title="⚙️ Cấu hình Backtest">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                symbol: 'BTC/USDT',
                timeframe: '1h',
                dateRange: [dayjs().subtract(1, 'year'), dayjs()],
                initialCapital: 10000,
                strategies: ['sma_crossover', 'rsi_oversold']
              }}
            >
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Form.Item
                    label="Symbol"
                    name="symbol"
                    rules={[{ required: true, message: 'Vui lòng chọn symbol' }]}
                  >
                    <Select options={symbols} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item
                    label="Timeframe"
                    name="timeframe"
                    rules={[{ required: true, message: 'Vui lòng chọn timeframe' }]}
                  >
                    <Select options={timeframes} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item
                    label="Vốn ban đầu ($)"
                    name="initialCapital"
                    rules={[{ required: true, message: 'Vui lòng nhập vốn ban đầu' }]}
                  >
                    <InputNumber
                      min={1000}
                      max={100000}
                      step={1000}
                      style={{ width: '100%' }}
                      formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => {
                        const parsed = value?.replace(/\$\s?|(,*)/g, '') || '0';
                        const num = parseInt(parsed, 10);
                        return (num === 1000 || num === 100000) ? num : 1000;
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item
                    label="Khoảng thời gian"
                    name="dateRange"
                    rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
                  >
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Chiến lược"
                    name="strategies"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một chiến lược' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn các chiến lược để test"
                      options={strategies.map(s => ({ value: s.value, label: s.labelVi }))}
                      onChange={setSelectedStrategies}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRunBacktest}
                  loading={isRunning}
                  disabled={selectedStrategies.length === 0}
                >
                  {isRunning ? 'Đang chạy Backtest...' : 'Chạy Backtest'}
                </Button>
              </div>
            </Form>
          </Card>

          {/* Progress */}
          {isRunning && (
            <Card title="📊 Tiến độ">
              <Progress
                percent={progress}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary">Đang xử lý dữ liệu và chạy backtest...</Text>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <Card title="📈 Tổng quan kết quả">
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Statistic
                      title="Tổng số chiến lược"
                      value={results.length}
                      prefix={<ExperimentOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Chiến lược tốt nhất"
                      value={getBestStrategy()?.nameVi || 'N/A'}
                      prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Lợi nhuận cao nhất"
                      value={Math.max(...results.map(r => r.totalReturn)).toFixed(2)}
                      suffix="%"
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<RiseOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Sharpe Ratio tốt nhất"
                      value={Math.max(...results.map(r => r.sharpeRatio)).toFixed(2)}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>

              <Card title="📊 Chi tiết kết quả">
                <Table
                  columns={columns}
                  dataSource={results}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </>
          )}

          {/* Footer */}
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button href="/test-ai-backtest">Trang Test Khác</Button>
                <Button href="/" type="primary">Về trang chính</Button>
              </Space>
            </div>
          </Card>
        </Space>
      </div>
    </div>
  );
}
