'use client';

import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import { BacktestResult } from '@/types/backtesting';

const { Title, Text } = Typography;

interface BacktestResultsChartProps {
  results: BacktestResult[];
}

export default function BacktestResultsChart({ results }: BacktestResultsChartProps) {
  const [chartType, setChartType] = React.useState<'equity' | 'drawdown' | 'returns' | 'comparison'>('equity');

  const chartData = useMemo(() => {
    if (results.length === 0) return [];

    switch (chartType) {
      case 'equity':
        return generateEquityChartData(results);
      case 'drawdown':
        return generateDrawdownChartData(results);
      case 'returns':
        return generateReturnsChartData(results);
      case 'comparison':
        return generateComparisonChartData(results);
      default:
        return [];
    }
  }, [results, chartType]);

  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa541c', '#a0d911', '#2f54eb'
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'equity':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name
                ]}
              />
              <Legend />
              {results.map((result, index) => (
                <Line
                  key={result.id}
                  type="monotone"
                  dataKey={result.id}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={result.id}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'drawdown':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                label={{ value: 'Drawdown (%)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}%`,
                  name
                ]}
              />
              <Legend />
              {results.map((result, index) => (
                <Area
                  key={result.id}
                  type="monotone"
                  dataKey={result.id}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                  name={result.id}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'returns':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="strategy" />
              <YAxis 
                label={{ value: 'Returns (%)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Total Return']}
              />
              <Bar 
                dataKey="totalReturn" 
                fill="#1890ff"
                name="Total Return"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'comparison':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="risk"
                label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -5 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <YAxis 
                dataKey="return"
                label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'return' ? `${value.toFixed(2)}%` : `${value.toFixed(2)}%`,
                  name === 'return' ? 'Return' : 'Risk'
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.strategy;
                  }
                  return label;
                }}
              />
              <Scatter 
                dataKey="return" 
                fill="#1890ff"
                name="Risk vs Return"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              Biểu đồ phân tích hiệu suất
            </Title>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 200 }}
              options={[
                { value: 'equity', label: '📈 Đường cong vốn' },
                { value: 'drawdown', label: '📉 Drawdown' },
                { value: 'returns', label: '📊 So sánh lợi nhuận' },
                { value: 'comparison', label: '🎯 Risk vs Return' }
              ]}
            />
          </div>
        </Col>

        <Col span={24}>
          {chartData.length > 0 ? (
            renderChart()
          ) : (
            <div style={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '6px'
            }}>
              <Text type="secondary">Không có dữ liệu để hiển thị biểu đồ</Text>
            </div>
          )}
        </Col>

        <Col span={24}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              <strong>Ghi chú:</strong>
            </Text>
            {chartType === 'equity' && (
              <Text type="secondary">
                • Đường cong vốn hiển thị sự thay đổi giá trị tài khoản theo thời gian
              </Text>
            )}
            {chartType === 'drawdown' && (
              <Text type="secondary">
                • Drawdown thể hiện mức sụt giảm từ đỉnh cao nhất của tài khoản
              </Text>
            )}
            {chartType === 'returns' && (
              <Text type="secondary">
                • So sánh tổng lợi nhuận của các chiến lược
              </Text>
            )}
            {chartType === 'comparison' && (
              <Text type="secondary">
                • Biểu đồ phân tán Risk vs Return giúp đánh giá hiệu quả điều chỉnh rủi ro
              </Text>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

function generateEquityChartData(results: BacktestResult[]) {
  if (results.length === 0) return [];

  // Get all unique timestamps
  const allTimestamps = new Set<number>();
  results.forEach(result => {
    result.equity.forEach(point => allTimestamps.add(point.timestamp));
  });

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  return sortedTimestamps.map(timestamp => {
    const dataPoint: any = { timestamp };
    
    results.forEach(result => {
      const equityPoint = result.equity.find(p => p.timestamp === timestamp);
      if (equityPoint) {
        dataPoint[result.id] = equityPoint.equity;
      }
    });

    return dataPoint;
  });
}

function generateDrawdownChartData(results: BacktestResult[]) {
  if (results.length === 0) return [];

  const allTimestamps = new Set<number>();
  results.forEach(result => {
    result.drawdown.forEach(point => allTimestamps.add(point.timestamp));
  });

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  return sortedTimestamps.map(timestamp => {
    const dataPoint: any = { timestamp };
    
    results.forEach(result => {
      const drawdownPoint = result.drawdown.find(p => p.timestamp === timestamp);
      if (drawdownPoint) {
        dataPoint[result.id] = -drawdownPoint.drawdown; // Negative for display
      }
    });

    return dataPoint;
  });
}

function generateReturnsChartData(results: BacktestResult[]) {
  return results.map(result => ({
    strategy: result.id,
    totalReturn: result.performance.totalReturn,
    sharpeRatio: result.performance.sharpeRatio,
    maxDrawdown: result.performance.maxDrawdown
  }));
}

function generateComparisonChartData(results: BacktestResult[]) {
  return results.map(result => ({
    strategy: result.id,
    return: result.performance.totalReturn,
    risk: result.performance.volatility,
    sharpe: result.performance.sharpeRatio
  }));
}
