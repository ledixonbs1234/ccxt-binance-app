'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Badge, Button, Table, Alert, Space, Typography, Divider } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  retryAttempts: number;
  circuitBreakerTrips: number;
  lastError?: string;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    retryAttempts: number;
    circuitBreakerTrips: number;
    averageResponseTime: number;
  };
  services: Record<string, any>;
  recommendations: string[];
}

export default function ApiHealthDemo() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, ApiMetrics> | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/api-health?action=status'),
        fetch('/api/api-health?action=metrics')
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthData(healthData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setDetailedMetrics(metricsData.metrics);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runHealthTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/api-health?action=test&symbol=BTC/USDT');
      if (response.ok) {
        const testResult = await response.json();
        console.log('Health test result:', testResult);
        // Refresh data after test
        await fetchHealthData();
      }
    } catch (error) {
      console.error('Error running health test:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Auto refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'degraded': return <ExclamationCircleOutlined />;
      case 'critical': return <CloseCircleOutlined />;
      default: return null;
    }
  };

  const metricsColumns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Badge 
          color={rate >= 95 ? 'green' : rate >= 80 ? 'orange' : 'red'} 
          text={`${rate}%`} 
        />
      )
    },
    {
      title: 'Total Requests',
      dataIndex: 'totalRequests',
      key: 'totalRequests'
    },
    {
      title: 'Avg Response Time',
      dataIndex: 'averageResponseTime',
      key: 'averageResponseTime',
      render: (time: number) => `${time}ms`
    },
    {
      title: 'Circuit Breaker Trips',
      dataIndex: 'circuitBreakerTrips',
      key: 'circuitBreakerTrips',
      render: (trips: number) => (
        <Badge 
          count={trips} 
          color={trips > 0 ? 'red' : 'green'} 
          showZero 
        />
      )
    },
    {
      title: 'Last Error',
      dataIndex: 'lastError',
      key: 'lastError',
      render: (error: string) => error ? <Text type="danger" ellipsis>{error}</Text> : <Text type="success">None</Text>
    }
  ];

  const metricsData = detailedMetrics ? Object.entries(detailedMetrics).map(([service, metrics]) => ({
    key: service,
    service,
    successRate: metrics.totalRequests > 0 ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100) : 100,
    totalRequests: metrics.totalRequests,
    averageResponseTime: Math.round(metrics.averageResponseTime),
    circuitBreakerTrips: metrics.circuitBreakerTrips,
    lastError: metrics.lastError
  })) : [];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>API Health Dashboard</Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchHealthData} 
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              onClick={runHealthTest} 
              loading={loading}
            >
              Run Health Test
            </Button>
          </Space>
        </div>

        {lastUpdated && (
          <Text type="secondary">Last updated: {lastUpdated.toLocaleTimeString()}</Text>
        )}

        {healthData && (
          <>
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    {getStatusIcon(healthData.overall)}
                    <Title level={4} style={{ margin: '0 0 0 8px' }}>
                      Overall Status: 
                      <Badge 
                        color={getStatusColor(healthData.overall)} 
                        text={healthData.overall.toUpperCase()} 
                        style={{ marginLeft: '8px' }}
                      />
                    </Title>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={8} md={6}>
                      <Statistic 
                        title="Total Requests" 
                        value={healthData.summary.totalRequests} 
                      />
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Statistic 
                        title="Success Rate" 
                        value={healthData.summary.successRate} 
                        suffix="%" 
                        valueStyle={{ color: healthData.summary.successRate >= 95 ? '#3f8600' : '#cf1322' }}
                      />
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Statistic 
                        title="Avg Response Time" 
                        value={healthData.summary.averageResponseTime} 
                        suffix="ms" 
                      />
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Statistic 
                        title="Circuit Breaker Trips" 
                        value={healthData.summary.circuitBreakerTrips} 
                        valueStyle={{ color: healthData.summary.circuitBreakerTrips > 0 ? '#cf1322' : '#3f8600' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {healthData.recommendations && healthData.recommendations.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                <Col span={24}>
                  <Alert
                    message="Recommendations"
                    description={
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {healthData.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    }
                    type={healthData.overall === 'healthy' ? 'success' : healthData.overall === 'degraded' ? 'warning' : 'error'}
                    showIcon
                  />
                </Col>
              </Row>
            )}
          </>
        )}

        <Divider />

        <Title level={3}>Detailed Metrics</Title>
        <Card>
          <Table 
            columns={metricsColumns} 
            dataSource={metricsData} 
            pagination={false}
            loading={loading}
            size="middle"
          />
        </Card>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Text type="secondary">
            Enhanced API Error Handling System - Circuit Breaker Pattern with Intelligent Fallback
          </Text>
        </div>
      </div>
    </div>
  );
}
