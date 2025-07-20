'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Alert, 
  Tag, 
  Progress,
  Space,
  Typography,
  Divider,
  notification
} from 'antd';
import { 
  DatabaseOutlined, 
  ThunderboltOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ClearOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DatabaseStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  hitRate: number;
  memoryUsage: number;
}

interface PerformanceStatus {
  status: string;
  performance: {
    responseTime: string;
    connectionStatus: string;
    cacheHitRate: string;
  };
  recommendations: string[];
}

export default function DatabasePerformanceDashboard() {
  const [loading, setLoading] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<PerformanceStatus | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch all performance data in parallel
      const [statusRes, statsRes, cacheRes] = await Promise.all([
        fetch('/api/database-performance?action=status'),
        fetch('/api/database-performance?action=stats'),
        fetch('/api/database-performance?action=cache-stats')
      ]);

      const [statusData, statsData, cacheData] = await Promise.all([
        statusRes.json(),
        statsRes.json(),
        cacheRes.json()
      ]);

      if (statusData.success) setPerformanceStatus(statusData);
      if (statsData.success) setDatabaseStats(statsData.stats || []);
      if (cacheData.success) setCacheStats(cacheData.memoryCache);
      
      setLastUpdated(new Date().toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Error fetching performance data:', error);
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: 'Không thể tải dữ liệu hiệu suất database'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupCache = async () => {
    try {
      const response = await fetch('/api/database-performance?action=cleanup');
      const data = await response.json();
      
      if (data.success) {
        notification.success({
          message: 'Dọn dẹp thành công',
          description: 'Cache đã được dọn dẹp thành công'
        });
        fetchPerformanceData(); // Refresh data
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi dọn dẹp',
        description: 'Không thể dọn dẹp cache'
      });
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'slow': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'slow': return <WarningOutlined />;
      case 'error': return <WarningOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const databaseColumns = [
    {
      title: 'Tên Bảng',
      dataIndex: 'tableName',
      key: 'tableName',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: 'Số Dòng',
      dataIndex: 'rowCount',
      key: 'rowCount',
      render: (count: number) => count.toLocaleString('vi-VN')
    },
    {
      title: 'Kích Thước Bảng',
      dataIndex: 'tableSize',
      key: 'tableSize'
    },
    {
      title: 'Kích Thước Index',
      dataIndex: 'indexSize',
      key: 'indexSize'
    },
    {
      title: 'Tổng Kích Thước',
      dataIndex: 'totalSize',
      key: 'totalSize',
      render: (size: string) => <Text strong>{size}</Text>
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Title level={2}>
            <DatabaseOutlined /> Database Performance Dashboard
          </Title>
          <Text type="secondary">
            Giám sát hiệu suất và tối ưu hóa database • Cập nhật lần cuối: {lastUpdated}
          </Text>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Control Buttons */}
          <Card>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchPerformanceData}
                loading={loading}
              >
                Làm mới dữ liệu
              </Button>
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleCleanupCache}
              >
                Dọn dẹp Cache
              </Button>
            </Space>
          </Card>

          {/* Performance Status */}
          {performanceStatus && (
            <Card title="Trạng thái hiệu suất tổng quan">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Trạng thái Database"
                      value={performanceStatus.status.toUpperCase()}
                      prefix={getStatusIcon(performanceStatus.status)}
                      valueStyle={{ 
                        color: performanceStatus.status === 'healthy' ? '#3f8600' : 
                               performanceStatus.status === 'slow' ? '#cf1322' : '#d46b08' 
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Thời gian phản hồi"
                      value={performanceStatus.performance.responseTime}
                      prefix={<ThunderboltOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Cache Hit Rate"
                      value={performanceStatus.performance.cacheHitRate}
                      prefix={<DatabaseOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {performanceStatus.recommendations.length > 0 && (
                <>
                  <Divider />
                  <Alert
                    message="Khuyến nghị tối ưu hóa"
                    description={
                      <ul>
                        {performanceStatus.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    }
                    type="info"
                    showIcon
                  />
                </>
              )}
            </Card>
          )}

          {/* Cache Statistics */}
          {cacheStats && (
            <Card title="Thống kê Cache">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="Tổng số entries"
                    value={cacheStats.totalEntries}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="Entries hợp lệ"
                    value={cacheStats.validEntries}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="Entries hết hạn"
                    value={cacheStats.expiredEntries}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="Bộ nhớ sử dụng"
                    value={`${(cacheStats.memoryUsage / 1024).toFixed(1)} KB`}
                  />
                </Col>
              </Row>
              
              <Divider />
              <div>
                <Text strong>Cache Hit Rate: </Text>
                <Progress 
                  percent={Math.round(cacheStats.hitRate * 100)} 
                  status={cacheStats.hitRate > 0.7 ? 'success' : cacheStats.hitRate > 0.4 ? 'normal' : 'exception'}
                />
              </div>
            </Card>
          )}

          {/* Database Statistics */}
          <Card title="Thống kê Database Tables">
            <Table
              columns={databaseColumns}
              dataSource={databaseStats}
              rowKey="tableName"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Space>
      </div>
    </div>
  );
}
