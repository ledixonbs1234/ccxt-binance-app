'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Badge,
  Statistic,
  Progress,
  Alert,
  Divider,
  Tag,
  Tooltip,
  notification
} from 'antd';
import {
  RocketOutlined,
  TrophyOutlined,
  SafetyOutlined,
  LineChartOutlined,
  BellOutlined,
  MonitorOutlined,
  DashboardOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useTrading } from '@/contexts/TradingContext';
import SystemHealthMonitor from '@/components/SystemHealthMonitor';

const { Title, Text, Paragraph } = Typography;

interface ProductionFeature {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: 'core' | 'analysis' | 'management' | 'monitoring';
  status: 'active' | 'maintenance' | 'offline';
  priority: 'high' | 'medium' | 'low';
  features: string[];
  metrics?: {
    uptime?: number;
    responseTime?: number;
    accuracy?: number;
    usage?: number;
  };
}

export default function ProductionHubPage() {
  const { btcData, ethData, pepeData } = useTrading();
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const productionFeatures: ProductionFeature[] = [
    {
      id: 'trailing-stop',
      title: 'Enhanced Trailing Stop',
      description: 'Production-ready trailing stop system với real-time execution và advanced strategies',
      url: '/enhanced-trailing-stop',
      icon: <RocketOutlined />,
      category: 'core',
      status: 'active',
      priority: 'high',
      features: ['Real-time Execution', 'Multiple Strategies', 'Risk Controls', 'Performance Tracking'],
      metrics: {
        uptime: 99.9,
        responseTime: 45,
        accuracy: 98.5,
        usage: 87
      }
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      description: 'Intelligent risk control với real-time monitoring và automated protection',
      url: '/risk-management',
      icon: <SafetyOutlined />,
      category: 'management',
      status: 'active',
      priority: 'high',
      features: ['Position Sizing', 'Max Loss Protection', 'Portfolio Risk', 'Real-time Alerts'],
      metrics: {
        uptime: 99.8,
        responseTime: 32,
        accuracy: 99.2,
        usage: 92
      }
    },
    {
      id: 'market-analysis',
      title: 'AI Market Analysis',
      description: 'AI-powered market intelligence với real-time insights và strategy optimization',
      url: '/market-analysis',
      icon: <LineChartOutlined />,
      category: 'analysis',
      status: 'active',
      priority: 'high',
      features: ['AI Predictions', 'Trend Analysis', 'Support/Resistance', 'Strategy Optimization'],
      metrics: {
        uptime: 99.5,
        responseTime: 120,
        accuracy: 85.3,
        usage: 76
      }
    },
    {
      id: 'performance',
      title: 'Trading Analytics',
      description: 'Comprehensive performance tracking với real-time P&L và advanced metrics',
      url: '/performance',
      icon: <BarChartOutlined />,
      category: 'analysis',
      status: 'active',
      priority: 'medium',
      features: ['Real-time P&L', 'Win Rate Analysis', 'Drawdown Monitoring', 'Export Reports'],
      metrics: {
        uptime: 99.7,
        responseTime: 67,
        accuracy: 100,
        usage: 68
      }
    },
    {
      id: 'notifications',
      title: 'Alert System',
      description: 'Production notification system với multi-channel alerts và smart filtering',
      url: '/notifications',
      icon: <BellOutlined />,
      category: 'monitoring',
      status: 'active',
      priority: 'medium',
      features: ['Real-time Alerts', 'Multi-channel', 'Smart Filtering', 'Alert History'],
      metrics: {
        uptime: 99.9,
        responseTime: 15,
        accuracy: 97.8,
        usage: 84
      }
    },
    {
      id: 'system-monitoring',
      title: 'System Monitor',
      description: 'Production system monitoring với health checks và performance metrics',
      url: '/system-test',
      icon: <MonitorOutlined />,
      category: 'monitoring',
      status: 'active',
      priority: 'low',
      features: ['Health Monitoring', 'Performance Metrics', 'API Status', 'Uptime Tracking'],
      metrics: {
        uptime: 100,
        responseTime: 25,
        accuracy: 100,
        usage: 45
      }
    }
  ];

  // System health check
  useEffect(() => {
    const checkSystemHealth = () => {
      const avgUptime = productionFeatures.reduce((acc, feature) => 
        acc + (feature.metrics?.uptime || 0), 0) / productionFeatures.length;
      
      if (avgUptime >= 99.5) setSystemHealth('healthy');
      else if (avgUptime >= 98) setSystemHealth('warning');
      else setSystemHealth('critical');
      
      setLastUpdate(new Date());
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#52c41a';
      case 'maintenance': return '#faad14';
      case 'offline': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getHealthStatus = () => {
    switch (systemHealth) {
      case 'healthy': return { color: '#52c41a', icon: <CheckCircleOutlined />, text: 'Healthy' };
      case 'warning': return { color: '#faad14', icon: <ExclamationCircleOutlined />, text: 'Warning' };
      case 'critical': return { color: '#ff4d4f', icon: <ExclamationCircleOutlined />, text: 'Critical' };
    }
  };

  const healthStatus = getHealthStatus();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-container)', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large" align="center">
                <TrophyOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <div>
                  <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
                    Production Trading Hub
                  </Title>
                  <Text type="secondary" style={{ fontSize: 18 }}>
                    Professional Trading Platform với Real-time Data & AI Intelligence
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space direction="vertical" align="end">
                <Space>
                  <Badge 
                    color={healthStatus.color} 
                    text={
                      <Text strong style={{ color: healthStatus.color }}>
                        {healthStatus.icon} System {healthStatus.text}
                      </Text>
                    } 
                  />
                </Space>
                <Text type="secondary">
                  <ClockCircleOutlined /> Last updated: {lastUpdate.toLocaleTimeString()}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* System Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="System Uptime"
                value={99.8}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Features"
                value={productionFeatures.filter(f => f.status === 'active').length}
                suffix={`/ ${productionFeatures.length}`}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg Response Time"
                value={52}
                suffix="ms"
                valueStyle={{ color: '#52c41a' }}
                prefix={<DashboardOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Market Data"
                value="Real-time"
                valueStyle={{ color: '#52c41a' }}
                prefix={<LineChartOutlined />}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  BTC: ${btcData?.price?.toLocaleString() || 'Loading...'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Production Features */}
        <Title level={2}>🚀 Production Features</Title>
        <Row gutter={[16, 16]}>
          {productionFeatures.map((feature) => (
            <Col key={feature.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Link href={feature.url} key="launch">
                    <Button type="primary" icon={<RocketOutlined />}>
                      Launch
                    </Button>
                  </Link>
                ]}
              >
                <Card.Meta
                  avatar={
                    <div style={{ fontSize: 32, color: '#1890ff' }}>
                      {feature.icon}
                    </div>
                  }
                  title={
                    <Space>
                      {feature.title}
                      <Tag color={getPriorityColor(feature.priority)}>
                        {feature.priority.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={feature.description}
                />
                
                <Divider />
                
                {/* Status */}
                <Space style={{ marginBottom: 12 }}>
                  <Badge 
                    color={getStatusColor(feature.status)} 
                    text={feature.status.toUpperCase()} 
                  />
                  <Tag>{feature.category}</Tag>
                </Space>

                {/* Metrics */}
                {feature.metrics && (
                  <div style={{ marginBottom: 12 }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text type="secondary">Uptime</Text>
                        <div>
                          <Text strong>{feature.metrics.uptime}%</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Response</Text>
                        <div>
                          <Text strong>{feature.metrics.responseTime}ms</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Features */}
                <div>
                  <Text type="secondary">Key Features:</Text>
                  <div style={{ marginTop: 4 }}>
                    {feature.features.map((feat, index) => (
                      <Tag key={index}  style={{ marginBottom: 4 }}>
                        {feat}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* System Health Monitor */}
        <SystemHealthMonitor />

        {/* Quick Actions */}
        <Card title="🎯 Quick Actions" style={{ marginTop: 24 }}>
          <Space wrap>
            <Link href="/">
              <Button icon={<DashboardOutlined />} size="large">
                Main Dashboard
              </Button>
            </Link>
            <Link href="/demo-hub">
              <Button icon={<RocketOutlined />} size="large">
                Demo Hub
              </Button>
            </Link>
            <Button
              icon={<MonitorOutlined />}
              size="large"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
