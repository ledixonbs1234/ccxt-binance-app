'use client';

import React from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Tag, 
  Alert,
  Divider
} from 'antd';
import {
  RocketOutlined,
  LineChartOutlined,
  SafetyOutlined,
  BellOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  BugOutlined,
  DashboardOutlined,
  RiseOutlined,
  CalculatorOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface DemoCard {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: 'core' | 'analysis' | 'testing' | 'management';
  status: 'stable' | 'beta' | 'new';
  features: string[];
}

export default function DemoHubPage() {
  const demoCards: DemoCard[] = [
    {
      title: 'Enhanced Trailing Stop',
      description: 'Core trailing stop system với advanced strategies và real-time monitoring',
      url: '/enhanced-trailing-stop',
      icon: <RiseOutlined />,
      category: 'core',
      status: 'stable',
      features: ['Multiple Strategies', 'Real-time Updates', 'Visual Charts', 'Order Execution']
    },
    {
      title: 'Risk Management',
      description: 'Intelligent risk management với position sizing và portfolio protection',
      url: '/risk-management',
      icon: <SafetyOutlined />,
      category: 'management',
      status: 'stable',
      features: ['Position Sizing', 'Risk Assessment', 'Max Loss Protection', 'Profile Management']
    },
    {
      title: 'Market Analysis',
      description: 'Advanced market analysis với trend detection và strategy optimization',
      url: '/market-analysis',
      icon: <LineChartOutlined />,
      category: 'analysis',
      status: 'stable',
      features: ['Trend Analysis', 'Support/Resistance', 'Volume Profile', 'Strategy Optimization']
    },
    {
      title: 'Performance Dashboard',
      description: 'Comprehensive performance tracking với detailed analytics và charts',
      url: '/performance',
      icon: <BarChartOutlined />,
      category: 'analysis',
      status: 'stable',
      features: ['Win Rate Tracking', 'P&L Analysis', 'Drawdown Monitoring', 'Strategy Comparison']
    },
    {
      title: 'Notification System',
      description: 'Real-time notifications với WebSocket và browser push notifications',
      url: '/notifications',
      icon: <BellOutlined />,
      category: 'core',
      status: 'stable',
      features: ['WebSocket Alerts', 'Browser Notifications', 'Sound Alerts', 'Settings Management']
    },
    {
      title: 'Strategy Validation',
      description: 'Multiple strategy testing với different market conditions simulation',
      url: '/strategy-validation',
      icon: <ExperimentOutlined />,
      category: 'testing',
      status: 'stable',
      features: ['Strategy Testing', 'Market Simulation', 'Performance Comparison', 'Win Rate Analysis']
    },
    {
      title: 'System Testing',
      description: 'Automated system testing suite cho tất cả services và integrations',
      url: '/system-test',
      icon: <BugOutlined />,
      category: 'testing',
      status: 'stable',
      features: ['Service Testing', 'API Connectivity', 'Error Handling', 'Performance Monitoring']
    },
    {
      title: 'Comprehensive Test',
      description: 'Complete system validation với detailed module testing',
      url: '/comprehensive-test',
      icon: <ThunderboltOutlined />,
      category: 'testing',
      status: 'new',
      features: ['Module Testing', 'Integration Testing', 'Performance Testing', 'System Validation']
    },
    {
      title: 'Main Dashboard',
      description: 'Main trading dashboard với PEPE precision handling',
      url: '/',
      icon: <DashboardOutlined />,
      category: 'core',
      status: 'stable',
      features: ['PEPE Support', 'Real-time Prices', 'Order Management', 'Chart Integration']
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return '#1890ff';
      case 'analysis': return '#52c41a';
      case 'testing': return '#faad14';
      case 'management': return '#722ed1';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'green';
      case 'beta': return 'orange';
      case 'new': return 'blue';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <RocketOutlined />;
      case 'analysis': return <LineChartOutlined />;
      case 'testing': return <BugOutlined />;
      case 'management': return <SafetyOutlined />;
      default: return <DashboardOutlined />;
    }
  };

  const groupedDemos = demoCards.reduce((acc, demo) => {
    if (!acc[demo.category]) {
      acc[demo.category] = [];
    }
    acc[demo.category].push(demo);
    return acc;
  }, {} as Record<string, DemoCard[]>);

  const categoryNames = {
    core: 'Core Features',
    analysis: 'Analysis & Analytics',
    testing: 'Testing & Validation',
    management: 'Risk Management'
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="text-center mb-8">
        <Title level={1}>
          <RocketOutlined /> Advanced Trailing Stop Demo Hub
        </Title>
        <Paragraph className="text-lg">
          Tập trung tất cả các demo và features của Advanced Trailing Stop System
        </Paragraph>
      </div>

      <Alert
        message="🎉 System Complete!"
        description="Tất cả các tính năng đã được triển khai và sẵn sàng để demo. Chọn bất kỳ module nào bên dưới để khám phá."
        type="success"
        showIcon
        className="mb-8"
      />

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col span={6}>
          <Card className="text-center">
            <div style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }}>
              <RocketOutlined />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{demoCards.length}</div>
            <div style={{ color: '#666' }}>Total Demos</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <div style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }}>
              <LineChartOutlined />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>5</div>
            <div style={{ color: '#666' }}>Strategies</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <div style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }}>
              <SafetyOutlined />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>3</div>
            <div style={{ color: '#666' }}>Risk Profiles</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <div style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }}>
              <BugOutlined />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>50+</div>
            <div style={{ color: '#666' }}>Tests</div>
          </Card>
        </Col>
      </Row>

      {/* Demo Categories */}
      {Object.entries(groupedDemos).map(([category, demos]) => (
        <div key={category} className="mb-8">
          <Title level={3} style={{ color: getCategoryColor(category) }}>
            {getCategoryIcon(category)} {categoryNames[category as keyof typeof categoryNames]}
          </Title>
          
          <Row gutter={[16, 16]}>
            {demos.map((demo, index) => (
              <Col span={8} key={index}>
                <Card
                  hoverable
                  className="h-full"
                  actions={[
                    <Link href={demo.url} key="view">
                      <Button type="primary" icon={<EyeOutlined />} block>
                        View Demo
                      </Button>
                    </Link>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <div style={{ 
                        fontSize: '32px', 
                        color: getCategoryColor(demo.category),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        backgroundColor: `${getCategoryColor(demo.category)}15`,
                        borderRadius: '8px'
                      }}>
                        {demo.icon}
                      </div>
                    }
                    title={
                      <Space>
                        {demo.title}
                        <Tag color={getStatusColor(demo.status)}>
                          {demo.status.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: '12px' }}>
                          {demo.description}
                        </Paragraph>
                        <div>
                          {demo.features.map((feature, idx) => (
                            <Tag key={idx}  style={{ marginBottom: '4px' }}>
                              {feature}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      <Divider />

      {/* Quick Navigation */}
      <Card title="🚀 Quick Navigation" className="mb-6">
        <Row gutter={[8, 8]}>
          {demoCards.map((demo, index) => (
            <Col key={index}>
              <Link href={demo.url}>
                <Button 
                  type={demo.status === 'new' ? 'primary' : 'default'}
                  icon={demo.icon}
                  size="small"
                >
                  {demo.title}
                </Button>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      {/* System Information */}
      <Card title="ℹ️ System Information">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>🎯 Core Features:</Text>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Advanced Trailing Stop với 5 strategies</li>
                <li>Intelligent Risk Management System</li>
                <li>Real-time Market Analysis</li>
                <li>Comprehensive Performance Tracking</li>
                <li>WebSocket Notification System</li>
              </ul>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>🔧 Technical Stack:</Text>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Next.js 14 với TypeScript</li>
                <li>Ant Design UI Components</li>
                <li>Real-time WebSocket Integration</li>
                <li>Binance API Integration</li>
                <li>Advanced Chart Visualization</li>
              </ul>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
