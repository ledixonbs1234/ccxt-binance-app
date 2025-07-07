'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Descriptions, Tag, Divider } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, BugOutlined } from '@ant-design/icons';
import { notificationService } from '@/lib/notificationService';
import PageContainer from '@/components/PageContainer';

const { Title, Text, Paragraph } = Typography;

export default function WebSocketTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateConnectionStatus = () => {
    const status = notificationService.getConnectionStatus();
    setConnectionStatus(status);
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const runWebSocketTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    addTestResult('🧪 Starting WebSocket Error Handling Tests...');

    // Test 1: Check initial connection status
    addTestResult('📊 Test 1: Checking initial connection status');
    updateConnectionStatus();

    // Test 2: Test connection to invalid URL
    addTestResult('🔌 Test 2: Testing connection to invalid WebSocket URL');
    try {
      notificationService.initializeWebSocket('ws://invalid-url:9999/ws');
      addTestResult('✅ Invalid URL connection attempt handled gracefully');
    } catch (error) {
      addTestResult(`❌ Error not handled properly: ${error}`);
    }

    // Wait and check status
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateConnectionStatus();

    // Test 3: Test connection to non-existent local server
    addTestResult('🌐 Test 3: Testing connection to non-existent local server');
    try {
      notificationService.initializeWebSocket('ws://localhost:9999/ws');
      addTestResult('✅ Non-existent server connection attempt handled gracefully');
    } catch (error) {
      addTestResult(`❌ Error not handled properly: ${error}`);
    }

    // Wait and check status
    await new Promise(resolve => setTimeout(resolve, 5000));
    updateConnectionStatus();

    // Test 4: Test force reconnect
    addTestResult('🔄 Test 4: Testing force reconnect functionality');
    try {
      notificationService.forceReconnect();
      addTestResult('✅ Force reconnect executed successfully');
    } catch (error) {
      addTestResult(`❌ Force reconnect failed: ${error}`);
    }

    // Wait and check status
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateConnectionStatus();

    // Test 5: Test manual disconnect
    addTestResult('🔌 Test 5: Testing manual disconnect');
    try {
      notificationService.disconnect();
      addTestResult('✅ Manual disconnect executed successfully');
    } catch (error) {
      addTestResult(`❌ Manual disconnect failed: ${error}`);
    }

    // Wait and check final status
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateConnectionStatus();

    // Test 6: Test local notifications (without WebSocket)
    addTestResult('📢 Test 6: Testing local notifications without WebSocket');
    try {
      notificationService.sendNotification({
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification without WebSocket connection',
        severity: 'medium',
        persistent: false
      });
      addTestResult('✅ Local notification sent successfully');
    } catch (error) {
      addTestResult(`❌ Local notification failed: ${error}`);
    }

    addTestResult('🎉 All WebSocket error handling tests completed!');
    setIsRunning(false);
  };

  const resetConnection = () => {
    addTestResult('🔄 Resetting WebSocket connection to default...');
    notificationService.forceReconnect();
    setTimeout(updateConnectionStatus, 2000);
  };

  const getStatusColor = (connected: boolean, connecting: boolean) => {
    if (connecting) return 'processing';
    return connected ? 'success' : 'error';
  };

  const getStatusText = (connected: boolean, connecting: boolean) => {
    if (connecting) return 'CONNECTING';
    return connected ? 'CONNECTED' : 'DISCONNECTED';
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2}>
          <BugOutlined /> WebSocket Error Handling Test
        </Title>
        
        <Alert
          message="WebSocket Error Handling Improvements"
          description="This page tests the enhanced WebSocket error handling in NotificationService. The improvements include better error logging, graceful connection failure handling, and reconnection logic."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Connection Status */}
          <Card title="Connection Status" extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={updateConnectionStatus}
              size="small"
            >
              Refresh
            </Button>
          }>
            {connectionStatus && (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(connectionStatus.connected, connectionStatus.connecting)}>
                    {getStatusText(connectionStatus.connected, connectionStatus.connecting)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="URL">
                  <Text code>{connectionStatus.url || 'Not set'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ready State">
                  <Tag>{connectionStatus.readyState}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Reconnect Attempts">
                  <Text>{connectionStatus.reconnectAttempts}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Error">
                  {connectionStatus.lastError ? (
                    <Text type="danger" style={{ fontSize: '12px' }}>
                      {connectionStatus.lastError}
                    </Text>
                  ) : (
                    <Text type="success">None</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          {/* Test Controls */}
          <Card title="Test Controls">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={runWebSocketTests}
                loading={isRunning}
                block
              >
                Run WebSocket Error Tests
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={resetConnection}
                block
              >
                Reset Connection
              </Button>
              
              <Button
                icon={<StopOutlined />}
                onClick={() => notificationService.disconnect()}
                danger
                block
              >
                Disconnect WebSocket
              </Button>
            </Space>
          </Card>
        </div>

        {/* Test Results */}
        <Card 
          title="Test Results" 
          style={{ marginTop: 24 }}
          extra={
            <Button 
              size="small" 
              onClick={() => setTestResults([])}
              disabled={testResults.length === 0}
            >
              Clear
            </Button>
          }
        >
          {testResults.length === 0 ? (
            <Text type="secondary">No test results yet. Run the tests above to see results.</Text>
          ) : (
            <div style={{ 
              maxHeight: 400, 
              overflowY: 'auto', 
              backgroundColor: '#f5f5f5', 
              padding: 16, 
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  {result}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Divider />
        
        <Card title="Enhanced Error Handling Features">
          <Paragraph>
            <Text strong>Improvements implemented:</Text>
          </Paragraph>
          <ul>
            <li>✅ Enhanced error logging with detailed connection information</li>
            <li>✅ Graceful handling of connection failures (no more empty error objects)</li>
            <li>✅ Proper WebSocket close code interpretation</li>
            <li>✅ Exponential backoff reconnection strategy</li>
            <li>✅ Connection timeout handling (10 seconds)</li>
            <li>✅ Manual connection management methods</li>
            <li>✅ Service continues to work without WebSocket server</li>
            <li>✅ User-friendly error notifications</li>
            <li>✅ Detailed connection status monitoring</li>
            <li>✅ Prevention of multiple simultaneous connection attempts</li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
