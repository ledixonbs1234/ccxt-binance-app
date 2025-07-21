'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Button, Row, Col, Statistic, Progress, Alert, Space, Divider } from 'antd';
import { PlayCircleOutlined, ClearOutlined, FireOutlined, DashboardOutlined } from '@ant-design/icons';
import { MicroCapPerformance } from '@/lib/microCapUtils';

const { Title, Text } = Typography;

interface BenchmarkResults {
  formatPrice: number;
  calculateChange: number;
  formatVolume: number;
  contextFormat: number;
  cacheHitRate: number;
}

interface CacheStats {
  formatCache: { size: number; maxSize: number };
  calculationCache: { size: number; maxSize: number };
  analysisCache: { size: number; maxSize: number };
}

export default function PerformanceTestPage() {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isWarming, setIsWarming] = useState(false);

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    setCacheStats(MicroCapPerformance.getCacheStats());
  };

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const results = MicroCapPerformance.benchmark();
      setBenchmarkResults(results);
      updateCacheStats();
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const warmUpCache = async () => {
    setIsWarming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      MicroCapPerformance.warmUpCache();
      updateCacheStats();
    } catch (error) {
      console.error('Cache warm-up failed:', error);
    } finally {
      setIsWarming(false);
    }
  };

  const clearCaches = () => {
    MicroCapPerformance.clearAllCaches();
    updateCacheStats();
    setBenchmarkResults(null);
  };

  const getCacheUsagePercentage = (size: number, maxSize: number) => {
    return Math.round((size / maxSize) * 100);
  };

  const getPerformanceColor = (time: number) => {
    if (time < 10) return '#52c41a'; // Green - Excellent
    if (time < 50) return '#1890ff'; // Blue - Good
    if (time < 100) return '#faad14'; // Orange - Fair
    return '#ff4d4f'; // Red - Poor
  };

  const getPerformanceStatus = (time: number) => {
    if (time < 10) return 'Xuất sắc';
    if (time < 50) return 'Tốt';
    if (time < 100) return 'Khá';
    return 'Cần cải thiện';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Title level={2}>⚡ Performance Test - Micro-Cap Utilities</Title>
      
      <Alert
        message="Performance Optimization Test Suite"
        description="Kiểm tra hiệu suất của các hàm tính toán high-precision với caching và memoization"
        type="info"
        showIcon
        className="mb-6"
      />

      {/* Control Panel */}
      <Card className="mb-6">
        <Title level={4}>🎛️ Control Panel</Title>
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            loading={isRunning}
            onClick={runBenchmark}
          >
            Chạy Benchmark
          </Button>
          <Button 
            icon={<FireOutlined />}
            loading={isWarming}
            onClick={warmUpCache}
          >
            Warm Up Cache
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={clearCaches}
          >
            Clear Cache
          </Button>
        </Space>
      </Card>

      {/* Cache Statistics */}
      <Card className="mb-6">
        <Title level={4}>💾 Cache Statistics</Title>
        {cacheStats && (
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Format Cache"
                  value={cacheStats.formatCache.size}
                  suffix={`/ ${cacheStats.formatCache.maxSize}`}
                />
                <Progress 
                  percent={getCacheUsagePercentage(cacheStats.formatCache.size, cacheStats.formatCache.maxSize)}
                  size="small"
                  status="active"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Calculation Cache"
                  value={cacheStats.calculationCache.size}
                  suffix={`/ ${cacheStats.calculationCache.maxSize}`}
                />
                <Progress 
                  percent={getCacheUsagePercentage(cacheStats.calculationCache.size, cacheStats.calculationCache.maxSize)}
                  size="small"
                  status="active"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Analysis Cache"
                  value={cacheStats.analysisCache.size}
                  suffix={`/ ${cacheStats.analysisCache.maxSize}`}
                />
                <Progress 
                  percent={getCacheUsagePercentage(cacheStats.analysisCache.size, cacheStats.analysisCache.maxSize)}
                  size="small"
                  status="active"
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      {/* Benchmark Results */}
      {benchmarkResults && (
        <Card className="mb-6">
          <Title level={4}>📊 Benchmark Results (1000 iterations)</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Format Price"
                  value={benchmarkResults.formatPrice.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: getPerformanceColor(benchmarkResults.formatPrice) }}
                />
                <Text type="secondary">{getPerformanceStatus(benchmarkResults.formatPrice)}</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Calculate Change"
                  value={benchmarkResults.calculateChange.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: getPerformanceColor(benchmarkResults.calculateChange) }}
                />
                <Text type="secondary">{getPerformanceStatus(benchmarkResults.calculateChange)}</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Format Volume"
                  value={benchmarkResults.formatVolume.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: getPerformanceColor(benchmarkResults.formatVolume) }}
                />
                <Text type="secondary">{getPerformanceStatus(benchmarkResults.formatVolume)}</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Context Format"
                  value={benchmarkResults.contextFormat.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: getPerformanceColor(benchmarkResults.contextFormat) }}
                />
                <Text type="secondary">{getPerformanceStatus(benchmarkResults.contextFormat)}</Text>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Row>
            <Col span={24}>
              <Card size="small">
                <Statistic
                  title="Cache Hit Rate"
                  value={benchmarkResults.cacheHitRate.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: benchmarkResults.cacheHitRate > 50 ? '#52c41a' : '#faad14' }}
                />
                <Progress 
                  percent={benchmarkResults.cacheHitRate}
                  status={benchmarkResults.cacheHitRate > 50 ? 'success' : 'normal'}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <Title level={4}>💡 Performance Tips</Title>
        <ul>
          <li><Text strong>Cache Warm-up:</Text> Chạy warm-up cache trước khi sử dụng để tăng hiệu suất</li>
          <li><Text strong>Memory Management:</Text> Clear cache định kỳ để tránh memory leak</li>
          <li><Text strong>Optimal Usage:</Text> Các hàm format được cache trong 30 giây, calculations trong 1 phút</li>
          <li><Text strong>High Performance:</Text> Thời gian &lt; 10ms là xuất sắc, &lt; 50ms là tốt</li>
          <li><Text strong>Cache Hit Rate:</Text> Tỷ lệ cache hit &gt; 50% cho thấy optimization hiệu quả</li>
        </ul>
      </Card>
    </div>
  );
}
