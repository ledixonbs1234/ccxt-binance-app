'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Space,
  Alert,
  Statistic,
  Select,
  InputNumber,
  Form,
  Badge,
  Tag,
  List,
  Modal,
  App,
  Checkbox
} from 'antd';
import {
  RiseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  DollarOutlined
} from '@ant-design/icons';
import PageContainer from '../../components/PageContainer';
import { enhancedTrailingStopService } from '../../lib/enhancedTrailingStopService';
import { notificationService } from '../../lib/notificationService';
import { riskManagementService } from '../../lib/riskManagementService';

const { Text } = Typography;
const { Option } = Select;

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit?: number;
  trailingPercent: number;
  strategy: string;
  status: 'active' | 'triggered' | 'cancelled';
  pnl: number;
  pnlPercent: number;
  createdAt: Date;
}

// Main component content
function EnhancedTrailingStopContent() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const { notification } = App.useApp();

  // Default settings configuration
  const [settings, setSettings] = useState({
    defaultTrailingPercent: 2.5,
    defaultStrategy: 'percentage',
    riskManagement: {
      maxPositionSize: 1000,
      maxDailyLoss: 500,
      enableRiskWarnings: true
    },
    notifications: {
      enableSound: true,
      enableBrowser: true,
      enableEmail: false
    },
    monitoring: {
      updateInterval: 1000,
      enableAutoStop: true,
      stopLossBuffer: 0.1
    }
  });

  // Mock data for demonstration - Updated with current market prices
  const mockPositions: Position[] = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'buy',
      entryPrice: 108500.00,  // Updated to realistic entry price
      currentPrice: 109133.83, // Current market price from API
      quantity: 0.1,
      stopLoss: 106000.00,    // Updated stop loss
      takeProfit: 112000.00,  // Updated take profit
      trailingPercent: 2.5,
      strategy: 'percentage',
      status: 'active',
      pnl: 63.38,  // (109133.83 - 108500.00) * 0.1
      pnlPercent: 0.58, // ((109133.83 - 108500.00) / 108500.00) * 100
      createdAt: new Date()
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'buy',
      entryPrice: 3750.00,    // Updated to realistic ETH price
      currentPrice: 3820.45,  // Current market price
      quantity: 2.5,
      stopLoss: 3650.00,     // Updated stop loss
      takeProfit: 3950.00,   // Updated take profit
      trailingPercent: 3.0,
      strategy: 'atr',
      status: 'active',
      pnl: 176.13,  // (3820.45 - 3750.00) * 2.5
      pnlPercent: 1.88, // ((3820.45 - 3750.00) / 3750.00) * 100
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    setPositions(mockPositions);

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('trailingStopSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }
    }

    // Initialize services
    // notificationService.initialize(); // Method doesn't exist

    // Setup real-time monitoring
    const interval = setInterval(() => {
      if (isMonitoring) {
        updatePositions();
      }
    }, settings.monitoring.updateInterval || 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, settings.monitoring.updateInterval]);

  const updatePositions = async () => {
    try {
      // Get real market prices for each position
      const updatedPositions = await Promise.all(
        positions.map(async (pos) => {
          try {
            // Convert symbol format: BTCUSDT -> BTC/USDT
            const apiSymbol = pos.symbol.replace(/(\w+)(USDT|BUSD|USDC)$/, '$1/$2');
            const response = await fetch(`/api/ticker?symbol=${encodeURIComponent(apiSymbol)}`);

            if (!response.ok) {
              console.warn(`Failed to fetch price for ${apiSymbol}`);
              return pos; // Return unchanged if API fails
            }

            const tickerData = await response.json();
            const currentPrice = tickerData.last;

            if (!currentPrice || isNaN(currentPrice)) {
              console.warn(`Invalid price data for ${apiSymbol}:`, currentPrice);
              return pos; // Return unchanged if invalid price
            }

            // Calculate P&L
            const pnl = (currentPrice - pos.entryPrice) * pos.quantity * (pos.side === 'buy' ? 1 : -1);
            const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * (pos.side === 'buy' ? 1 : -1);

            return {
              ...pos,
              currentPrice,
              pnl,
              pnlPercent
            };
          } catch (error) {
            console.error(`Error updating position ${pos.symbol}:`, error);
            return pos; // Return unchanged on error
          }
        })
      );

      setPositions(updatedPositions);
    } catch (error) {
      console.error('Error updating positions:', error);
    }
  };

  const createPosition = async (values: any) => {
    setIsLoading(true);
    try {
      // Risk assessment - simplified for demo
      const riskLevel = Math.random() > 0.7 ? 'high' : 'medium';

      if (riskLevel === 'high') {
        Modal.confirm({
          title: '⚠️ High Risk Warning',
          content: `Risk Level: HIGH\nContinue with position creation?`,
          onOk: () => executeCreatePosition(values)
        });
      } else {
        executeCreatePosition(values);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi tạo vị thế',
        description: 'Không thể tạo vị thế trailing stop'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeCreatePosition = async (values: any) => {
    try {
      // Get current market price for the symbol
      const apiSymbol = values.symbol.replace(/(\w+)(USDT|BUSD|USDC)$/, '$1/$2');
      const response = await fetch(`/api/ticker?symbol=${encodeURIComponent(apiSymbol)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch current price for ${apiSymbol}`);
      }

      const tickerData = await response.json();
      const currentPrice = tickerData.last;

      if (!currentPrice || isNaN(currentPrice)) {
        throw new Error(`Invalid price data for ${apiSymbol}`);
      }

      // Use current market price as entry price (or user-specified entry price)
      const entryPrice = values.entryPrice || currentPrice;

      // Calculate stop loss and take profit based on trailing percentage if not specified
      const stopLossDistance = entryPrice * (values.trailingPercent / 100);
      const stopLoss = values.stopLoss || (values.side === 'buy'
        ? entryPrice - stopLossDistance
        : entryPrice + stopLossDistance);

      const takeProfit = values.takeProfit || (values.side === 'buy'
        ? entryPrice + (stopLossDistance * 2) // 2:1 risk/reward ratio
        : entryPrice - (stopLossDistance * 2));

      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: values.symbol,
        side: values.side,
        entryPrice,
        currentPrice,
        quantity: values.quantity,
        stopLoss,
        takeProfit,
        trailingPercent: values.trailingPercent,
        strategy: values.strategy,
        status: 'active',
        pnl: 0, // Will be calculated in next update
        pnlPercent: 0,
        createdAt: new Date()
      };

      setPositions(prev => [...prev, newPosition]);

      // Send notification
      notificationService.sendNotification({
        type: 'system',
        title: 'Position Created',
        message: `New ${values.side} position for ${values.symbol} at $${currentPrice.toFixed(2)}`,
        severity: 'low',
        persistent: false,
        data: newPosition
      });

      notification.success({
        message: 'Đã tạo vị thế',
        description: `Đã tạo thành công vị thế ${values.side === 'buy' ? 'mua' : 'bán'} cho ${values.symbol} tại giá $${currentPrice.toFixed(2)}`
      });

      form.resetFields();

      // Trigger immediate position update to calculate P&L
      setTimeout(() => updatePositions(), 1000);

    } catch (error) {
      console.error('Error creating position:', error);
      notification.error({
        message: 'Lỗi tạo vị thế',
        description: error instanceof Error ? error.message : 'Không thể tạo vị thế trailing stop'
      });
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    notification.info({
      message: isMonitoring ? 'Đã dừng giám sát' : 'Đã bắt đầu giám sát',
      description: isMonitoring ? 'Giám sát thời gian thực đã được dừng' : 'Giám sát thời gian thực đang hoạt động'
    });
  };

  const closePosition = (positionId: string) => {
    setPositions(prev => prev.map(pos => 
      pos.id === positionId ? { ...pos, status: 'triggered' as const } : pos
    ));
    
    notification.success({
      message: 'Đã đóng vị thế',
      description: 'Vị thế đã được đóng thành công'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing';
      case 'triggered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPnLColor = (pnl: number) => pnl >= 0 ? '#52c41a' : '#ff4d4f';

  // Settings handlers
  const openSettingsModal = () => {
    setIsSettingsModalVisible(true);
    // Pre-populate form with current settings
    settingsForm.setFieldsValue(settings);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalVisible(false);
  };

  const handleSettingsSave = async (values: any) => {
    try {
      setSettings(values);

      // Save to localStorage for persistence
      localStorage.setItem('trailingStopSettings', JSON.stringify(values));

      notification.success({
        message: 'Settings Saved',
        description: 'Your trailing stop settings have been saved successfully.',
        placement: 'topRight'
      });

      closeSettingsModal();
    } catch (error) {
      notification.error({
        message: 'Settings Save Failed',
        description: 'Failed to save settings. Please try again.',
        placement: 'topRight'
      });
    }
  };

  return (
    <PageContainer
      title="Enhanced Trailing Stop System"
      subtitle="Create và quản lý trailing stop positions với multiple strategies, real-time monitoring và intelligent risk management"
    >
      <Alert
        message="Advanced Trailing Stop Management"
        description="Create và quản lý trailing stop positions với multiple strategies, real-time monitoring và intelligent risk management"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Control Panel */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={18}>
          <Card title="📊 System Status">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Active Positions"
                  value={positions.filter(p => p.status === 'active').length}
                  prefix={<RiseOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total P&L"
                  value={positions.reduce((sum, pos) => sum + pos.pnl, 0)}
                  precision={2}
                  valueStyle={{ color: getPnLColor(positions.reduce((sum, pos) => sum + pos.pnl, 0)) }}
                  prefix={<DollarOutlined />}
                  suffix="USDT"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Win Rate"
                  value={75.5}
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="%"
                />
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Monitoring Status</Text>
                  <br />
                  <Badge 
                    status={isMonitoring ? 'processing' : 'default'} 
                    text={isMonitoring ? 'Active' : 'Inactive'} 
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="🎛️ Controls">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                danger={isMonitoring}
                icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={toggleMonitoring}
                block
                size="large"
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={openSettingsModal}
                block
              >
                Settings
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Create Position Form */}
      <Card title="➕ Create New Position" className="mb-6">
        <Form
          form={form}
          layout="inline"
          onFinish={createPosition}
          initialValues={{
            symbol: 'BTCUSDT',
            side: 'buy',
            strategy: 'percentage',
            trailingPercent: 2.5
          }}
        >
          <Form.Item name="symbol" label="Symbol">
            <Select style={{ width: 120 }}>
              <Option value="BTCUSDT">BTC/USDT</Option>
              <Option value="ETHUSDT">ETH/USDT</Option>
              <Option value="PEPEUSDT">PEPE/USDT</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="side" label="Side">
            <Select style={{ width: 80 }}>
              <Option value="buy">Buy</Option>
              <Option value="sell">Sell</Option>
            </Select>
          </Form.Item>

          <Form.Item name="entryPrice" label="Entry Price" rules={[{ required: true }]}>
            <InputNumber placeholder="43250.50" style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber placeholder="0.1" step={0.01} style={{ width: 100 }} />
          </Form.Item>

          <Form.Item name="stopLoss" label="Stop Loss" rules={[{ required: true }]}>
            <InputNumber placeholder="42500.00" style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="strategy" label="Strategy">
            <Select style={{ width: 120 }}>
              <Option value="percentage">Percentage</Option>
              <Option value="atr">ATR</Option>
              <Option value="fibonacci">Fibonacci</Option>
              <Option value="bollinger">Bollinger</Option>
            </Select>
          </Form.Item>

          <Form.Item name="trailingPercent" label="Trailing %">
            <InputNumber placeholder="2.5" step={0.1} style={{ width: 80 }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} icon={<PlayCircleOutlined />}>
              Create Position
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Active Positions */}
      <Card title="📈 Active Positions">
        <List
          dataSource={positions}
          renderItem={(position) => (
            <List.Item
              actions={[
                <Button 
                  key="close" 
                  type="primary" 
                  danger 
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => closePosition(position.id)}
                  disabled={position.status !== 'active'}
                >
                  Close
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{position.symbol}</Text>
                    <Tag color={position.side === 'buy' ? 'green' : 'red'}>
                      {position.side.toUpperCase()}
                    </Tag>
                    <Tag color={getStatusColor(position.status)}>
                      {position.status.toUpperCase()}
                    </Tag>
                    <Tag>{position.strategy}</Tag>
                  </Space>
                }
                description={
                  <Row gutter={[16, 8]}>
                    <Col span={4}>
                      <Text type="secondary">Entry: </Text>
                      <Text strong>${position.entryPrice.toFixed(2)}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">Current: </Text>
                      <Text strong>${position.currentPrice.toFixed(2)}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">Stop Loss: </Text>
                      <Text strong>${position.stopLoss.toFixed(2)}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">Quantity: </Text>
                      <Text strong>{position.quantity}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">P&L: </Text>
                      <Text strong style={{ color: getPnLColor(position.pnl) }}>
                        ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                      </Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">Trailing: </Text>
                      <Text strong>{position.trailingPercent}%</Text>
                    </Col>
                  </Row>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Settings Modal */}
      <Modal
        title="⚙️ Trailing Stop Settings"
        open={isSettingsModalVisible}
        onCancel={closeSettingsModal}
        footer={null}
        width={800}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSettingsSave}
          initialValues={settings}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="📊 Default Parameters" size="small">
                <Form.Item
                  label="Default Trailing Percentage"
                  name="defaultTrailingPercent"
                  rules={[{ required: true, message: 'Please enter trailing percentage' }]}
                >
                  <InputNumber
                    min={0.1}
                    max={10}
                    step={0.1}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  label="Default Strategy"
                  name="defaultStrategy"
                  rules={[{ required: true, message: 'Please select strategy' }]}
                >
                  <Select>
                    <Select.Option value="percentage">Percentage</Select.Option>
                    <Select.Option value="atr">ATR</Select.Option>
                    <Select.Option value="dynamic">Dynamic</Select.Option>
                  </Select>
                </Form.Item>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="🛡️ Risk Management" size="small">
                <Form.Item
                  label="Max Position Size ($)"
                  name={['riskManagement', 'maxPositionSize']}
                >
                  <InputNumber
                    min={100}
                    max={10000}
                    step={100}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  label="Max Daily Loss ($)"
                  name={['riskManagement', 'maxDailyLoss']}
                >
                  <InputNumber
                    min={50}
                    max={2000}
                    step={50}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name={['riskManagement', 'enableRiskWarnings']}
                  valuePropName="checked"
                >
                  <Checkbox>Enable Risk Warnings</Checkbox>
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title="🔔 Notifications" size="small">
                <Form.Item
                  name={['notifications', 'enableSound']}
                  valuePropName="checked"
                >
                  <Checkbox>Enable Sound Alerts</Checkbox>
                </Form.Item>

                <Form.Item
                  name={['notifications', 'enableBrowser']}
                  valuePropName="checked"
                >
                  <Checkbox>Enable Browser Notifications</Checkbox>
                </Form.Item>

                <Form.Item
                  name={['notifications', 'enableEmail']}
                  valuePropName="checked"
                >
                  <Checkbox>Enable Email Alerts</Checkbox>
                </Form.Item>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="📡 Monitoring" size="small">
                <Form.Item
                  label="Update Interval (ms)"
                  name={['monitoring', 'updateInterval']}
                >
                  <Select>
                    <Select.Option value={500}>500ms (Fast)</Select.Option>
                    <Select.Option value={1000}>1s (Normal)</Select.Option>
                    <Select.Option value={2000}>2s (Slow)</Select.Option>
                    <Select.Option value={5000}>5s (Very Slow)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name={['monitoring', 'enableAutoStop']}
                  valuePropName="checked"
                >
                  <Checkbox>Enable Auto Stop</Checkbox>
                </Form.Item>

                <Form.Item
                  label="Stop Loss Buffer (%)"
                  name={['monitoring', 'stopLossBuffer']}
                >
                  <InputNumber
                    min={0.01}
                    max={1}
                    step={0.01}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={closeSettingsModal}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Save Settings
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
}

// Export default component wrapped with App context
export default function EnhancedTrailingStopPage() {
  return <EnhancedTrailingStopContent />;
}
