'use client';

import React from 'react';
import { Card, Row, Col, Typography, Space, Divider } from 'antd';
import {
  LineChartOutlined,
  DashboardOutlined,
  BarChartOutlined,
  WalletOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function IntegratedTradingHomePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Title level={2} className="mb-2">
          🚀 Integrated Trading Platform
        </Title>
        <Text type="secondary" className="text-lg">
          Advanced cryptocurrency trading with AI-powered insights and real-time analytics
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Trading Dashboard */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            className="h-full"
            cover={
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 flex items-center justify-center">
                <LineChartOutlined className="text-4xl text-white" />
              </div>
            }
          >
            <Card.Meta
              title="Trading Dashboard"
              description="Real-time market data, advanced charting, and order management in one unified interface."
            />
            <div className="mt-4">
              <Space direction="vertical" size="small">
                <Text>• Live price feeds from multiple exchanges</Text>
                <Text>• Advanced technical indicators</Text>
                <Text>• One-click order execution</Text>
                <Text>• Portfolio performance tracking</Text>
              </Space>
            </div>
          </Card>
        </Col>

        {/* AI Analytics */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            className="h-full"
            cover={
              <div className="bg-gradient-to-r from-green-500 to-teal-600 h-32 flex items-center justify-center">
                <BarChartOutlined className="text-4xl text-white" />
              </div>
            }
          >
            <Card.Meta
              title="AI-Powered Analytics"
              description="Machine learning algorithms analyze market patterns and provide intelligent trading insights."
            />
            <div className="mt-4">
              <Space direction="vertical" size="small">
                <Text>• Predictive price analysis</Text>
                <Text>• Market sentiment indicators</Text>
                <Text>• Risk assessment tools</Text>
                <Text>• Automated trading signals</Text>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Portfolio Management */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            className="h-full"
            cover={
              <div className="bg-gradient-to-r from-orange-500 to-red-600 h-32 flex items-center justify-center">
                <WalletOutlined className="text-4xl text-white" />
              </div>
            }
          >
            <Card.Meta
              title="Portfolio Management"
              description="Comprehensive portfolio tracking with advanced analytics and performance metrics."
            />
            <div className="mt-4">
              <Space direction="vertical" size="small">
                <Text>• Multi-exchange portfolio sync</Text>
                <Text>• P&L tracking and reporting</Text>
                <Text>• Asset allocation analysis</Text>
                <Text>• Tax reporting tools</Text>
              </Space>
            </div>
          </Card>
        </Col>

        {/* System Monitoring */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            className="h-full"
            cover={
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-32 flex items-center justify-center">
                <DashboardOutlined className="text-4xl text-white" />
              </div>
            }
          >
            <Card.Meta
              title="System Monitoring"
              description="Real-time system health monitoring and performance optimization tools."
            />
            <div className="mt-4">
              <Space direction="vertical" size="small">
                <Text>• Database performance metrics</Text>
                <Text>• API response time monitoring</Text>
                <Text>• Cache optimization</Text>
                <Text>• Error tracking and alerts</Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider className="my-8" />

      {/* Quick Actions */}
      <div className="mb-8">
        <Title level={3} className="mb-4">Quick Actions</Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Card
              hoverable
              size="small"
              className="text-center"
            >
              <SettingOutlined className="text-2xl text-blue-500 mb-2" />
              <Text strong>Settings</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card
              hoverable
              size="small"
              className="text-center"
            >
              <BellOutlined className="text-2xl text-green-500 mb-2" />
              <Text strong>Alerts</Text>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Status Information */}
      <Card className="bg-gray-50">
        <Title level={4} className="mb-3">System Status</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <Text strong>Trading Engine</Text>
              <br />
              <Text type="secondary">Online</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <Text strong>Market Data</Text>
              <br />
              <Text type="secondary">Connected</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <Text strong>Database</Text>
              <br />
              <Text type="secondary">Healthy</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}