'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Progress, message } from 'antd';
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TestAIBacktestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const handleTestBacktest = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Mock results
      const mockResults = [
        {
          id: 'sma_crossover',
          name: 'SMA Crossover',
          totalReturn: 15.5,
          sharpeRatio: 1.2,
          winRate: 65.5,
          maxDrawdown: 8.2
        },
        {
          id: 'rsi_oversold',
          name: 'RSI Oversold/Overbought',
          totalReturn: 12.3,
          sharpeRatio: 0.9,
          winRate: 58.3,
          maxDrawdown: 12.1
        },
        {
          id: 'bollinger_bands',
          name: 'Bollinger Bands',
          totalReturn: 18.7,
          sharpeRatio: 1.4,
          winRate: 62.1,
          maxDrawdown: 9.8
        }
      ];

      setResults(mockResults);
      message.success('Backtest hoàn thành thành công!');
    } catch (error) {
      message.error('Lỗi khi chạy backtest: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ textAlign: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2}>🤖 AI Trading Backtesting Test</Title>
              <Text type="secondary">
                Trang test đơn giản cho hệ thống AI Backtesting
              </Text>
            </div>

            <Alert
              message="Test AI Backtesting System"
              description="Đây là trang test để kiểm tra chức năng cơ bản của hệ thống AI Backtesting. Hệ thống sẽ mô phỏng việc chạy backtest với dữ liệu giả."
              type="info"
              showIcon
            />

            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleTestBacktest}
                loading={isRunning}
                style={{ minWidth: '200px' }}
              >
                {isRunning ? 'Đang chạy Test...' : 'Chạy Test Backtest'}
              </Button>
            </div>

            {isRunning && (
              <Card title="Tiến độ Test">
                <Progress
                  percent={progress}
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary">Đang mô phỏng backtest...</Text>
              </Card>
            )}

            {results.length > 0 && (
              <Card title="Kết quả Test">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {results.map((result, index) => (
                    <Card key={result.id} size="small" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{result.name}</Text>
                          <br />
                          <Text type="secondary">Strategy ID: {result.id}</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Space direction="vertical" size="small">
                            <Text>
                              <span style={{ color: result.totalReturn >= 0 ? '#52c41a' : '#ff4d4f' }}>
                                Lợi nhuận: {result.totalReturn}%
                              </span>
                            </Text>
                            <Text>Sharpe: {result.sharpeRatio}</Text>
                            <Text>Win Rate: {result.winRate}%</Text>
                            <Text style={{ color: '#ff4d4f' }}>
                              Max DD: {result.maxDrawdown}%
                            </Text>
                          </Space>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}

            <Card title="Thông tin kỹ thuật">
              <Space direction="vertical">
                <Text><strong>Framework:</strong> Next.js 15.2.4</Text>
                <Text><strong>UI Library:</strong> Ant Design</Text>
                <Text><strong>Language:</strong> TypeScript</Text>
                <Text><strong>Features:</strong> AI Backtesting, Historical Data, Performance Analytics</Text>
                <Text><strong>Status:</strong> ✅ Test page working</Text>
              </Space>
            </Card>

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button href="/">Về trang chính</Button>
                <Button href="/ai-backtesting" type="primary">
                  Đến trang AI Backtesting chính
                </Button>
              </Space>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}
