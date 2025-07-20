// File: components/integrated/trading/PositionManager.tsx
'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag,
  Progress,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  Alert,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  CloseOutlined, 
  EditOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import { stateUtils } from '../../../lib/stateSync';

const { Text, Title } = Typography;
const { Option } = Select;

interface PositionManagerProps {
  className?: string;
}

export default function PositionManager({ className = '' }: PositionManagerProps) {
  const { state: tradingState, closePosition, updateStopLoss, updateTakeProfit } = useEnhancedTrading();
  const { addNotification } = useNotification();
  
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [closeForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const handleClosePosition = async (values: any) => {
    try {
      // Calculate the amount to close based on percentage
      const percentage = values.percentage || 100;
      const amountToClose = percentage === 100 ? undefined : (selectedPosition.size * percentage) / 100;

      // Note: The current closePosition function doesn't support limit price
      // TODO: Enhance closePosition to support limit orders with price parameter
      await closePosition(selectedPosition.id, amountToClose);
      
      addNotification({
        type: 'success',
        title: 'Position Closed',
        message: `${selectedPosition.symbol} position closed successfully`,
        category: 'trading',
        priority: 'high',
        persistent: false,
      });
      
      setShowCloseModal(false);
      setSelectedPosition(null);
      closeForm.resetFields();
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Close Position Failed',
        message: error.message || 'Failed to close position',
        category: 'trading',
        priority: 'high',
        persistent: true,
      });
    }
  };

  const handleEditPosition = async (values: any) => {
    try {
      if (values.stopLoss) {
        await updateStopLoss(selectedPosition.id, values.stopLoss);
      }
      if (values.takeProfit) {
        await updateTakeProfit(selectedPosition.id, values.takeProfit);
      }
      
      addNotification({
        type: 'success',
        title: 'Position Updated',
        message: `${selectedPosition.symbol} position updated successfully`,
        category: 'trading',
        priority: 'medium',
        persistent: false,
      });
      
      setShowEditModal(false);
      setSelectedPosition(null);
      editForm.resetFields();
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Update Position Failed',
        message: error.message || 'Failed to update position',
        category: 'trading',
        priority: 'high',
        persistent: true,
      });
    }
  };

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <Text strong>{symbol}</Text>
      ),
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      render: (side: 'long' | 'short') => (
        <Tag color={side === 'long' ? 'green' : 'red'}>
          {side.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      align: 'right' as const,
      render: (size: number, record: any) => (
        <div>
          <Text>{size.toFixed(6)}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            ${(size * record.entryPrice).toFixed(2)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Entry Price',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      align: 'right' as const,
      render: (price: number) => (
        <Text className="font-mono">
          ${stateUtils.formatPrice(price, 'BTCUSDT')}
        </Text>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      align: 'right' as const,
      render: (price: number) => (
        <Text className="font-mono">
          ${stateUtils.formatPrice(price, 'BTCUSDT')}
        </Text>
      ),
    },
    {
      title: 'PnL',
      key: 'pnl',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const isProfit = record.unrealizedPnl >= 0;
        return (
          <div>
            <Text className={isProfit ? 'text-green-600' : 'text-red-600'}>
              {isProfit ? '+' : ''}${record.unrealizedPnl.toFixed(2)}
            </Text>
            <br />
            <Text 
              className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}
            >
              {isProfit ? '+' : ''}{record.unrealizedPnlPercent.toFixed(2)}%
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Stop Loss',
      dataIndex: 'stopLoss',
      key: 'stopLoss',
      align: 'right' as const,
      render: (stopLoss: number) => (
        <Text className="font-mono text-red-600">
          {stopLoss ? `$${stateUtils.formatPrice(stopLoss, 'BTCUSDT')}` : '-'}
        </Text>
      ),
    },
    {
      title: 'Take Profit',
      dataIndex: 'takeProfit',
      key: 'takeProfit',
      align: 'right' as const,
      render: (takeProfit: number) => (
        <Text className="font-mono text-green-600">
          {takeProfit ? `$${stateUtils.formatPrice(takeProfit, 'BTCUSDT')}` : '-'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Edit Position">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedPosition(record);
                editForm.setFieldsValue({
                  stopLoss: record.stopLoss,
                  takeProfit: record.takeProfit,
                });
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Close Position">
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => {
                setSelectedPosition(record);
                setShowCloseModal(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calculate portfolio summary
  const portfolioSummary = {
    totalPositions: tradingState.positions.length,
    totalValue: tradingState.positions.reduce((sum, pos) => sum + (pos.size * pos.currentPrice), 0),
    totalPnL: tradingState.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0),
    totalPnLPercent: tradingState.positions.length > 0 
      ? tradingState.positions.reduce((sum, pos) => sum + pos.unrealizedPnlPercent, 0) / tradingState.positions.length 
      : 0,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Summary */}
      <Card title="Portfolio Summary" size="small">
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Positions"
              value={portfolioSummary.totalPositions}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Value"
              value={portfolioSummary.totalValue}
              precision={2}
              prefix="$"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total PnL"
              value={portfolioSummary.totalPnL}
              precision={2}
              prefix={portfolioSummary.totalPnL >= 0 ? '+$' : '-$'}
              valueStyle={{ 
                color: portfolioSummary.totalPnL >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Avg PnL %"
              value={Math.abs(portfolioSummary.totalPnLPercent)}
              precision={2}
              suffix="%"
              prefix={portfolioSummary.totalPnLPercent >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: portfolioSummary.totalPnLPercent >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Positions Table */}
      <Card 
        title="Open Positions" 
        extra={
          <Text type="secondary">
            {tradingState.positions.length} position{tradingState.positions.length !== 1 ? 's' : ''}
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={tradingState.positions}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <Text type="secondary">No open positions</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Close Position Modal */}
      <Modal
        title="Close Position"
        open={showCloseModal}
        onCancel={() => {
          setShowCloseModal(false);
          setSelectedPosition(null);
          closeForm.resetFields();
        }}
        footer={null}
      >
        {selectedPosition && (
          <div className="space-y-4">
            <Alert
              message={`Closing ${selectedPosition.symbol} position`}
              description={`Current PnL: ${selectedPosition.unrealizedPnl >= 0 ? '+' : ''}$${selectedPosition.unrealizedPnl.toFixed(2)} (${selectedPosition.unrealizedPnlPercent.toFixed(2)}%)`}
              type="info"
              showIcon
            />
            
            <Form
              form={closeForm}
              layout="vertical"
              onFinish={handleClosePosition}
              initialValues={{ percentage: 100 }}
            >
              <Form.Item
                label="Close Percentage"
                name="percentage"
                rules={[{ required: true, message: 'Please enter percentage' }]}
              >
                <Select>
                  <Option value={25}>25%</Option>
                  <Option value={50}>50%</Option>
                  <Option value={75}>75%</Option>
                  <Option value={100}>100%</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Limit Price (Optional)" name="price">
                <Input
                  type="number"
                  prefix={<DollarOutlined />}
                  placeholder="Market price if empty"
                />
              </Form.Item>
              
              <Form.Item className="!mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={() => setShowCloseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" danger>
                    Close Position
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Edit Position Modal */}
      <Modal
        title="Edit Position"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedPosition(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        {selectedPosition && (
          <div className="space-y-4">
            <Alert
              message={`Editing ${selectedPosition.symbol} position`}
              description={`Entry: $${selectedPosition.entryPrice.toFixed(2)} | Current: $${selectedPosition.currentPrice.toFixed(2)}`}
              type="info"
              showIcon
            />
            
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleEditPosition}
            >
              <Form.Item label="Stop Loss Price" name="stopLoss">
                <Input
                  type="number"
                  prefix={<DollarOutlined />}
                  placeholder="Set stop loss price"
                />
              </Form.Item>
              
              <Form.Item label="Take Profit Price" name="takeProfit">
                <Input
                  type="number"
                  prefix={<DollarOutlined />}
                  placeholder="Set take profit price"
                />
              </Form.Item>
              
              <Form.Item className="!mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Update Position
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
