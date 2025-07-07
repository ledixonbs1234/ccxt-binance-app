'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Progress, 
  Alert, 
  Space, 
  Button, 
  Select, 
  Table, 
  Statistic,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  BarChartOutlined,
  AlertOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { marketAnalysisService, MarketAnalysisResult, MarketAlert } from '@/lib/marketAnalysisService';
import { tradingApiService } from '@/lib/tradingApiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface MarketAnalysisPanelProps {
  symbol?: string;
  className?: string;
}

export default function MarketAnalysisPanel({ symbol = 'BTC/USDT', className }: MarketAnalysisPanelProps) {
  const [analysisResult, setAnalysisResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAnalysis();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalysis, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [selectedSymbol, autoRefresh]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const candles = await tradingApiService.getCandleData(selectedSymbol, '1h', 100);
      const analysis = await marketAnalysisService.analyzeMarket(selectedSymbol, candles);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Failed to load market analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return '#52c41a';
      case 'bearish': return '#ff4d4f';
      case 'sideways': return '#faad14';
      default: return '#d9d9d9';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <RiseOutlined />;
      case 'bearish': return <FallOutlined />;
      case 'sideways': return <LineChartOutlined />;
      default: return <BarChartOutlined />;
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const supportResistanceColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'support' ? 'green' : 'red'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toFixed(4)
    },
    {
      title: 'Strength',
      dataIndex: 'strength',
      key: 'strength',
      render: (strength: number) => (
        <Progress 
          percent={strength * 100} 
          size="small" 
          status={strength > 0.7 ? 'success' : strength > 0.4 ? 'normal' : 'exception'}
          showInfo={false}
        />
      )
    },
    {
      title: 'Touches',
      dataIndex: 'touches',
      key: 'touches'
    }
  ];

  const alertColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getAlertSeverityColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Badge 
          status={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'processing'} 
          text={severity.toUpperCase()} 
        />
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleTimeString()
    }
  ];

  if (!analysisResult) {
    return (
      <Card className={className} loading={loading}>
        <Alert message="Loading market analysis..." type="info" />
      </Card>
    );
  }

  const { marketCondition, strategyOptimization, alerts } = analysisResult;

  return (
    <div className={className}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              📊 Market Analysis - {selectedSymbol}
            </Title>
            <Space>
              <Select
                value={selectedSymbol}
                onChange={setSelectedSymbol}
                style={{ width: 150 }}
              >
                <Option value="BTC/USDT">BTC/USDT</Option>
                <Option value="ETH/USDT">ETH/USDT</Option>
                <Option value="PEPE/USDT">PEPE/USDT</Option>
                <Option value="SOL/USDT">SOL/USDT</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAnalysis}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Market Condition Overview */}
        <Card title="🎯 Market Condition">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="Trend"
                value={marketCondition.trend.toUpperCase()}
                valueStyle={{ color: getTrendColor(marketCondition.trend) }}
                prefix={getTrendIcon(marketCondition.trend)}
              />
              <Progress 
                percent={marketCondition.trendStrength * 100} 
                size="small" 
                strokeColor={getTrendColor(marketCondition.trend)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Volatility"
                value={marketCondition.volatility.toUpperCase()}
                valueStyle={{ color: getVolatilityColor(marketCondition.volatility) }}
                prefix={<ThunderboltOutlined />}
              />
              <Text type="secondary">
                {(marketCondition.volatilityValue * 100).toFixed(1)}%
              </Text>
            </Col>
            <Col span={6}>
              <Statistic
                title="Volume"
                value={marketCondition.volume.toUpperCase()}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Market Phase"
                value={marketCondition.marketPhase.toUpperCase()}
                prefix={<EyeOutlined />}
              />
              <Progress 
                percent={marketCondition.confidence * 100} 
                size="small" 
                format={() => `${(marketCondition.confidence * 100).toFixed(0)}% confidence`}
              />
            </Col>
          </Row>
        </Card>

        {/* Strategy Optimization */}
        <Card title="🎯 Strategy Recommendation">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Recommended Strategy: </Text>
                  <Tag color="blue" style={{ fontSize: '14px' }}>
                    {strategyOptimization.recommendedStrategy.toUpperCase()}
                  </Tag>
                </div>
                <div>
                  <Text strong>Confidence: </Text>
                  <Progress 
                    percent={strategyOptimization.confidence * 100} 
                    size="small" 
                    status={strategyOptimization.confidence > 0.7 ? 'success' : 'normal'}
                  />
                </div>
                <div>
                  <Text strong>Risk Level: </Text>
                  <Tag color={
                    strategyOptimization.riskLevel === 'low' ? 'green' : 
                    strategyOptimization.riskLevel === 'medium' ? 'orange' : 'red'
                  }>
                    {strategyOptimization.riskLevel.toUpperCase()}
                  </Tag>
                </div>
              </Space>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>Parameters:</Text>
                <div style={{ marginTop: 8 }}>
                  {Object.entries(strategyOptimization.parameters).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <Text code>{key}: {String(value)}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
          
          <Divider />
          
          <div>
            <Text strong>Reasoning:</Text>
            <ul style={{ marginTop: 8 }}>
              {strategyOptimization.reasoning.map((reason, index) => (
                <li key={index}>
                  <Text>{reason}</Text>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Support/Resistance Levels */}
        <Card title="📈 Support & Resistance Levels">
          <Table
            dataSource={marketCondition.supportResistance}
            columns={supportResistanceColumns}
            rowKey="price"
            size="small"
            pagination={{ pageSize: 5 }}
          />
        </Card>

        {/* Volume Profile */}
        <Card title="📊 Volume Profile">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Point of Control"
                value={marketCondition.volumeProfile.pointOfControl}
                precision={4}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Value Area High"
                value={marketCondition.volumeProfile.valueAreaHigh}
                precision={4}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Value Area Low"
                value={marketCondition.volumeProfile.valueAreaLow}
                precision={4}
              />
            </Col>
          </Row>
        </Card>

        {/* Market Alerts */}
        {alerts.length > 0 && (
          <Card title={
            <Space>
              <AlertOutlined />
              Market Alerts
              <Badge count={alerts.length} />
            </Space>
          }>
            <Table
              dataSource={alerts}
              columns={alertColumns}
              rowKey="timestamp"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        )}
      </Space>
    </div>
  );
}
