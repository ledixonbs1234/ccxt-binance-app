'use client';

import React from 'react';
import {
  Table,
  Tag,
  Space,
  Typography,
  Tooltip,
  Progress,
  Button
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { BacktestResult } from '@/types/backtesting';

const { Text } = Typography;

interface StrategyComparisonTableProps {
  results: BacktestResult[];
  selectedResults: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

export default function StrategyComparisonTable({
  results,
  selectedResults,
  onSelectionChange
}: StrategyComparisonTableProps) {
  const columns = [
    {
      title: 'Chiến lược',
      dataIndex: 'id',
      key: 'strategy',
      width: 150,
      render: (id: string, record: BacktestResult) => {
        const strategy = record.config.strategies.find(s => s.id === id);
        const isTop = getTopPerformers(results, 'sharpeRatio').includes(id);
        
        return (
          <Space direction="vertical" size="small">
            <Space>
              <Text strong>{strategy?.nameVi || id}</Text>
              {isTop && <TrophyOutlined style={{ color: '#faad14' }} />}
            </Space>
            <Tag color={getStrategyTypeColor(strategy?.type || '')}>
              {getStrategyTypeLabel(strategy?.type || '')}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: (
        <Space>
          Tổng lợi nhuận
          <Tooltip title="Tổng phần trăm lợi nhuận từ vốn ban đầu">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: ['performance', 'totalReturn'],
      key: 'totalReturn',
      width: 120,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.totalReturn - b.performance.totalReturn,
      render: (value: number) => (
        <Space>
          {value >= 0 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {value.toFixed(2)}%
          </Text>
        </Space>
      )
    },
    {
      title: (
        <Space>
          Sharpe Ratio
          <Tooltip title="Tỷ lệ lợi nhuận điều chỉnh theo rủi ro">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: ['performance', 'sharpeRatio'],
      key: 'sharpeRatio',
      width: 100,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.sharpeRatio - b.performance.sharpeRatio,
      render: (value: number) => (
        <Text style={{ color: getSharpeColor(value) }}>
          {value.toFixed(2)}
        </Text>
      )
    },
    {
      title: (
        <Space>
          Tỷ lệ thắng
          <Tooltip title="Phần trăm giao dịch có lãi">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: ['performance', 'winRate'],
      key: 'winRate',
      width: 120,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.winRate - b.performance.winRate,
      render: (value: number) => (
        <Space direction="vertical" size="small">
          <Progress
            percent={value}
            size="small"
            strokeColor={getWinRateColor(value)}
            showInfo={false}
          />
          <Text>{value.toFixed(1)}%</Text>
        </Space>
      )
    },
    {
      title: (
        <Space>
          Max Drawdown
          <Tooltip title="Sụt giảm tối đa từ đỉnh">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: ['performance', 'maxDrawdown'],
      key: 'maxDrawdown',
      width: 120,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.maxDrawdown - b.performance.maxDrawdown,
      render: (value: number) => (
        <Text style={{ color: getDrawdownColor(value) }}>
          -{value.toFixed(2)}%
        </Text>
      )
    },
    {
      title: (
        <Space>
          Profit Factor
          <Tooltip title="Tỷ lệ tổng lãi / tổng lỗ">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: ['performance', 'profitFactor'],
      key: 'profitFactor',
      width: 100,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.profitFactor - b.performance.profitFactor,
      render: (value: number) => (
        <Text style={{ color: getProfitFactorColor(value) }}>
          {value.toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Số giao dịch',
      dataIndex: ['performance', 'totalTrades'],
      key: 'totalTrades',
      width: 100,
      sorter: (a: BacktestResult, b: BacktestResult) => 
        a.performance.totalTrades - b.performance.totalTrades,
      render: (value: number) => (
        <Text>{value}</Text>
      )
    },
    {
      title: 'Thời gian',
      key: 'duration',
      width: 100,
      render: (record: BacktestResult) => {
        const duration = record.endTime - record.startTime;
        const seconds = Math.floor(duration / 1000);
        return <Text>{seconds}s</Text>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'success', text: 'Hoàn thành' },
          running: { color: 'processing', text: 'Đang chạy' },
          failed: { color: 'error', text: 'Lỗi' },
          cancelled: { color: 'default', text: 'Đã hủy' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
        
        return (
          <Tag color={config.color}>
            {config.text}
          </Tag>
        );
      }
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedResults,
    onChange: onSelectionChange,
    getCheckboxProps: (record: BacktestResult) => ({
      disabled: record.status !== 'completed'
    })
  };

  return (
    <Table
      columns={columns}
      dataSource={results}
      rowKey="id"
      rowSelection={rowSelection}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} của ${total} kết quả`
      }}
      scroll={{ x: 1000 }}
      size="small"
    />
  );
}

function getTopPerformers(results: BacktestResult[], metric: keyof BacktestResult['performance']): string[] {
  const sorted = [...results].sort((a, b) => {
    const aValue = a.performance[metric] as number;
    const bValue = b.performance[metric] as number;
    return bValue - aValue;
  });
  
  return sorted.slice(0, Math.ceil(results.length * 0.2)).map(r => r.id);
}

function getStrategyTypeColor(type: string): string {
  const colors: Record<string, string> = {
    trend_following: 'blue',
    mean_reversion: 'green',
    momentum: 'orange',
    breakout: 'red',
    ai_ml: 'purple'
  };
  return colors[type] || 'default';
}

function getStrategyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trend_following: 'Theo xu hướng',
    mean_reversion: 'Hồi quy',
    momentum: 'Động lượng',
    breakout: 'Đột phá',
    ai_ml: 'AI/ML'
  };
  return labels[type] || type;
}

function getSharpeColor(value: number): string {
  if (value >= 2) return '#52c41a';
  if (value >= 1) return '#faad14';
  if (value >= 0) return '#1890ff';
  return '#ff4d4f';
}

function getWinRateColor(value: number): string {
  if (value >= 70) return '#52c41a';
  if (value >= 50) return '#faad14';
  return '#ff4d4f';
}

function getDrawdownColor(value: number): string {
  if (value <= 5) return '#52c41a';
  if (value <= 15) return '#faad14';
  return '#ff4d4f';
}

function getProfitFactorColor(value: number): string {
  if (value >= 2) return '#52c41a';
  if (value >= 1.5) return '#faad14';
  if (value >= 1) return '#1890ff';
  return '#ff4d4f';
}
