'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Progress, 
  Alert, 
  Space, 
  Button, 
  Select, 
  Statistic, 
  Tag, 
  List, 
  InputNumber, 
  Form, 
  Modal,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  CalculatorOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { 
  riskManagementService, 
  RiskAssessment, 
  PositionSizingResult, 
  RiskParameters 
} from '@/lib/riskManagementService';
import { enhancedTrailingStopService } from '@/lib/enhancedTrailingStopService';

const { Title, Text } = Typography;
const { Option } = Select;

interface RiskManagementPanelProps {
  className?: string;
}

export default function RiskManagementPanel({ className }: RiskManagementPanelProps) {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [positionSizing, setPositionSizing] = useState<PositionSizingResult | null>(null);
  const [currentProfile, setCurrentProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRiskAssessment();
    const interval = setInterval(loadRiskAssessment, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [currentProfile]);

  const loadRiskAssessment = async () => {
    setLoading(true);
    try {
      const positions = enhancedTrailingStopService.getAllPositions();
      const assessment = riskManagementService.assessRisk(positions);
      setRiskAssessment(assessment);
    } catch (error) {
      console.error('Failed to load risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profile: 'conservative' | 'moderate' | 'aggressive') => {
    setCurrentProfile(profile);
    riskManagementService.setRiskProfile(profile);
    loadRiskAssessment();
  };

  const calculatePositionSize = async () => {
    try {
      const values = await form.validateFields();
      const result = riskManagementService.calculatePositionSize(
        values.symbol,
        values.entryPrice,
        values.stopLoss,
        values.accountBalance,
        values.volatility
      );
      setPositionSizing(result);
    } catch (error) {
      console.error('Failed to calculate position size:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff7a45';
      case 'extreme': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'medium': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'high': return <WarningOutlined style={{ color: '#ff7a45' }} />;
      case 'extreme': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default: return <SafetyOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const riskParams = riskManagementService.getRiskProfile();

  return (
    <div className={className}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              🛡️ Risk Management
            </Title>
            <Space>
              <Select
                value={currentProfile}
                onChange={handleProfileChange}
                style={{ width: 150 }}
              >
                <Option value="conservative">Conservative</Option>
                <Option value="moderate">Moderate</Option>
                <Option value="aggressive">Aggressive</Option>
              </Select>
              <Button
                icon={<CalculatorOutlined />}
                onClick={() => setCalculatorVisible(true)}
              >
                Position Calculator
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Risk Assessment Overview */}
        {riskAssessment && (
          <Card title="📊 Risk Assessment" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Overall Risk"
                  value={riskAssessment.overallRisk.toUpperCase()}
                  valueStyle={{ color: getRiskColor(riskAssessment.overallRisk) }}
                  prefix={getRiskIcon(riskAssessment.overallRisk)}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Risk Score"
                  value={riskAssessment.riskScore}
                  suffix="/ 100"
                />
                <Progress 
                  percent={riskAssessment.riskScore} 
                  strokeColor={getRiskColor(riskAssessment.overallRisk)}
                  size="small"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Daily Loss Limit"
                  value={riskAssessment.maxLossProtection.dailyLossLimit}
                  precision={2}
                  prefix="$"
                />
                <Text type="secondary">
                  Used: ${riskAssessment.maxLossProtection.currentDailyLoss.toFixed(2)}
                </Text>
              </Col>
              <Col span={6}>
                <Statistic
                  title="Remaining Capacity"
                  value={riskAssessment.maxLossProtection.remainingCapacity}
                  precision={2}
                  prefix="$"
                  valueStyle={{ 
                    color: riskAssessment.maxLossProtection.remainingCapacity > 100 ? '#52c41a' : '#ff4d4f' 
                  }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Risk Factors */}
        {riskAssessment && (
          <Card title="⚠️ Risk Factors">
            <List
              dataSource={riskAssessment.factors}
              renderItem={(factor) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={factor.severity === 'high' ? 'error' : factor.severity === 'medium' ? 'warning' : 'success'} 
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{factor.type.replace('_', ' ').toUpperCase()}</Text>
                        <Tag color={getSeverityColor(factor.severity)}>
                          {factor.severity.toUpperCase()}
                        </Tag>
                        <Text type="secondary">
                          Impact: {(factor.impact * 100).toFixed(0)}%
                        </Text>
                      </Space>
                    }
                    description={factor.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Recommendations */}
        {riskAssessment && riskAssessment.recommendations.length > 0 && (
          <Card title="💡 Recommendations">
            <List
              dataSource={riskAssessment.recommendations}
              renderItem={(recommendation) => (
                <List.Item>
                  <Alert
                    message={recommendation}
                    type={recommendation.includes('🚨') ? 'error' : recommendation.includes('⚠️') ? 'warning' : 'info'}
                    showIcon
                    style={{ width: '100%' }}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Risk Parameters */}
        <Card title="⚙️ Risk Parameters">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Max Risk Per Trade"
                value={riskParams.maxRiskPerTrade}
                suffix="%"
                prefix={<RiseOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Max Daily Loss"
                value={riskParams.maxDailyLoss}
                suffix="%"
                prefix={<FallOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Max Drawdown"
                value={riskParams.maxDrawdown}
                suffix="%"
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Max Positions"
                value={riskParams.maxPositions}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Max Correlated"
                value={riskParams.maxCorrelatedPositions}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Volatility Multiplier"
                value={riskParams.volatilityMultiplier}
                suffix="x"
              />
            </Col>
          </Row>
        </Card>

        {/* Position Sizing Result */}
        {positionSizing && (
          <Card title="📏 Position Sizing Result">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    title="Recommended Size"
                    value={positionSizing.recommendedSize}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Statistic
                    title="Risk Amount"
                    value={positionSizing.riskAmount}
                    precision={2}
                    prefix="$"
                  />
                  <Statistic
                    title="Risk Percentage"
                    value={positionSizing.riskPercentage}
                    precision={2}
                    suffix="%"
                  />
                </Space>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Reasoning:</Text>
                  <ul style={{ marginTop: 8 }}>
                    {positionSizing.reasoning.map((reason, index) => (
                      <li key={index}>
                        <Text>{reason}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
                {positionSizing.warnings.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Warnings:</Text>
                    <ul style={{ marginTop: 8 }}>
                      {positionSizing.warnings.map((warning, index) => (
                        <li key={index}>
                          <Text type="warning">{warning}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        )}
      </Space>

      {/* Position Size Calculator Modal */}
      <Modal
        title="Position Size Calculator"
        open={calculatorVisible}
        onOk={calculatePositionSize}
        onCancel={() => setCalculatorVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            symbol: 'BTC/USDT',
            accountBalance: 10000,
            entryPrice: 45000,
            stopLoss: 43000,
            volatility: 0.3
          }}
        >
          <Alert
            message="Position Size Calculator"
            description="Calculate optimal position size based on your risk parameters and market conditions"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
                <Select>
                  <Option value="BTC/USDT">BTC/USDT</Option>
                  <Option value="ETH/USDT">ETH/USDT</Option>
                  <Option value="PEPE/USDT">PEPE/USDT</Option>
                  <Option value="SOL/USDT">SOL/USDT</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountBalance" label="Account Balance ($)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="entryPrice" label="Entry Price" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stopLoss" label="Stop Loss Price" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="volatility" label="Volatility (optional)">
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              max={2} 
              step={0.01}
              placeholder="0.3 = 30% annualized volatility"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
