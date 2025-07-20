'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Badge,
  Alert,
  Statistic,
  Divider,
  Tabs,
  List,
  Empty
} from 'antd';
import {
  LineChartOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  ExpandOutlined,
  ShrinkOutlined
} from '@ant-design/icons';
import { TrailingStopPosition, TrailingStopAlert, TrailingStopPerformance } from '../types/trailingStop';
import { formatSmartPrice, isMicroCapToken } from '../lib/priceFormatter';

const { Text, Title } = Typography;

interface EnhancedTrailingStopPanelProps {
  positions: TrailingStopPosition[];
  alerts: TrailingStopAlert[];
  performance: TrailingStopPerformance;
  onPositionUpdate?: (position: TrailingStopPosition) => void;
  onPositionRemove?: (positionId: string) => void;
  onClearAlerts?: () => void;
}

export default function EnhancedTrailingStopPanel({
  positions,
  alerts,
  performance,
  onPositionUpdate,
  onPositionRemove,
  onClearAlerts
}: EnhancedTrailingStopPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'positions' | 'alerts' | 'performance'>('positions');
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  const formatCurrency = (value: number, decimals = 2) => {
    // Sử dụng smart formatting cho micro-cap tokens
    if (isMicroCapToken(value)) {
      return formatSmartPrice(value, { includeSymbol: true });
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 2) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  const formatPriceBySymbol = (value: number, symbol: string) => {
    // Sử dụng smart formatting thay vì hardcode decimal places
    if (isMicroCapToken(value)) {
      return formatSmartPrice(value, { includeSymbol: true });
    }

    // Cho các token không phải micro-cap, sử dụng formatCurrency với precision phù hợp
    const baseCurrency = symbol.split('/')[0];
    const isHighValueToken = ['BTC', 'ETH', 'SOL'].includes(baseCurrency);
    const decimals = isHighValueToken ? 2 : 4;

    return formatCurrency(value, decimals);
  };

  const getStatusIcon = (status: TrailingStopPosition['status']) => {
    switch (status) {
      case 'active':
        return <PlayCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />;
      case 'triggered':
        return <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
      case 'cancelled':
        return <CloseOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />;
    }
  };

  const getAlertIcon = (severity: TrailingStopAlert['severity']) => {
    switch (severity) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />;
      case 'error':
        return <CloseOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
    }
  };

  const activePositions = positions.filter(p => p.status === 'active' || p.status === 'pending');
  const recentAlerts = (alerts || []).slice(0, 10);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header with Performance Summary */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <LineChartOutlined style={{ color: '#1890ff' }} />
              Trailing Stop Nâng Cao
            </Title>
          </Col>
          <Col>
            <Space size="large">
              <Space align="center">
                <Badge status="processing" />
                <Text strong>{activePositions.length} Đang Hoạt Động</Text>
              </Space>
              <Space align="center">
                <DollarOutlined style={{ color: '#8c8c8c' }} />
                <Text strong>{formatCurrency(performance?.totalPnL || 0)}</Text>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* Performance Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Tổng Vị Thế"
                value={performance?.totalPositions || 0}
                valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Tỷ Lệ Thắng"
                value={performance?.winRate || 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Tổng P&L"
                value={formatPercent(performance?.totalPnLPercent || 0)}
                valueStyle={{
                  color: (performance?.totalPnLPercent || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                  fontSize: 24,
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Sụt Giảm Tối Đa"
                value={performance?.maxDrawdown || 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Tab Navigation and Content */}
      <Tabs
        activeKey={selectedTab}
        onChange={(key) => setSelectedTab(key as any)}
        items={[
          {
            key: 'positions',
            label: (
              <Space>
                Vị Thế
                <Badge count={activePositions.length} size="small" />
              </Space>
            ),
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {activePositions.length === 0 ? (
                    <Empty
                      image={<LineChartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                      description={
                        <Space direction="vertical" size="small">
                          <Text style={{ fontSize: 16, fontWeight: 500 }}>Không có vị thế trailing stop đang hoạt động</Text>
                          <Text type="secondary">Tạo vị thế mới để bắt đầu</Text>
                        </Space>
                      }
                    />
                  ) : (
                    activePositions.map(position => (
                      <Card
                        key={position.id}
                        size="small"
                        hoverable
                        style={{ border: '1px solid #d9d9d9' }}
                      >
                        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                          <Col>
                            <Space align="center">
                              {getStatusIcon(position.status)}
                              <div>
                                <Title level={5} style={{ margin: 0 }}>{position.symbol}</Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {position.strategy.toUpperCase()} • {position.trailingPercent}% trailing
                                </Text>
                              </div>
                            </Space>
                          </Col>
                          <Col style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: 20,
                              fontWeight: 'bold',
                              color: position.unrealizedPnLPercent >= 0 ? '#52c41a' : '#ff4d4f'
                            }}>
                              {formatPercent(position.unrealizedPnLPercent)}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatCurrency(position.unrealizedPnL)}
                            </Text>
                          </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ fontSize: 14 }}>
                          <Col xs={12} md={6}>
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontWeight: 500 }}>Giá Vào:</Text>
                              <Text strong>{formatPriceBySymbol(position.entryPrice, position.symbol)}</Text>
                            </Space>
                          </Col>
                          <Col xs={12} md={6}>
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontWeight: 500 }}>Giá Hiện Tại:</Text>
                              <Text strong>{formatPriceBySymbol(position.currentPrice, position.symbol)}</Text>
                            </Space>
                          </Col>
                          <Col xs={12} md={6}>
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontWeight: 500 }}>Stop Loss:</Text>
                              <Text strong style={{ color: '#ff4d4f' }}>{formatPriceBySymbol(position.stopLossPrice, position.symbol)}</Text>
                            </Space>
                          </Col>
                          <Col xs={12} md={6}>
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontWeight: 500 }}>Số Lượng:</Text>
                              <Text strong>{position.quantity}</Text>
                            </Space>
                          </Col>
                        </Row>

                        {position.status === 'pending' && position.activationPrice && (
                          <Alert
                            message={`Đang chờ kích hoạt tại ${formatPriceBySymbol(position.activationPrice, position.symbol)}`}
                            type="warning"
                            showIcon
                            style={{ marginTop: 16 }}
                          />
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space size="large">
                              <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                                Lợi Nhuận Tối Đa: {formatPercent(position.maxProfit)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                                Sụt Giảm Tối Đa: {formatPercent(position.maxDrawdown)}
                              </Text>
                            </Space>
                          </Col>
                          <Col>
                            <Space>
                              <Button
                                size="small"
                                onClick={() => setExpandedPosition(
                                  expandedPosition === position.id ? null : position.id
                                )}
                                icon={expandedPosition === position.id ? <ShrinkOutlined /> : <ExpandOutlined />}
                              >
                                {expandedPosition === position.id ? 'Thu Gọn' : 'Mở Rộng'}
                              </Button>
                              {onPositionRemove && (
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => onPositionRemove(position.id)}
                                  icon={<DeleteOutlined />}
                                >
                                  Hủy
                                </Button>
                              )}
                            </Space>
                          </Col>
                        </Row>

                        {expandedPosition === position.id && (
                          <>
                            <Divider style={{ margin: '16px 0' }} />
                            <Row gutter={[24, 16]} style={{ fontSize: 14 }}>
                              <Col xs={12} md={6}>
                                <Space direction="vertical" size={2}>
                                  <Text type="secondary" style={{ fontWeight: 500 }}>Ngày Tạo:</Text>
                                  <Text strong>{new Date(position.createdAt).toLocaleString('vi-VN')}</Text>
                                </Space>
                              </Col>
                              <Col xs={12} md={6}>
                                <Space direction="vertical" size={2}>
                                  <Text type="secondary" style={{ fontWeight: 500 }}>Chiến Lược:</Text>
                                  <Text strong style={{ textTransform: 'capitalize' }}>
                                    {position.strategy.replace('_', ' ')}
                                  </Text>
                                </Space>
                              </Col>
                              <Col xs={12} md={6}>
                                <Space direction="vertical" size={2}>
                                  <Text type="secondary" style={{ fontWeight: 500 }}>Thua Lỗ Tối Đa:</Text>
                                  <Text strong>{position.maxLossPercent}%</Text>
                                </Space>
                              </Col>
                              <Col xs={12} md={6}>
                                <Space direction="vertical" size={2}>
                                  <Text type="secondary" style={{ fontWeight: 500 }}>Hướng:</Text>
                                  <Text strong style={{ textTransform: 'capitalize' }}>
                                    {position.side === 'buy' ? 'Mua' : position.side === 'sell' ? 'Bán' : position.side}
                                  </Text>
                                </Space>
                              </Col>
                            </Row>
                          </>
                        )}
                      </Card>
                    ))
                  )}
                </Space>
              </Card>
            )
          },
          {
            key: 'alerts',
            label: (
              <Space>
                Cảnh Báo
                <Badge count={alerts?.length || 0} size="small" />
              </Space>
            ),
            children: (
              <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                  <Col>
                    <Title level={5} style={{ margin: 0 }}>Cảnh Báo Gần Đây</Title>
                  </Col>
                  <Col>
                    {onClearAlerts && (alerts?.length || 0) > 0 && (
                      <Button size="small" onClick={onClearAlerts}>
                        Xóa Tất Cả
                      </Button>
                    )}
                  </Col>
                </Row>

                <div style={{ maxHeight: 384, overflowY: 'auto' }}>
                  {recentAlerts.length === 0 ? (
                    <Empty
                      image={<InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                      description="Chưa có cảnh báo nào"
                    />
                  ) : (
                    <List
                      dataSource={recentAlerts}
                      renderItem={(alert) => (
                        <List.Item style={{ padding: '12px 0' }}>
                          <List.Item.Meta
                            avatar={getAlertIcon(alert.severity)}
                            title={<Text style={{ fontSize: 14 }}>{alert.message}</Text>}
                            description={
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {new Date(alert.timestamp).toLocaleString('vi-VN')} • {alert.position.symbol}
                              </Text>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </Card>
            )
          },
          {
            key: 'performance',
            label: 'Hiệu Suất',
            children: (
              <Card>
                <Title level={5} style={{ marginBottom: 24 }}>Phân Tích Hiệu Suất</Title>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Detailed Performance Metrics */}
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Title level={5} style={{ color: '#1890ff', margin: 0 }}>Thống Kê Giao Dịch</Title>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Row justify="space-between">
                            <Text type="secondary">Tổng Vị Thế:</Text>
                            <Text strong>{performance?.totalPositions || 0}</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Vị Thế Đang Hoạt Động:</Text>
                            <Text strong>{performance?.activePositions || 0}</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Vị Thế Đã Kích Hoạt:</Text>
                            <Text strong>{performance?.triggeredPositions || 0}</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Tỷ Lệ Thắng:</Text>
                            <Text strong style={{ color: '#52c41a' }}>{(performance?.winRate || 0).toFixed(1)}%</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Thời Gian Nắm Giữ TB:</Text>
                            <Text strong>{Math.round((performance?.avgHoldTime || 0) / 3600000)}h</Text>
                          </Row>
                        </Space>
                      </Space>
                    </Col>

                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Title level={5} style={{ color: '#1890ff', margin: 0 }}>Hiệu Suất Tài Chính</Title>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Row justify="space-between">
                            <Text type="secondary">Tổng P&L:</Text>
                            <Text strong style={{ color: (performance?.totalPnL || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}>
                              {formatCurrency(performance?.totalPnL || 0)}
                            </Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Tổng P&L %:</Text>
                            <Text strong style={{ color: (performance?.totalPnLPercent || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}>
                              {formatPercent(performance?.totalPnLPercent || 0)}
                            </Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Sụt Giảm Tối Đa:</Text>
                            <Text strong style={{ color: '#ff4d4f' }}>{(performance?.maxDrawdown || 0).toFixed(1)}%</Text>
                          </Row>
                          {performance?.sharpeRatio && (
                            <Row justify="space-between">
                              <Text type="secondary">Tỷ Lệ Sharpe:</Text>
                              <Text strong>{(performance?.sharpeRatio || 0).toFixed(2)}</Text>
                            </Row>
                          )}
                        </Space>
                      </Space>
                    </Col>
                  </Row>

                  {/* Performance Chart Placeholder */}
                  <Card style={{ textAlign: 'center', padding: 24 }}>
                    <LineChartOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                    <div>
                      <Text type="secondary">Biểu đồ hiệu suất sắp ra mắt</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Trực quan hóa P&L và sụt giảm lịch sử</Text>
                    </div>
                  </Card>
                </Space>
              </Card>
            )
          }
        ]}
      />
    </Space>
  );
}
