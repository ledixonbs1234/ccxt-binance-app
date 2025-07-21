'use client';

import React, { useState } from 'react';
import {
  FloatButton,
  Drawer,
  Card,
  Space,
  Typography,
  Button,
  Row,
  Col,
  Alert,
  Tag
} from 'antd';
import {
  QuestionCircleOutlined,
  BookOutlined,
  RocketOutlined,
  BarChartOutlined,
  HomeOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function NavigationHelper() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const demoPages = [
    {
      title: 'Trang Chính',
      description: 'Dashboard chính với trading tools',
      url: '/',
      icon: <HomeOutlined />,
      color: 'blue'
    },
    {
      title: 'Advanced Trailing Stop',
      description: 'Demo nâng cao với 11 strategies',
      url: '/advanced-trailing-stop',
      icon: <RocketOutlined />,
      color: 'green'
    },
    {
      title: 'Enhanced Trailing Stop',
      description: 'Phiên bản cải tiến với AI',
      url: '/enhanced-trailing-stop',
      icon: <BarChartOutlined />,
      color: 'orange'
    },
    {
      title: 'Strategy Chart Demo',
      description: 'Demo strategies với biểu đồ',
      url: '/strategy-chart-demo',
      icon: <BarChartOutlined />,
      color: 'purple'
    },
    {
      title: 'Multiple Strategies Demo',
      description: 'Demo nhiều strategies cùng lúc',
      url: '/multiple-strategies-demo',
      icon: <BarChartOutlined />,
      color: 'cyan'
    }
  ];

  const guidePages = [
    {
      title: 'Hướng Dẫn Chi Tiết',
      description: 'Hướng dẫn đầy đủ với 11 strategies',
      url: '/guide',
      icon: <BookOutlined />,
      color: 'blue'
    }
  ];

  return (
    <>
      {/* Float Button */}
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24 }}
        icon={<QuestionCircleOutlined />}
        tooltip="Hướng dẫn & Navigation"
      >
        <FloatButton
          icon={<BookOutlined />}
          tooltip="Hướng dẫn chi tiết"
          onClick={() => window.open('/guide', '_blank')}
        />
        <FloatButton
          icon={<RocketOutlined />}
          tooltip="Advanced Demo"
          onClick={() => window.open('/advanced-trailing-stop', '_blank')}
        />
        <FloatButton
          icon={<BarChartOutlined />}
          tooltip="Enhanced Demo"
          onClick={() => window.open('/enhanced-trailing-stop', '_blank')}
        />
        <FloatButton
          icon={<HomeOutlined />}
          tooltip="Trang chính"
          onClick={() => window.open('/', '_blank')}
        />
        <FloatButton
          tooltip="Xem tất cả"
          onClick={() => setDrawerVisible(true)}
        />
      </FloatButton.Group>

      {/* Navigation Drawer */}
      <Drawer
        title={
          <Space>
            <QuestionCircleOutlined />
            Navigation & Hướng Dẫn
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setDrawerVisible(false)}
          />
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* Quick Info */}
          <Alert
            message="Advanced Trailing Stop System"
            description="Hệ thống trading nâng cao với 11 strategies khác nhau. Chọn demo phù hợp với level của bạn."
            type="info"
            showIcon
          />

          {/* Demo Pages */}
          <Card title="🚀 Demo Pages" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {demoPages.map((page, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  onClick={() => window.open(page.url, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
                  <Row align="middle">
                    <Col span={4}>
                      <div style={{ fontSize: 24, color: page.color }}>
                        {page.icon}
                      </div>
                    </Col>
                    <Col span={20}>
                      <div>
                        <Text strong>{page.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {page.description}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>

          {/* Guide Pages */}
          <Card title="📚 Hướng Dẫn" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {guidePages.map((page, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  onClick={() => window.open(page.url, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
                  <Row align="middle">
                    <Col span={4}>
                      <div style={{ fontSize: 24, color: page.color }}>
                        {page.icon}
                      </div>
                    </Col>
                    <Col span={20}>
                      <div>
                        <Text strong>{page.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {page.description}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>

          {/* Quick Tips */}
          <Card title="💡 Quick Tips" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Cho người mới"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li>Bắt đầu với <Tag color="green">Advanced Demo</Tag></li>
                    <li>Chọn strategy <Tag color="blue">Percentage</Tag></li>
                    <li>Sử dụng <Tag color="orange">Demo Position</Tag> trước</li>
                  </ul>
                }
                type="success"
                
              />
              
              <Alert
                message="Cho trader có kinh nghiệm"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li>Thử <Tag color="purple">Enhanced Demo</Tag></li>
                    <li>Sử dụng <Tag color="red">ATR/Fibonacci</Tag> strategies</li>
                    <li>Combine multiple strategies</li>
                  </ul>
                }
                type="warning"
                
              />
            </Space>
          </Card>

          {/* Test Scripts */}
          <Card title="🔧 Test Scripts" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text code>node test-advanced-trailing-stop.js</Text>
              <Text type="secondary">Comprehensive system test</Text>
              
              <Text code>node apply-database-fix.js</Text>
              <Text type="secondary">Fix database schema issues</Text>
              
              <Text code>node test-web-interface.js</Text>
              <Text type="secondary">Test all web interfaces</Text>
            </Space>
          </Card>

        </Space>
      </Drawer>
    </>
  );
}
