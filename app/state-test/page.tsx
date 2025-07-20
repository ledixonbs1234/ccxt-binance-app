// File: app/state-test/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Badge,
  Tag
} from 'antd';
// Icons removed for simplicity

// Import all contexts
import { useUser } from '../../contexts/integrated/UserContext';
import { useMarket } from '../../contexts/integrated/MarketContext';
import { useEnhancedTrading } from '../../contexts/integrated/EnhancedTradingContext';
import { useNotification } from '../../contexts/integrated/NotificationContext';
import { useWebSocket } from '../../contexts/integrated/WebSocketContext';
import { useBacktest } from '../../contexts/integrated/BacktestContext';
import { useStateSync } from '../../lib/stateSync';
import StateTestMonitor from '../../components/StateTestMonitor';

const { Title, Text, Paragraph } = Typography;

export default function StateTestPage() {
  // All contexts
  const { state: userState, login, logout } = useUser();
  const { state: marketState, fetchCoins, selectCoin } = useMarket();
  const { state: tradingState, createOrder } = useEnhancedTrading();
  const { state: notificationState, addNotification, addPriceAlert } = useNotification();
  const { state: wsState, connect, disconnect } = useWebSocket();
  const { state: backtestState, createStrategy, runBacktest } = useBacktest();

  // State sync
  useStateSync();

  // Test functions
  const testUserLogin = async () => {
    await login('test@example.com', 'password123');
  };

  const testMarketData = async () => {
    await fetchCoins();
    if (marketState.coins.length > 0) {
      selectCoin(marketState.coins[0]);
    }
  };

  const testCreateOrder = async () => {
    await createOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      amount: 0.001,
    });
  };

  const testNotification = () => {
    addNotification({
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test notification from the state management system',
      category: 'system',
      priority: 'medium',
      persistent: false,
    });
  };

  const testPriceAlert = () => {
    // Simple test price alert
    addPriceAlert({
      symbol: 'BTCUSDT',
      condition: 'above',
      targetValue: 50000,
      currentValue: 45000,
      enabled: true,
    });
  };

  const testWebSocket = () => {
    const connectionId = 'test-connection';
    if (wsState.connections[connectionId]?.status === 'connected') {
      disconnect(connectionId);
    } else {
      connect(connectionId, 'wss://stream.binance.com:9443/ws/btcusdt@ticker');
    }
  };

  const testBacktest = async () => {
    // Create a test strategy first
    createStrategy({
      name: 'Test SMA Strategy',
      description: 'Simple moving average crossover strategy',
      type: 'sma',
      parameters: {
        fastPeriod: 10,
        slowPeriod: 20,
      },
    });

    // Run backtest if we have strategies
    if (backtestState.strategies.length > 0) {
      const strategy = backtestState.strategies[0];
      await runBacktest(strategy.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Title level={2}>🧪 State Management System Test</Title>
          <Paragraph>
            Test all integrated contexts and state synchronization. This page demonstrates 
            the functionality of UserContext, MarketContext, EnhancedTradingContext, 
            NotificationContext, WebSocketContext, and BacktestContext.
          </Paragraph>
        </div>

        {/* Test Monitor */}
        <StateTestMonitor />

        <div className="space-y-6">
          {/* Overview Section */}
          <Card title="📊 State Overview" size="small">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User State */}
              <div className="p-4 border rounded">
                <Title level={5}>👤 User State</Title>
                <Space direction="vertical" size="small">
                  <Text>Status: <Tag color={userState.user ? 'green' : 'red'}>
                    {userState.user ? 'Authenticated' : 'Not Authenticated'}
                  </Tag></Text>
                  {userState.user && (
                    <>
                      <Text>Name: {userState.user.name}</Text>
                      <Text>Email: {userState.user.email}</Text>
                    </>
                  )}
                  <Button
                    type="primary"
                    size="small"
                    onClick={userState.user ? logout : testUserLogin}
                  >
                    {userState.user ? 'Logout' : 'Test Login'}
                  </Button>
                </Space>
              </div>

              {/* Market State */}
              <div className="p-4 border rounded">
                <Title level={5}>📈 Market State</Title>
                <Space direction="vertical" size="small">
                  <Text>Coins: {marketState.coins.length}</Text>
                  <Text>Loading: <Tag color={marketState.isLoading ? 'orange' : 'green'}>
                    {marketState.isLoading ? 'Yes' : 'No'}
                  </Tag></Text>
                  <Text>Last Update: {marketState.lastUpdate?.toLocaleTimeString() || 'Never'}</Text>
                  <Button type="primary" size="small" onClick={testMarketData}>
                    Test Market Data
                  </Button>
                </Space>
              </div>

              {/* Trading State */}
              <div className="p-4 border rounded">
                <Title level={5}>💰 Trading State</Title>
                <Space direction="vertical" size="small">
                  <Text>Orders: {tradingState.orders.length}</Text>
                  <Text>Positions: {tradingState.positions.length}</Text>
                  <Text>Balance: ${tradingState.account.balance.toFixed(2)}</Text>
                  <Button type="primary" size="small" onClick={testCreateOrder}>
                    Test Create Order
                  </Button>
                </Space>
              </div>

              {/* Notification State */}
              <div className="p-4 border rounded">
                <Title level={5}>🔔 Notifications</Title>
                <Space direction="vertical" size="small">
                  <Text>Total: {notificationState.notifications.length}</Text>
                  <Text>Unread: <Badge count={notificationState.unreadCount} /></Text>
                  <Text>Alerts: {notificationState.priceAlerts.length}</Text>
                  <Button type="primary" size="small" onClick={testNotification}>
                    Test Notification
                  </Button>
                </Space>
              </div>

              {/* WebSocket State */}
              <div className="p-4 border rounded">
                <Title level={5}>🌐 WebSocket</Title>
                <Space direction="vertical" size="small">
                  <Text>Connections: {Object.keys(wsState.connections).length}</Text>
                  <Text>Status: <Tag color={wsState.globalStatus === 'connected' ? 'green' : 'red'}>
                    {wsState.globalStatus}
                  </Tag></Text>
                  <Button
                    type="primary"
                    size="small"
                    onClick={testWebSocket}
                  >
                    {wsState.globalStatus === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                </Space>
              </div>

              {/* Backtest State */}
              <div className="p-4 border rounded">
                <Title level={5}>🧪 Backtest</Title>
                <Space direction="vertical" size="small">
                  <Text>Strategies: {backtestState.strategies.length}</Text>
                  <Text>Results: {backtestState.results.length}</Text>
                  <Text>Active: {backtestState.activeBacktest ? 'Yes' : 'No'}</Text>
                  <Button type="primary" size="small" onClick={testBacktest}>
                    Test Backtest
                  </Button>
                </Space>
              </div>
            </div>
          </Card>

          {/* Test Actions */}
          <Card title="🧪 Test Actions">
            <Space wrap>
              <Button onClick={testUserLogin} type="primary">
                Test User Login
              </Button>
              <Button onClick={testMarketData} loading={marketState.isLoading}>
                Test Market Data
              </Button>
              <Button onClick={testCreateOrder} loading={tradingState.isLoading}>
                Test Create Order
              </Button>
              <Button onClick={testNotification}>
                Test Notification
              </Button>
              <Button onClick={testWebSocket}>
                Test WebSocket
              </Button>
              <Button onClick={testBacktest}>
                Test Backtest
              </Button>
            </Space>
          </Card>

          {/* Recent Activity */}
          <Card title="📋 Recent Activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Title level={5}>Recent Orders</Title>
                {tradingState.orders.slice(0, 3).map(order => (
                  <div key={order.id} className="p-2 border rounded mt-2">
                    <Text>{order.symbol} - {order.side.toUpperCase()} {order.amount}</Text>
                    <Tag color={order.status === 'filled' ? 'green' : 'orange'} className="ml-2">
                      {order.status}
                    </Tag>
                  </div>
                ))}
              </div>

              <div>
                <Title level={5}>Recent Notifications</Title>
                {notificationState.notifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className="p-2 border rounded mt-2">
                    <Text strong>{notification.title}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">{notification.message}</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
