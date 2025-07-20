'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Steps,
  Card,
  Space,
  Typography,
  Alert,
  Tag,
  Divider,
  Row,
  Col,
  Collapse,
  List
} from 'antd';
import {
  QuestionCircleOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface QuickGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuickGuideModal({ visible, onClose }: QuickGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const quickSteps = [
    {
      title: 'Chọn Symbol & Strategy',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Bước đầu tiên"
            description="Chọn cặp trading (BTC/USDT, ETH/USDT) và strategy phù hợp với level của bạn"
            type="info"
            showIcon
          />
          <Card size="small">
            <Text strong>Cho người mới:</Text>
            <ul>
              <li>Symbol: <Text code>BTC/USDT</Text></li>
              <li>Strategy: <Tag color="green">Percentage-based</Tag></li>
              <li>Trailing %: <Text code>5%</Text></li>
            </ul>
          </Card>
        </Space>
      )
    },
    {
      title: 'Tạo Demo Position',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Khuyến nghị"
            description="Luôn bắt đầu với Demo Position để hiểu cách hoạt động trước khi dùng real money"
            type="warning"
            showIcon
          />
          <Card size="small">
            <Text strong>Demo Position:</Text>
            <ul>
              <li>✅ An toàn, không rủi ro</li>
              <li>✅ Học cách sử dụng system</li>
              <li>✅ Quan sát real-time updates</li>
              <li>✅ Hiểu alerts và notifications</li>
            </ul>
          </Card>
        </Space>
      )
    },
    {
      title: 'Monitor & Learn',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Theo dõi kết quả"
            description="Quan sát ít nhất 15-30 phút để hiểu cách trailing stop hoạt động"
            type="success"
            showIcon
          />
          <Card size="small">
            <Text strong>Cần chú ý:</Text>
            <ul>
              <li>🔔 <Text strong>Alerts Panel</Text>: Thông báo real-time</li>
              <li>📊 <Text strong>Positions Panel</Text>: Trạng thái position</li>
              <li>📈 <Text strong>Chart</Text>: Trailing stop visualization</li>
              <li>💰 <Text strong>P&L</Text>: Lợi nhuận/lỗ real-time</li>
            </ul>
          </Card>
        </Space>
      )
    }
  ];

  const strategies = [
    { name: 'Percentage', level: 'Beginner', risk: 'Low', color: 'green' },
    { name: 'ATR', level: 'Intermediate', risk: 'Medium', color: 'blue' },
    { name: 'Fibonacci', level: 'Advanced', risk: 'Medium', color: 'orange' },
    { name: 'Volume Profile', level: 'Expert', risk: 'High', color: 'red' },
    { name: 'Smart Money', level: 'Expert', risk: 'High', color: 'red' },
    { name: 'Hybrid', level: 'Expert', risk: 'High', color: 'red' }
  ];

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          Quick Start Guide
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="guide" icon={<BookOutlined />} href="/guide" target="_blank">
          Hướng Dẫn Chi Tiết
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* Quick Steps */}
        <Card title="🚀 3 Bước Bắt Đầu Nhanh" size="small">
          <Steps
            current={currentStep}
            onChange={setCurrentStep}
            direction="vertical"
            items={quickSteps.map((step, index) => ({
              title: step.title,
              description: currentStep === index ? step.content : null
            }))}
          />
        </Card>

        {/* Strategy Quick Reference */}
        <Card title="📊 Strategies Phổ Biến" size="small">
          <Row gutter={[8, 8]}>
            {strategies.map((strategy, index) => (
              <Col xs={12} sm={8} key={index}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text strong>{strategy.name}</Text><br />
                  <Tag color={strategy.color} size="small">{strategy.level}</Tag><br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Risk: {strategy.risk}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Test Cases */}
        <Card title="🧪 Test Cases Cơ Bản" size="small">
          <Collapse size="small">
            <Panel header="✅ Test Case 1: Immediate Buy" key="1">
              <List
                size="small"
                dataSource={[
                  'Symbol: BTC/USDT',
                  'Strategy: Percentage (5%)',
                  'Click "Demo Position"',
                  'Kết quả: Status "Active", trailing ngay lập tức'
                ]}
                renderItem={(item, index) => (
                  <List.Item>
                    <Text>{index + 1}. {item}</Text>
                  </List.Item>
                )}
              />
            </Panel>
            
            <Panel header="⏳ Test Case 2: Activation Price" key="2">
              <List
                size="small"
                dataSource={[
                  'Symbol: ETH/USDT',
                  'Strategy: ATR (Period 14)',
                  'Set activation price +5% từ current',
                  'Kết quả: Status "Pending", chờ activation'
                ]}
                renderItem={(item, index) => (
                  <List.Item>
                    <Text>{index + 1}. {item}</Text>
                  </List.Item>
                )}
              />
            </Panel>
          </Collapse>
        </Card>

        {/* Quick Troubleshooting */}
        <Card title="🔧 Troubleshooting Nhanh" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Lỗi thường gặp"
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li><Text strong>Database error</Text>: Chạy <Text code>node test-database-schema.js</Text></li>
                  <li><Text strong>API error</Text>: Kiểm tra server <Text code>http://localhost:3000</Text></li>
                  <li><Text strong>Position không tạo được</Text>: Thử Demo Position trước</li>
                  <li><Text strong>Alerts không hiện</Text>: Refresh trang (F5)</li>
                </ul>
              }
              type="warning"
              showIcon
            />
          </Space>
        </Card>

        {/* Links */}
        <Card title="🔗 Links Hữu Ích" size="small">
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Button 
                block 
                icon={<RocketOutlined />}
                href="/advanced-trailing-stop"
                target="_blank"
              >
                Advanced Demo
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button 
                block 
                icon={<BarChartOutlined />}
                href="/enhanced-trailing-stop"
                target="_blank"
              >
                Enhanced Demo
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button 
                block 
                icon={<BookOutlined />}
                href="/guide"
                target="_blank"
              >
                Hướng Dẫn Chi Tiết
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button 
                block 
                icon={<InfoCircleOutlined />}
                href="/"
                target="_blank"
              >
                Trang Chính
              </Button>
            </Col>
          </Row>
        </Card>

      </Space>
    </Modal>
  );
}
