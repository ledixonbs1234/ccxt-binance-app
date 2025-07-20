// File: components/integrated/trading/OrderHistory.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag,
  Select,
  DatePicker,
  Input,
  Tooltip,
  Modal,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import { stateUtils } from '../../../lib/stateSync';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrderHistoryProps {
  className?: string;
}

export default function OrderHistory({ className = '' }: OrderHistoryProps) {
  const { state: tradingState, cancelOrder } = useEnhancedTrading();
  const { addNotification } = useNotification();
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    side: 'all',
    symbol: '',
    dateRange: null as any,
  });
  const [loading, setLoading] = useState(false);

  // Filter orders based on current filters
  const filteredOrders = tradingState.orderHistory.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.side !== 'all' && order.side !== filters.side) return false;
    if (filters.symbol && !order.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
    if (filters.dateRange && filters.dateRange.length === 2) {
      const orderDate = dayjs(order.createdAt);
      if (orderDate.isBefore(filters.dateRange[0]) || orderDate.isAfter(filters.dateRange[1])) return false;
    }
    return true;
  });

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      addNotification({
        type: 'success',
        title: 'Order Cancelled',
        message: 'Order cancelled successfully',
        category: 'trading',
        priority: 'medium',
        persistent: false,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Cancel Order Failed',
        message: error.message || 'Failed to cancel order',
        category: 'trading',
        priority: 'high',
        persistent: true,
      });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Order history is automatically updated in the state, so we just need to refresh the account
      // which will trigger any necessary updates
      addNotification({
        type: 'success',
        title: 'Orders Refreshed',
        message: 'Order history updated successfully',
        category: 'trading',
        priority: 'low',
        persistent: false,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error.message || 'Failed to refresh order history',
        category: 'trading',
        priority: 'medium',
        persistent: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'green';
      case 'cancelled': return 'red';
      case 'pending': return 'blue';
      case 'partial': return 'orange';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: number) => (
        <div>
          <Text className="text-xs">
            {dayjs(timestamp).format('MM/DD HH:mm')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (symbol: string) => (
        <Text strong className="font-mono text-sm">
          {symbol}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      width: 70,
      render: (side: 'buy' | 'sell') => (
        <Tag color={side === 'buy' ? 'green' : 'red'}>
          {side.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 100,
      render: (amount: number, record: any) => (
        <div>
          <Text className="text-sm">{amount.toFixed(6)}</Text>
          {record.filled && record.filled !== amount && (
            <div>
              <Text type="secondary" className="text-xs">
                Filled: {record.filled.toFixed(6)}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      width: 100,
      render: (price: number, record: any) => (
        <div>
          <Text className="font-mono text-sm">
            {price ? `$${stateUtils.formatPrice(price, record.symbol)}` : 'Market'}
          </Text>
          {record.avgPrice && record.avgPrice !== price && (
            <div>
              <Text type="secondary" className="text-xs">
                Avg: ${stateUtils.formatPrice(record.avgPrice, record.symbol)}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Fee',
      dataIndex: 'fee',
      key: 'fee',
      align: 'right' as const,
      width: 80,
      render: (fee: number) => (
        <Text className="text-xs text-gray-500">
          ${fee ? fee.toFixed(4) : '0.0000'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setShowDetailModal(true);
              }}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Cancel Order">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelOrder(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Calculate order statistics
  const orderStats = {
    total: filteredOrders.length,
    filled: filteredOrders.filter(o => o.status === 'filled').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    totalVolume: filteredOrders
      .filter(o => o.status === 'filled')
      .reduce((sum, o) => sum + (o.amount * (o.averagePrice || o.price || 0)), 0),
    totalFees: filteredOrders.reduce((sum, o) => sum + (o.fee || 0), 0),
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Order Statistics */}
      <Card size="small">
        <Row gutter={16}>
          <Col xs={8} sm={4}>
            <Statistic
              title="Total"
              value={orderStats.total}
              className="text-center"
            />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic
              title="Filled"
              value={orderStats.filled}
              valueStyle={{ color: '#3f8600' }}
              className="text-center"
            />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic
              title="Cancelled"
              value={orderStats.cancelled}
              valueStyle={{ color: '#cf1322' }}
              className="text-center"
            />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic
              title="Pending"
              value={orderStats.pending}
              valueStyle={{ color: '#1890ff' }}
              className="text-center"
            />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic
              title="Volume"
              value={orderStats.totalVolume}
              precision={2}
              prefix="$"
              className="text-center"
            />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic
              title="Fees"
              value={orderStats.totalFees}
              precision={4}
              prefix="$"
              className="text-center"
            />
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card size="small">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              className="w-full"
              size="small"
            >
              <Option value="all">All Status</Option>
              <Option value="filled">Filled</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="pending">Pending</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Side"
              value={filters.side}
              onChange={(value) => setFilters(prev => ({ ...prev, side: value }))}
              className="w-full"
              size="small"
            >
              <Option value="all">All Sides</Option>
              <Option value="buy">Buy</Option>
              <Option value="sell">Sell</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Input
              placeholder="Search symbol"
              value={filters.symbol}
              onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
              prefix={<SearchOutlined />}
              size="small"
            />
          </Col>
          <Col xs={24} sm={6}>
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card 
        title="Order History"
        extra={
          <Text type="secondary">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} orders`,
          }}
          scroll={{ x: 800 }}
          loading={loading}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title="Order Details"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Order ID" span={2}>
              <Text code>{selectedOrder.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Symbol">
              {selectedOrder.symbol}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedOrder.status)}>
                {selectedOrder.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedOrder.type.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Side">
              <Tag color={selectedOrder.side === 'buy' ? 'green' : 'red'}>
                {selectedOrder.side.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {selectedOrder.amount.toFixed(6)}
            </Descriptions.Item>
            <Descriptions.Item label="Filled">
              {selectedOrder.filled ? selectedOrder.filled.toFixed(6) : '0'}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {selectedOrder.price ? `$${stateUtils.formatPrice(selectedOrder.price, selectedOrder.symbol)}` : 'Market'}
            </Descriptions.Item>
            <Descriptions.Item label="Average Price">
              {selectedOrder.avgPrice ? `$${stateUtils.formatPrice(selectedOrder.avgPrice, selectedOrder.symbol)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Fee">
              ${selectedOrder.fee ? selectedOrder.fee.toFixed(4) : '0.0000'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedOrder.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedOrder.updatedAt && (
              <Descriptions.Item label="Updated">
                {dayjs(selectedOrder.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
