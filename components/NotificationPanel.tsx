'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  List, 
  Badge, 
  Button, 
  Space, 
  Tag, 
  Switch, 
  Divider, 
  Modal, 
  Form, 
  InputNumber, 
  Select,
  Alert,
  Tooltip,
  Empty
} from 'antd';
import { 
  BellOutlined, 
  SettingOutlined, 
  ClearOutlined, 
  SoundOutlined,
  NotificationOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { notificationService, Notification, NotificationSettings } from '@/lib/notificationService';

const { Title, Text } = Typography;
const { Option } = Select;

interface NotificationPanelProps {
  className?: string;
}

export default function NotificationPanel({ className }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, []);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
  };

  const handleSettingsSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newSettings: NotificationSettings = {
        ...settings,
        ...values,
        alertTypes: {
          ...settings.alertTypes,
          ...values.alertTypes
        },
        priceThresholds: {
          ...settings.priceThresholds,
          ...values.priceThresholds
        },
        volumeThresholds: {
          ...settings.volumeThresholds,
          ...values.volumeThresholds
        }
      };
      
      notificationService.updateSettings(newSettings);
      setSettings(newSettings);
      setSettingsModalVisible(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium': return <InfoCircleOutlined style={{ color: '#faad14' }} />;
      case 'low': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default: return <NotificationOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trailing_stop': return 'blue';
      case 'market_alert': return 'purple';
      case 'system': return 'cyan';
      default: return 'default';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={className}>
      <Card
        title={
          <Space>
            <BellOutlined />
            Notifications
            {unreadCount > 0 && <Badge count={unreadCount} />}
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Settings">
              <Button 
                icon={<SettingOutlined />} 
                onClick={() => setSettingsModalVisible(true)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Mark all as read">
              <Button 
                icon={<CheckCircleOutlined />} 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Clear all">
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                size="small"
                danger
              />
            </Tooltip>
          </Space>
        }
      >
        {notifications.length === 0 ? (
          <Empty 
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{ 
                  opacity: notification.read ? 0.6 : 1,
                  backgroundColor: notification.read ? 'transparent' : '#f6ffed'
                }}
                actions={[
                  !notification.read && (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getSeverityIcon(notification.severity)}
                  title={
                    <Space>
                      <Text strong={!notification.read}>
                        {notification.title}
                      </Text>
                      <Tag color={getTypeColor(notification.type)} size="small">
                        {notification.type.replace('_', ' ').toUpperCase()}
                      </Tag>
                      <Tag color={getSeverityColor(notification.severity)} size="small">
                        {notification.severity.toUpperCase()}
                      </Tag>
                      {notification.persistent && (
                        <Tag color="gold" size="small">PERSISTENT</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text>{notification.message}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              size: 'small',
              showSizeChanger: false
            }}
          />
        )}
      </Card>

      {/* Settings Modal */}
      <Modal
        title="Notification Settings"
        open={settingsModalVisible}
        onOk={handleSettingsSubmit}
        onCancel={() => setSettingsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
        >
          <Alert
            message="Notification Configuration"
            description="Configure how and when you want to receive notifications"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="enabled" valuePropName="checked">
            <Space>
              <Switch />
              <Text>Enable notifications</Text>
            </Space>
          </Form.Item>

          <Form.Item name="soundEnabled" valuePropName="checked">
            <Space>
              <Switch />
              <SoundOutlined />
              <Text>Enable notification sounds</Text>
            </Space>
          </Form.Item>

          <Form.Item name="browserNotifications" valuePropName="checked">
            <Space>
              <Switch />
              <NotificationOutlined />
              <Text>Enable browser notifications</Text>
            </Space>
          </Form.Item>

          <Divider>Alert Types</Divider>

          <Form.Item name={['alertTypes', 'adjustment']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Trailing stop adjustments</Text>
            </Space>
          </Form.Item>

          <Form.Item name={['alertTypes', 'trigger']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Position triggers</Text>
            </Space>
          </Form.Item>

          <Form.Item name={['alertTypes', 'activation']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Position activations</Text>
            </Space>
          </Form.Item>

          <Form.Item name={['alertTypes', 'strategy_switch']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Strategy switches</Text>
            </Space>
          </Form.Item>

          <Form.Item name={['alertTypes', 'market_alert']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Market alerts</Text>
            </Space>
          </Form.Item>

          <Divider>Thresholds</Divider>

          <Form.Item name={['priceThresholds', 'enabled']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Price movement alerts</Text>
            </Space>
          </Form.Item>

          <Form.Item 
            name={['priceThresholds', 'percentage']} 
            label="Price change threshold (%)"
          >
            <InputNumber 
              min={0.1} 
              max={50} 
              step={0.1} 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name={['volumeThresholds', 'enabled']} valuePropName="checked">
            <Space>
              <Switch />
              <Text>Volume spike alerts</Text>
            </Space>
          </Form.Item>

          <Form.Item 
            name={['volumeThresholds', 'multiplier']} 
            label="Volume multiplier threshold"
          >
            <InputNumber 
              min={1.5} 
              max={10} 
              step={0.1} 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="webhookUrl" label="Webhook URL (optional)">
            <input 
              type="url" 
              placeholder="https://hooks.slack.com/..." 
              style={{ width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
