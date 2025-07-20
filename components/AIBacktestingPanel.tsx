'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Switch,
  Divider,
  Typography,
  Space,
  Alert,
  Progress,
  Table,
  Tag,
  Statistic,
  Tabs,
  Tooltip,
  Modal,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ExperimentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  BacktestConfig,
  BacktestResult,
  BacktestStrategy,
  BacktestProgress,
  PREDEFINED_STRATEGIES,
  DEFAULT_BACKTEST_CONFIG
} from '@/types/backtesting';
import { aiBacktestingService } from '@/lib/aiBacktestingService';
// Import components will be created separately

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
// Removed deprecated TabPane import

interface AIBacktestingPanelProps {
  className?: string;
}

export default function AIBacktestingPanel({ className }: AIBacktestingPanelProps) {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<BacktestConfig>(DEFAULT_BACKTEST_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BacktestProgress | null>(null);
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('config');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadAvailableSymbols();
    loadPreviousResults();
  }, []);

  const loadAvailableSymbols = async () => {
    try {
      const symbols = await aiBacktestingService.getAvailableSymbols();
      setAvailableSymbols(symbols);
    } catch (error) {
      console.error('Error loading symbols:', error);
      message.error('Không thể tải danh sách symbols');
    }
  };

  const loadPreviousResults = () => {
    const previousResults = aiBacktestingService.getAllResults();
    setResults(previousResults);
  };

  const handleConfigChange = (changedValues: any, allValues: any) => {
    setConfig({ ...config, ...allValues });
  };

  const handleRunBacktest = async () => {
    try {
      await form.validateFields();
      setIsRunning(true);
      setProgress(null);
      setActiveTab('progress');

      const backtestConfig: BacktestConfig = {
        ...config,
        startDate: form.getFieldValue('dateRange')[0].format('YYYY-MM-DD'),
        endDate: form.getFieldValue('dateRange')[1].format('YYYY-MM-DD'),
        strategies: config.strategies.filter(s => s.enabled)
      };

      const progressCallback = (prog: BacktestProgress) => {
        setProgress(prog);
      };

      const backtestResults = await aiBacktestingService.runBacktest(
        backtestConfig,
        progressCallback
      );

      setResults(prev => [...prev, ...backtestResults]);
      setSelectedResults(backtestResults.map(r => r.id));
      setActiveTab('results');
      
      message.success(`Hoàn thành backtest với ${backtestResults.length} chiến lược`);
    } catch (error) {
      console.error('Backtest error:', error);
      message.error('Lỗi khi chạy backtest: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleStopBacktest = () => {
    setIsRunning(false);
    setProgress(null);
    message.info('Đã dừng backtest');
  };

  const handleStrategyToggle = (strategyId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => 
        s.id === strategyId ? { ...s, enabled } : s
      )
    }));
  };

  const handleExportResults = async (format: 'csv' | 'json') => {
    if (selectedResults.length === 0) {
      message.warning('Vui lòng chọn ít nhất một kết quả để xuất');
      return;
    }

    try {
      const blob = await aiBacktestingService.exportResults(selectedResults, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtest_results_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success(`Đã xuất ${selectedResults.length} kết quả thành file ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Lỗi khi xuất file');
    }
  };

  const handleClearResults = () => {
    Modal.confirm({
      title: 'Xóa tất cả kết quả?',
      content: 'Bạn có chắc chắn muốn xóa tất cả kết quả backtest?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: () => {
        aiBacktestingService.clearResults();
        setResults([]);
        setSelectedResults([]);
        message.success('Đã xóa tất cả kết quả');
      }
    });
  };

  const getEnabledStrategiesCount = () => {
    return config.strategies.filter(s => s.enabled).length;
  };

  const getBestResult = () => {
    if (results.length === 0) return null;
    return results.reduce((best, current) => 
      current.performance.sharpeRatio > best.performance.sharpeRatio ? current : best
    );
  };

  return (
    <div className={className}>
      <Card>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>
                🤖 AI Trading Backtesting
              </Title>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadPreviousResults}
                  disabled={isRunning}
                >
                  Tải lại
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  Cài đặt nâng cao
                </Button>
              </Space>
            </div>
          </Col>

          <Col span={24}>
            <Alert
              message="AI Backtesting System"
              description="Hệ thống test giao dịch AI với dữ liệu lịch sử từ 2020-2024. Hỗ trợ nhiều chiến lược, phân tích hiệu suất chi tiết và so sánh strategies."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>

          <Col span={24}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'config',
                  label: '⚙️ Cấu hình',
                  children: (
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    symbol: config.symbol,
                    timeframe: config.timeframe,
                    dateRange: [dayjs(config.startDate), dayjs(config.endDate)],
                    initialCapital: config.initialCapital,
                    positionSize: config.positionSize,
                    maxPositions: config.maxPositions,
                    commission: config.commission,
                    slippage: config.slippage
                  }}
                  onValuesChange={handleConfigChange}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Form.Item
                        label="Symbol"
                        name="symbol"
                        rules={[{ required: true, message: 'Vui lòng chọn symbol' }]}
                      >
                        <Select
                          placeholder="Chọn symbol"
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={availableSymbols.map(symbol => ({
                            value: symbol,
                            label: symbol
                          }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        label="Timeframe"
                        name="timeframe"
                        rules={[{ required: true, message: 'Vui lòng chọn timeframe' }]}
                      >
                        <Select
                          options={aiBacktestingService.getAvailableTimeframes().map(tf => ({
                            value: tf,
                            label: tf
                          }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        label="Khoảng thời gian"
                        name="dateRange"
                        rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
                      >
                        <RangePicker
                          style={{ width: '100%' }}
                          format="YYYY-MM-DD"
                          disabledDate={(current) => current && current > dayjs().endOf('day')}
                        />
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
                          max={1000000}
                          step={1000}
                          style={{ width: '100%' }}
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item
                        label="Kích thước vị thế (%)"
                        name="positionSize"
                        rules={[{ required: true, message: 'Vui lòng nhập kích thước vị thế' }]}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          step={1}
                          style={{ width: '100%' }}
                          formatter={(value) => `${value}%`}
                          parser={(value) => value!.replace('%', '')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item
                        label="Số vị thế tối đa"
                        name="maxPositions"
                        rules={[{ required: true, message: 'Vui lòng nhập số vị thế tối đa' }]}
                      >
                        <InputNumber
                          min={1}
                          max={10}
                          step={1}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item label="Phí giao dịch (%)">
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item name="commission" noStyle>
                            <InputNumber
                              min={0}
                              max={1}
                              step={0.01}
                              style={{ width: '50%' }}
                              formatter={(value) => `${value}%`}
                              parser={(value) => value!.replace('%', '')}
                            />
                          </Form.Item>
                          <Form.Item name="slippage" noStyle>
                            <InputNumber
                              min={0}
                              max={1}
                              step={0.01}
                              style={{ width: '50%' }}
                              placeholder="Slippage"
                              formatter={(value) => `${value}%`}
                              parser={(value) => value!.replace('%', '')}
                            />
                          </Form.Item>
                        </Space.Compact>
                      </Form.Item>
                    </Col>
                  </Row>

                  {showAdvanced && (
                    <>
                      <Divider>Cài đặt nâng cao</Divider>
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Alert
                            message="Cài đặt nâng cao"
                            description="Các tùy chọn này dành cho người dùng có kinh nghiệm. Thay đổi có thể ảnh hưởng đến kết quả backtest."
                            type="warning"
                            showIcon
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                </Form>

                <Divider>Chiến lược giao dịch</Divider>
                
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text strong>
                        Đã chọn {getEnabledStrategiesCount()}/{config.strategies.length} chiến lược
                      </Text>
                      <Space>
                        <Button
                          size="small"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            strategies: prev.strategies.map(s => ({ ...s, enabled: true }))
                          }))}
                        >
                          Chọn tất cả
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            strategies: prev.strategies.map(s => ({ ...s, enabled: false }))
                          }))}
                        >
                          Bỏ chọn tất cả
                        </Button>
                      </Space>
                    </div>
                  </Col>

                  {config.strategies.map((strategy) => (
                    <Col span={8} key={strategy.id}>
                      <Card
                        size="small"
                        style={{
                          border: strategy.enabled ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          backgroundColor: strategy.enabled ? '#f6ffed' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Text strong>{strategy.nameVi}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {strategy.descriptionVi}
                            </Text>
                            <br />
                            <Tag color={getStrategyTypeColor(strategy.type)} style={{ marginTop: 4 }}>
                              {getStrategyTypeLabel(strategy.type)}
                            </Tag>
                          </div>
                          <Switch
                            checked={strategy.enabled}
                            onChange={(checked) => handleStrategyToggle(strategy.id, checked)}
                            size="small"
                          />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Space>
                      <Button
                        type="primary"
                        size="large"
                        icon={<PlayCircleOutlined />}
                        onClick={handleRunBacktest}
                        loading={isRunning}
                        disabled={getEnabledStrategiesCount() === 0}
                      >
                        {isRunning ? 'Đang chạy Backtest...' : 'Chạy Backtest'}
                      </Button>
                      
                      {isRunning && (
                        <Button
                          icon={<PauseCircleOutlined />}
                          onClick={handleStopBacktest}
                        >
                          Dừng
                        </Button>
                      )}

                      <Tooltip title="Số chiến lược được chọn">
                        <Tag color="blue">
                          {getEnabledStrategiesCount()} strategies
                        </Tag>
                      </Tooltip>
                    </Space>
                  </Col>
                </Row>
                  )
                },
                {
                  key: 'progress',
                  label: '📊 Tiến độ',
                  children: (
                {progress ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Progress
                      percent={Math.round(progress.progress)}
                      status={isRunning ? 'active' : 'success'}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <Text>{progress.currentStepVi}</Text>
                    <Text type="secondary">
                      Đã xử lý: {progress.processedCandles}/{progress.totalCandles} nến
                    </Text>
                    {progress.currentDate && (
                      <Text type="secondary">
                        Ngày hiện tại: {progress.currentDate}
                      </Text>
                    )}
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Text type="secondary">Chưa có tiến độ nào để hiển thị</Text>
                  </div>
                )}
                  )
                },
                {
                  key: 'results',
                  label: '📈 Kết quả',
                  children: (
                {results.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Text strong>Tổng cộng: {results.length} kết quả</Text>
                            {getBestResult() && (
                              <Tag color="gold" icon={<TrophyOutlined />}>
                                Tốt nhất: {getBestResult()!.id}
                              </Tag>
                            )}
                          </Space>
                          <Space>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={() => handleExportResults('csv')}
                              disabled={selectedResults.length === 0}
                            >
                              Xuất CSV
                            </Button>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={() => handleExportResults('json')}
                              disabled={selectedResults.length === 0}
                            >
                              Xuất JSON
                            </Button>
                            <Button
                              danger
                              onClick={handleClearResults}
                              disabled={results.length === 0}
                            >
                              Xóa tất cả
                            </Button>
                          </Space>
                        </div>
                      </Col>
                    </Row>

                    {/* Strategy Comparison Table - Component will be imported when available */}
                    <div style={{
                      border: '1px dashed #d9d9d9',
                      borderRadius: '6px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#fafafa'
                    }}>
                      <Text type="secondary">Strategy Comparison Table sẽ được hiển thị ở đây</Text>
                    </div>

                    {selectedResults.length > 0 && (
                      <>
                        <Divider>Biểu đồ hiệu suất</Divider>
                        {/* Backtest Results Chart - Component will be imported when available */}
                        <div style={{
                          border: '1px dashed #d9d9d9',
                          borderRadius: '6px',
                          padding: '40px',
                          textAlign: 'center',
                          backgroundColor: '#fafafa'
                        }}>
                          <Text type="secondary">Backtest Results Chart sẽ được hiển thị ở đây</Text>
                        </div>
                      </>
                    )}
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <ExperimentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <br />
                    <Text type="secondary">Chưa có kết quả backtest nào</Text>
                    <br />
                    <Text type="secondary">Hãy cấu hình và chạy backtest để xem kết quả</Text>
                  </div>
                )}
                  )
                }
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}

function getStrategyTypeColor(type: string): string {
  const colors: Record<string, string> = {
    trend_following: 'blue',
    mean_reversion: 'green',
    momentum: 'orange',
    breakout: 'red',
    ai_ml: 'purple'
  };
  return colors[type] || 'default';
}

function getStrategyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trend_following: 'Theo xu hướng',
    mean_reversion: 'Hồi quy',
    momentum: 'Động lượng',
    breakout: 'Đột phá',
    ai_ml: 'AI/ML'
  };
  return labels[type] || type;
}
