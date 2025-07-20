'use client';

import React, { useState } from 'react';
import AntdLayoutWrapper from '../../components/AntdLayoutWrapper';
import {
  Card,
  Row,
  Col,
  Typography,
  Anchor,
  Space,
  Tag,
  Alert,
  Button,
  Collapse,
  Table,
  Steps,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  BookOutlined,
  RocketOutlined,
  BarChartOutlined,
  SettingOutlined,
  BugOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview');

  // Strategy data for table
  const strategyData = [
    {
      key: 'percentage',
      strategy: 'Percentage-based',
      difficulty: 'Beginner',
      risk: 'Low',
      description: 'Trailing % cố định'
    },
    {
      key: 'atr',
      strategy: 'ATR',
      difficulty: 'Intermediate', 
      risk: 'Medium',
      description: 'Dựa trên volatility'
    },
    {
      key: 'fibonacci',
      strategy: 'Fibonacci',
      difficulty: 'Advanced',
      risk: 'Medium', 
      description: 'Fibonacci retracement'
    },
    {
      key: 'bollinger',
      strategy: 'Bollinger Bands',
      difficulty: 'Intermediate',
      risk: 'Medium',
      description: 'Bollinger Bands analysis'
    },
    {
      key: 'volume_profile',
      strategy: 'Volume Profile',
      difficulty: 'Expert',
      risk: 'High',
      description: 'Volume analysis'
    },
    {
      key: 'smart_money',
      strategy: 'Smart Money',
      difficulty: 'Expert',
      risk: 'High',
      description: 'ICT concepts'
    },
    {
      key: 'ichimoku',
      strategy: 'Ichimoku',
      difficulty: 'Advanced',
      risk: 'Medium',
      description: 'Japanese system'
    },
    {
      key: 'pivot_points',
      strategy: 'Pivot Points',
      difficulty: 'Intermediate',
      risk: 'Medium',
      description: 'Support/Resistance'
    },
    {
      key: 'support_resistance',
      strategy: 'Support/Resistance',
      difficulty: 'Intermediate',
      risk: 'Medium',
      description: 'Key levels'
    },
    {
      key: 'dynamic',
      strategy: 'Dynamic',
      difficulty: 'Advanced',
      risk: 'High',
      description: 'Multi-indicator'
    },
    {
      key: 'hybrid',
      strategy: 'Hybrid Multi-Strategy',
      difficulty: 'Expert',
      risk: 'High',
      description: 'AI-optimized'
    }
  ];

  const strategyColumns = [
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Độ Khó',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => {
        const color = {
          'Beginner': 'green',
          'Intermediate': 'blue', 
          'Advanced': 'orange',
          'Expert': 'red'
        }[difficulty] || 'default';
        return <Tag color={color}>{difficulty}</Tag>;
      }
    },
    {
      title: 'Risk',
      dataIndex: 'risk',
      key: 'risk',
      render: (risk: string) => {
        const color = {
          'Low': 'green',
          'Medium': 'orange',
          'High': 'red'
        }[risk] || 'default';
        return <Tag color={color}>{risk}</Tag>;
      }
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description'
    }
  ];

  const testSteps = [
    {
      title: 'Chuẩn Bị',
      description: 'Khởi động server và kiểm tra kết nối',
      icon: <SettingOutlined />
    },
    {
      title: 'Cấu Hình',
      description: 'Chọn symbol và strategy phù hợp',
      icon: <BarChartOutlined />
    },
    {
      title: 'Tạo Position',
      description: 'Demo Position hoặc Real Position',
      icon: <PlayCircleOutlined />
    },
    {
      title: 'Theo Dõi',
      description: 'Monitor alerts và performance',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <AntdLayoutWrapper>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Hướng Dẫn Advanced Trailing Stop
                </Title>
                <Text type="secondary">
                  Hướng dẫn chi tiết sử dụng hệ thống trailing stop nâng cao
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<RocketOutlined />}
                href="/advanced-trailing-stop"
                target="_blank"
              >
                Mở Demo
              </Button>
              <Button 
                icon={<PlayCircleOutlined />}
                href="/enhanced-trailing-stop"
                target="_blank"
              >
                Enhanced Demo
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Navigation */}
        <Col xs={24} lg={6}>
          <Card title="Mục Lục" size="small">
            <Anchor
              affix={false}
              onClick={(e, link) => {
                e.preventDefault();
                setActiveSection(link.href.replace('#', ''));
              }}
              items={[
                {
                  key: 'overview',
                  href: '#overview',
                  title: '🎯 Tổng Quan'
                },
                {
                  key: 'interface',
                  href: '#interface', 
                  title: '🚀 Giao Diện'
                },
                {
                  key: 'strategies',
                  href: '#strategies',
                  title: '📊 Strategies'
                },
                {
                  key: 'practice',
                  href: '#practice',
                  title: '🧪 Thực Hành'
                },
                {
                  key: 'troubleshooting',
                  href: '#troubleshooting',
                  title: '🔧 Troubleshooting'
                }
              ]}
            />
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={18}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Overview Section */}
            <Card id="overview" title={
              <Space>
                <InfoCircleOutlined />
                Tổng Quan
              </Space>
            }>
              <Alert
                message="Advanced Trailing Stop System"
                description="Công cụ trading nâng cao cho phép tạo và quản lý các vị thế trailing stop với 11 chiến lược khác nhau. Hệ thống tự động giúp bảo vệ lợi nhuận và giảm thiểu rủi ro."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <BarChartOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <Title level={4}>11 Strategies</Title>
                    <Text type="secondary">Từ Beginner đến Expert</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <RocketOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <Title level={4}>Real-time</Title>
                    <Text type="secondary">Monitoring & Alerts</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    <Title level={4}>Performance</Title>
                    <Text type="secondary">Analytics & Metrics</Text>
                  </Card>
                </Col>
              </Row>

              <Divider />
              
              <Title level={4}>URL Truy Cập</Title>
              <Alert
                message={
                  <Space>
                    <Text code>http://localhost:3000/advanced-trailing-stop</Text>
                    <Button 
                      size="small" 
                      type="link"
                      href="/advanced-trailing-stop"
                      target="_blank"
                    >
                      Mở Ngay
                    </Button>
                  </Space>
                }
                type="success"
              />
            </Card>

            {/* Interface Section */}
            <Card id="interface" title={
              <Space>
                <SettingOutlined />
                Hướng Dẫn Giao Diện
              </Space>
            }>
              <Steps
                direction="vertical"
                current={-1}
                items={testSteps}
              />

              <Divider />

              <Title level={4}>Các Thành Phần UI Chính</Title>
              <Collapse>
                <Panel header="📊 Header Panel - Thông Tin Tổng Quan" key="header">
                  <ul>
                    <li><Text strong>Trailing Stop Nâng Cao</Text>: Tiêu đề chính</li>
                    <li><Text strong>Badge "Đang Hoạt Động"</Text>: Số lượng positions active</li>
                    <li><Text strong>Total P&L</Text>: Tổng lợi nhuận/lỗ</li>
                  </ul>
                </Panel>
                
                <Panel header="⚙️ Strategy Configuration Panel" key="config">
                  <ul>
                    <li><Text strong>Symbol Selector</Text>: BTC/USDT, ETH/USDT, PEPE/USDT</li>
                    <li><Text strong>Strategy Selector</Text>: 11 strategies có sẵn</li>
                    <li><Text strong>Strategy Config</Text>: Tham số chi tiết</li>
                    <li><Text strong>Action Buttons</Text>: Create, Demo, Stop</li>
                  </ul>
                </Panel>

                <Panel header="🔔 Real-time Alerts Panel" key="alerts">
                  <ul>
                    <li><Badge status="success" text="Success: activation, profit taking" /></li>
                    <li><Badge status="warning" text="Warning: price movements" /></li>
                    <li><Badge status="error" text="Error: system issues" /></li>
                  </ul>
                </Panel>

                <Panel header="📈 Positions & Chart Panel" key="positions">
                  <ul>
                    <li><Text strong>Active Positions</Text>: Danh sách positions</li>
                    <li><Text strong>Performance Metrics</Text>: Chỉ số hiệu suất</li>
                    <li><Text strong>Candlestick Chart</Text>: Biểu đồ với trailing stops</li>
                  </ul>
                </Panel>
              </Collapse>
            </Card>

            {/* Strategies Section */}
            <Card id="strategies" title={
              <Space>
                <BarChartOutlined />
                Chi Tiết 11 Strategies
              </Space>
            }>
              <Alert
                message="Chọn Strategy Phù Hợp"
                description="Mỗi strategy có độ phức tạp và mức risk khác nhau. Người mới nên bắt đầu với Percentage-based."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Table
                dataSource={strategyData}
                columns={strategyColumns}
                pagination={false}
                size="small"
              />

              <Divider />

              <Collapse>
                <Panel header="🟢 Percentage-based Strategy (Beginner)" key="percentage">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Chiến lược cơ bản sử dụng phần trăm cố định" type="info" />
                    <Text><Text strong>Cách hoạt động</Text>: Đặt stop loss ở khoảng cách % cố định từ giá cao nhất</Text>
                    <Text><Text strong>Tham số</Text>: trailingPercent (2-10%), maxLossPercent (3-15%)</Text>
                    <Text><Text strong>Ví dụ</Text>: Entry $50,000, Trailing 5% → Stop Loss $47,500</Text>
                    <Text><Text strong>Phù hợp</Text>: Người mới, thị trường ít biến động</Text>
                  </Space>
                </Panel>

                <Panel header="🟡 ATR Strategy (Intermediate)" key="atr">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Sử dụng Average True Range để tính volatility" type="warning" />
                    <Text><Text strong>Cách hoạt động</Text>: Stop loss = Current Price - (ATR × Multiplier)</Text>
                    <Text><Text strong>Tham số</Text>: atrPeriod (10-20), atrMultiplier (1.5-3.0)</Text>
                    <Text><Text strong>Ví dụ</Text>: BTC $50,000, ATR $2,000, Multiplier 2.0 → Stop $46,000</Text>
                    <Text><Text strong>Phù hợp</Text>: Thị trường volatility cao, traders có kinh nghiệm</Text>
                  </Space>
                </Panel>

                <Panel header="🟠 Fibonacci Strategy (Advanced)" key="fibonacci">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Sử dụng Fibonacci retracement levels" type="error" />
                    <Text><Text strong>Cách hoạt động</Text>: Đặt stop loss tại các mức Fibonacci</Text>
                    <Text><Text strong>Levels</Text>: 23.6%, 38.2%, 50%, 61.8%, 78.6%</Text>
                    <Text><Text strong>Ví dụ</Text>: Range $45k-$55k → Stop tại 38.2% ($51,180)</Text>
                    <Text><Text strong>Phù hợp</Text>: Technical analysis traders, trending markets</Text>
                  </Space>
                </Panel>

                <Panel header="🔴 Expert Strategies (Volume Profile, Smart Money, Hybrid)" key="expert">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Strategies nâng cao cho professional traders" type="error" />
                    <Text><Text strong>Volume Profile</Text>: Phân tích volume tại các price levels</Text>
                    <Text><Text strong>Smart Money</Text>: ICT concepts, Order Blocks, Fair Value Gaps</Text>
                    <Text><Text strong>Hybrid</Text>: Kết hợp nhiều strategies với AI optimization</Text>
                    <Text><Text strong>Cảnh báo</Text>: Cần kinh nghiệm và hiểu biết sâu về thị trường</Text>
                  </Space>
                </Panel>
              </Collapse>
            </Card>

            {/* Practice Section */}
            <Card id="practice" title={
              <Space>
                <PlayCircleOutlined />
                Hướng Dẫn Thực Hành
              </Space>
            }>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card 
                    title="🧪 Test Case 1: Mua Ngay Lập Tức" 
                    size="small"
                    extra={<Tag color="green">Beginner</Tag>}
                  >
                    <Steps
                      direction="vertical"
                      size="small"
                      current={-1}
                      items={[
                        {
                          title: 'Chọn BTC/USDT',
                          description: 'Symbol dropdown'
                        },
                        {
                          title: 'Strategy: Percentage',
                          description: 'Trailing 5%'
                        },
                        {
                          title: 'Click "Demo Position"',
                          description: 'Tạo position demo'
                        },
                        {
                          title: 'Kiểm tra Alerts',
                          description: 'Status: Active'
                        }
                      ]}
                    />
                    
                    <Alert
                      message="Kết quả mong đợi"
                      description="Position với status 'Active', entry price = current price, trailing stop hoạt động ngay"
                      type="success"
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card 
                    title="🎯 Test Case 2: Activation Price" 
                    size="small"
                    extra={<Tag color="orange">Intermediate</Tag>}
                  >
                    <Steps
                      direction="vertical"
                      size="small"
                      current={-1}
                      items={[
                        {
                          title: 'Chọn ETH/USDT',
                          description: 'Symbol dropdown'
                        },
                        {
                          title: 'Strategy: ATR',
                          description: 'Period 14, Multiplier 2.0'
                        },
                        {
                          title: 'Set Activation Price',
                          description: '+5% từ giá hiện tại'
                        },
                        {
                          title: 'Click "Create Position"',
                          description: 'Real position'
                        }
                      ]}
                    />
                    
                    <Alert
                      message="Kết quả mong đợi"
                      description="Position với status 'Pending Activation', chờ giá đạt activation price"
                      type="warning"
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                </Col>
              </Row>

              <Divider />

              <Title level={4}>Console Logs Quan Trọng</Title>
              <Card size="small">
                <Text code>[TrailingStopState] Successfully loaded 2 simulations</Text><br />
                <Text code>[TrailingStop] Price update for BTC/USDT: $50,000 → $50,500</Text><br />
                <Text code>[TrailingStop] Position triggered at $47,975</Text><br />
                <Text code style={{ color: '#ff4d4f' }}>[TrailingStop] API Error: Rate limit exceeded</Text>
              </Card>
            </Card>

            {/* Troubleshooting Section */}
            <Card id="troubleshooting" title={
              <Space>
                <BugOutlined />
                Troubleshooting
              </Space>
            }>
              <Collapse>
                <Panel header="❌ Lỗi Database Schema" key="database">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="Could not find the 'activationPrice' column"
                      type="error"
                    />
                    <Text><Text strong>Cách khắc phục</Text>:</Text>
                    <Text code>node test-database-schema.js</Text>
                    <Text code>node apply-database-fix.js</Text>
                    <Text code>node test-with-lowercase.js</Text>
                  </Space>
                </Panel>

                <Panel header="🌐 Lỗi API Connection" key="api">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="Failed to fetch price data"
                      type="warning"
                    />
                    <Text><Text strong>Kiểm tra server</Text>:</Text>
                    <Text code>curl http://localhost:3000/api/ticker</Text>
                    <Text><Text strong>Restart server</Text>:</Text>
                    <Text code>npm run dev</Text>
                  </Space>
                </Panel>

                <Panel header="⚙️ Lỗi Position Creation" key="position">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="Strategy configuration invalid"
                      type="warning"
                    />
                    <Text><Text strong>Giải pháp</Text>:</Text>
                    <ul>
                      <li>Kiểm tra tất cả required fields</li>
                      <li>Reset về default settings</li>
                      <li>Thử Demo Position trước</li>
                    </ul>
                  </Space>
                </Panel>

                <Panel header="🔄 Lỗi Real-time Updates" key="realtime">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="Price updates stopped"
                      type="error"
                    />
                    <Text><Text strong>Cách khắc phục</Text>:</Text>
                    <ul>
                      <li>Refresh trang (F5)</li>
                      <li>Kiểm tra console logs</li>
                      <li>Restart monitoring</li>
                    </ul>
                  </Space>
                </Panel>
              </Collapse>

              <Divider />

              <Title level={4}>Test Scripts Hữu Ích</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Text strong>Comprehensive Test</Text><br />
                    <Text code>node test-advanced-trailing-stop.js</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Text strong>Database Fix</Text><br />
                    <Text code>node apply-database-fix.js</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Text strong>Web Interface Test</Text><br />
                    <Text code>node test-web-interface.js</Text>
                  </Card>
                </Col>
              </Row>
            </Card>

          </Space>
        </Col>
      </Row>
    </div>
    </AntdLayoutWrapper>
  );
}
