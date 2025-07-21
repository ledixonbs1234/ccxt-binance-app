'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Alert, Row, Col, Card, Button, Space } from 'antd';
import { BellOutlined, ExperimentOutlined } from '@ant-design/icons';
import NotificationPanel from '@/components/NotificationPanel';
import { notificationService } from '@/lib/notificationService';

const { Title } = Typography;

export default function NotificationsPage() {
  const [testCount, setTestCount] = useState(0);

  const sendTestNotification = (type: 'low' | 'medium' | 'high') => {
    const messages = {
      low: 'This is a low priority test notification',
      medium: 'This is a medium priority test notification',
      high: 'This is a high priority test notification - requires attention!'
    };

    notificationService.sendNotification({
      type: 'system',
      title: `Test Notification ${testCount + 1}`,
      message: messages[type],
      severity: type,
      persistent: type === 'high'
    });

    setTestCount(prev => prev + 1);
  };

  const sendTrailingStopTest = () => {
    notificationService.sendNotification({
      type: 'trailing_stop',
      title: 'Trailing Stop Triggered',
      message: 'BTC/USDT position triggered at $45,250.00 - Profit: +2.5%',
      severity: 'high',
      persistent: true,
      data: {
        symbol: 'BTC/USDT',
        price: 45250,
        profit: 2.5
      }
    });

    setTestCount(prev => prev + 1);
  };

  const sendMarketAlertTest = () => {
    notificationService.sendNotification({
      type: 'market_alert',
      title: 'Price Alert',
      message: 'ETH/USDT moved +8.5% in the last hour - High volatility detected',
      severity: 'medium',
      persistent: false,
      data: {
        symbol: 'ETH/USDT',
        change: 8.5,
        timeframe: '1h'
      }
    });

    setTestCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Title level={2}>
        <BellOutlined /> Real-time Notifications
      </Title>
      
      <Alert
        message="Advanced Notification System"
        description="Hệ thống thông báo real-time với WebSocket - nhận cảnh báo tức thì cho trailing stop adjustments, triggers, market alerts và strategy switches"
        type="info"
        showIcon
        className="mb-6"
      />

      <Row gutter={[24, 24]}>
        <Col span={16}>
          <NotificationPanel />
        </Col>
        
        <Col span={8}>
          <Card title={
            <Space>
              <ExperimentOutlined />
              Test Notifications
            </Space>
          }>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Test the notification system"
                description="Click the buttons below to send test notifications and see how they appear"
                type="info"
                
              />
              
              <Button 
                type="primary" 
                onClick={() => sendTestNotification('low')}
                style={{ width: '100%' }}
              >
                Send Low Priority Test
              </Button>
              
              <Button 
                onClick={() => sendTestNotification('medium')}
                style={{ width: '100%' }}
              >
                Send Medium Priority Test
              </Button>
              
              <Button 
                danger
                onClick={() => sendTestNotification('high')}
                style={{ width: '100%' }}
              >
                Send High Priority Test
              </Button>
              
              <Button 
                type="primary"
                onClick={sendTrailingStopTest}
                style={{ width: '100%', backgroundColor: '#1890ff' }}
              >
                Test Trailing Stop Alert
              </Button>
              
              <Button 
                onClick={sendMarketAlertTest}
                style={{ width: '100%', backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
              >
                Test Market Alert
              </Button>
            </Space>
          </Card>

          <Card title="WebSocket Status" style={{ marginTop: 16 }}>
            <Alert
              message="Connection Status"
              description="WebSocket connection for real-time notifications is active. Notifications will be delivered instantly."
              type="success"
              showIcon
            />
          </Card>

          <Card title="Features" style={{ marginTop: 16 }}>
            <ul style={{ paddingLeft: 20 }}>
              <li>✅ Real-time WebSocket notifications</li>
              <li>✅ Browser push notifications</li>
              <li>✅ Sound alerts for high priority</li>
              <li>✅ Configurable alert types</li>
              <li>✅ Price & volume thresholds</li>
              <li>✅ Webhook integration support</li>
              <li>✅ Persistent notifications</li>
              <li>✅ Auto-reconnection</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
