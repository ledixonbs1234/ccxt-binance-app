// File: components/integrated/trading/TradingDashboard.tsx
'use client';

import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Typography, 
  Statistic,
  Alert,
  Spin,
  Switch,
  Tooltip
} from 'antd';
import {
  DollarOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  FullscreenOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import { useWebSocket } from '../../../contexts/integrated/WebSocketContext';
import OrderForm from './OrderForm';
import PositionManager from './PositionManager';
import OrderHistory from './OrderHistory';
import CoinListingTable from '../home/CoinListingTable';

const { Title } = Typography;

interface TradingDashboardProps {
  className?: string;
}

export default function TradingDashboard({ className = '' }: TradingDashboardProps) {
  const { state: tradingState, refreshAccount } = useEnhancedTrading();
  const { state: marketState } = useMarket();
  const { addNotification } = useNotification();
  const { state: webSocketState } = useWebSocket();
  
  const [activeTab, setActiveTab] = useState('trading');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAccount = async () => {
    setRefreshing(true);
    try {
      await refreshAccount();
      addNotification({
        type: 'success',
        title: 'Account Refreshed',
        message: 'Account data updated successfully',
        category: 'trading',
        priority: 'low',
        persistent: false,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error.message || 'Failed to refresh account data',
        category: 'trading',
        priority: 'medium',
        persistent: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const tabItems = [
    {
      key: 'trading',
      label: (
        <span>
          <DollarOutlined />
          Trading
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <OrderForm 
              selectedCoin={marketState.selectedCoin}
              onOrderSubmit={(order) => {
                addNotification({
                  type: 'info',
                  title: 'Order Submitted',
                  message: `${order.side.toUpperCase()} order for ${order.symbol} submitted`,
                  category: 'trading',
                  priority: 'medium',
                  persistent: false,
                });
              }}
            />
          </Col>
          <Col xs={24} lg={16}>
            <CoinListingTable 
              showFilters={false}
              pageSize={10}
              onCoinSelect={(_coin) => {
                // Handle coin selection for trading
              }}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: 'positions',
      label: (
        <span>
          <BarChartOutlined />
          Positions
        </span>
      ),
      children: <PositionManager />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          Order History
        </span>
      ),
      children: <OrderHistory />,
    },
  ];

  // Calculate account summary
  const accountSummary = {
    totalBalance: tradingState.account.balance + tradingState.account.marginUsed,
    availableBalance: tradingState.account.balance,
    lockedBalance: tradingState.account.marginUsed,
    totalPositionValue: tradingState.positions.reduce((sum, pos) => 
      sum + (pos.size * pos.currentPrice), 0
    ),
    totalPnL: tradingState.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0),
    openPositions: tradingState.positions.length,
    pendingOrders: tradingState.orderHistory.filter(o => o.status === 'pending').length,
  };

  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Account Summary Header */}
      <Card className="mb-4" size="small">
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="!mb-0">
            Trading Dashboard
          </Title>
          <Space>
            <Tooltip title="Auto Refresh">
              <Switch
                size="small"
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="Auto"
                unCheckedChildren="Manual"
              />
            </Tooltip>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRefreshAccount}
              loading={refreshing}
            />
            <Button
              type="text"
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Space>
        </div>

        <Row gutter={16}>
          <Col xs={12} sm={6} md={4}>
            <Statistic
              title="Total Balance"
              value={accountSummary.totalBalance}
              precision={2}
              prefix="$"
              className="text-center"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic
              title="Available"
              value={accountSummary.availableBalance}
              precision={2}
              prefix="$"
              className="text-center"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic
              title="In Orders"
              value={accountSummary.lockedBalance}
              precision={2}
              prefix="$"
              className="text-center"
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic
              title="Position Value"
              value={accountSummary.totalPositionValue}
              precision={2}
              prefix="$"
              className="text-center"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic
              title="Total PnL"
              value={Math.abs(accountSummary.totalPnL)}
              precision={2}
              prefix={accountSummary.totalPnL >= 0 ? '+$' : '-$'}
              className="text-center"
              valueStyle={{ 
                color: accountSummary.totalPnL >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-1">Positions/Orders</div>
              <div className="text-lg font-semibold">
                <span className="text-blue-600">{accountSummary.openPositions}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-orange-600">{accountSummary.pendingOrders}</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Connection Status */}
        {webSocketState.globalStatus === 'connected' ? (
          <Alert
            message="Connected to Exchange"
            type="success"
            showIcon
            className="mt-4"
            banner
          />
        ) : webSocketState.globalStatus === 'partial' ? (
          <Alert
            message="Partially Connected to Exchange"
            description="Some connections are active. Some features may be limited."
            type="info"
            showIcon
            className="mt-4"
            banner
          />
        ) : webSocketState.globalStatus === 'error' ? (
          <Alert
            message="Connection Error"
            description="Failed to connect to exchange. Please check your connection and try again."
            type="error"
            showIcon
            className="mt-4"
            banner
          />
        ) : (
          <Alert
            message="Disconnected from Exchange"
            description="Some features may not work properly. Please check your connection."
            type="warning"
            showIcon
            className="mt-4"
            banner
          />
        )}
      </Card>

      {/* Main Trading Interface */}
      <Card className="min-h-[600px]">
        <Spin spinning={tradingState.isLoading} tip="Loading trading data...">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="trading-tabs"
          />
        </Spin>
      </Card>

      {/* Quick Actions (if fullscreen) */}
      {isFullscreen && (
        <div className="fixed bottom-4 right-4 z-60">
          <Space direction="vertical">
            <Button
              type="primary"
              shape="circle"
              icon={<FullscreenOutlined />}
              onClick={() => setIsFullscreen(false)}
              size="large"
            />
          </Space>
        </div>
      )}

      <style jsx>{`
        .trading-tabs .ant-tabs-content-holder {
          padding-top: 16px;
        }
        
        .trading-tabs .ant-tabs-tab {
          font-weight: 500;
        }
        
        .trading-tabs .ant-tabs-tab-active {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
