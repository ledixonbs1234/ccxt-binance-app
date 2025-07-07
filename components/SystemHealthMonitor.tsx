'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Space,
  Typography,
  Alert,
  Button,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface SystemMetrics {
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    uptime: number;
    lastCheck: Date;
  };
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    responseTime: number;
  };
  binance: {
    status: 'healthy' | 'warning' | 'error';
    latency: number;
    rateLimit: number;
  };
  system: {
    cpu: number;
    memory: number;
    uptime: number;
  };
}

export default function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-health');
      const data = await response.json();

      if (response.ok) {
        // Transform API response to component format
        const transformedMetrics: SystemMetrics = {
          api: {
            status: data.services.api.status,
            responseTime: data.services.api.responseTime,
            uptime: data.services.api.uptime,
            lastCheck: new Date(data.services.api.lastCheck)
          },
          database: {
            status: data.services.database.status,
            connections: data.services.database.connections,
            responseTime: data.services.database.responseTime
          },
          binance: {
            status: data.services.binance.status,
            latency: data.services.binance.latency,
            rateLimit: data.services.binance.rateLimit
          },
          system: {
            cpu: data.services.system.cpu,
            memory: data.services.system.memory,
            uptime: data.services.system.uptime
          }
        };

        setMetrics(transformedMetrics);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch system health:', data);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <CheckCircleOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getProgressColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return '#52c41a';
    if (value <= thresholds.warning) return '#faad14';
    return '#ff4d4f';
  };

  if (loading || !metrics) {
    return (
      <Card title="🔍 System Health Monitor" loading={true}>
        <div style={{ height: 200 }} />
      </Card>
    );
  }

  const overallHealth = [
    metrics.api.status,
    metrics.database.status,
    metrics.binance.status
  ].every(status => status === 'healthy') ? 'healthy' : 
    [metrics.api.status, metrics.database.status, metrics.binance.status]
      .some(status => status === 'error') ? 'error' : 'warning';

  return (
    <Card 
      title={
        <Space>
          <span>🔍 System Health Monitor</span>
          <Badge 
            color={getStatusColor(overallHealth)} 
            text={overallHealth.toUpperCase()} 
          />
        </Space>
      }
      extra={
        <Space>
          <Text type="secondary">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Text>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchSystemMetrics}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {overallHealth !== 'healthy' && (
        <Alert
          message="System Health Warning"
          description="Some components are experiencing issues. Please check individual metrics below."
          type={overallHealth === 'error' ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* API Health */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <ApiOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong>API Service</Text>
                {getStatusIcon(metrics.api.status)}
              </Space>
              
              <Statistic
                title="Response Time"
                value={metrics.api.responseTime}
                suffix="ms"
                valueStyle={{ fontSize: 16 }}
              />
              
              <div>
                <Text type="secondary">Uptime</Text>
                <div>
                  <Text strong>{metrics.api.uptime.toFixed(2)}%</Text>
                  <Progress 
                    percent={metrics.api.uptime} 
                    size="small" 
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Database Health */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <DatabaseOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong>Database</Text>
                {getStatusIcon(metrics.database.status)}
              </Space>
              
              <Statistic
                title="Connections"
                value={metrics.database.connections}
                suffix="active"
                valueStyle={{ fontSize: 16 }}
              />
              
              <div>
                <Text type="secondary">Response Time</Text>
                <div>
                  <Text strong>{metrics.database.responseTime}ms</Text>
                  <Progress 
                    percent={Math.min((100 - metrics.database.responseTime), 100)} 
                    size="small" 
                    strokeColor={getProgressColor(metrics.database.responseTime, { good: 20, warning: 50 })}
                    showInfo={false}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Binance API Health */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <CloudOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong>Binance API</Text>
                {getStatusIcon(metrics.binance.status)}
              </Space>
              
              <Statistic
                title="Latency"
                value={metrics.binance.latency}
                suffix="ms"
                valueStyle={{ fontSize: 16 }}
              />
              
              <div>
                <Text type="secondary">Rate Limit</Text>
                <div>
                  <Text strong>{metrics.binance.rateLimit}%</Text>
                  <Progress 
                    percent={metrics.binance.rateLimit} 
                    size="small" 
                    strokeColor={getProgressColor(metrics.binance.rateLimit, { good: 50, warning: 80 })}
                    showInfo={false}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* System Resources */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <ThunderboltOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong>System</Text>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Space>
              
              <div>
                <Text type="secondary">CPU Usage</Text>
                <div>
                  <Text strong>{metrics.system.cpu}%</Text>
                  <Progress 
                    percent={metrics.system.cpu} 
                    size="small" 
                    strokeColor={getProgressColor(metrics.system.cpu, { good: 50, warning: 80 })}
                    showInfo={false}
                  />
                </div>
              </div>
              
              <div>
                <Text type="secondary">Memory</Text>
                <div>
                  <Text strong>{metrics.system.memory}%</Text>
                  <Progress 
                    percent={metrics.system.memory} 
                    size="small" 
                    strokeColor={getProgressColor(metrics.system.memory, { good: 60, warning: 85 })}
                    showInfo={false}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space>
          <Tooltip title="View detailed system logs">
            <Button size="small">View Logs</Button>
          </Tooltip>
          <Tooltip title="Run system diagnostics">
            <Button size="small">Diagnostics</Button>
          </Tooltip>
          <Tooltip title="Configure alerts">
            <Button size="small">Alert Settings</Button>
          </Tooltip>
        </Space>
      </div>
    </Card>
  );
}
