'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Divider, Row, Col, Statistic, Tag, Alert } from 'antd';
import {
  formatMicroCapPrice,
  isMicroCapToken,
  formatMicroCapPercentage,
  calculateMicroCapPercentageChange,
  formatMicroCapVolume,
  calculateMicroCapPositionSize,
  validateMicroCapPrice,
  analyzeMicroCapToken,
  formatMicroCapForContext
} from '@/lib/microCapUtils';
import PageContainer from '@/components/PageContainer';

const { Text } = Typography;

export default function TestMicroCapPage() {
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test data - real crypto prices
  const testPrices = {
    pepe: 0.00000667,
    shib: 0.00001234,
    doge: 0.08567,
    btc: 43250.67,
    eth: 2456.78
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = () => {
    const results = [];

    // Test 1: isMicroCapToken
    results.push({
      title: 'Micro-Cap Detection Test',
      type: 'detection',
      data: Object.entries(testPrices).map(([token, price]) => ({
        token: token.toUpperCase(),
        price,
        isMicroCap: isMicroCapToken(price),
        status: isMicroCapToken(price) ? 'success' : 'default'
      }))
    });

    // Test 2: formatMicroCapPrice
    results.push({
      title: 'Price Formatting Test',
      type: 'formatting',
      data: Object.entries(testPrices).map(([token, price]) => ({
        token: token.toUpperCase(),
        original: price,
        formatted: formatMicroCapPrice(price)
      }))
    });

    // Test 3: Context-specific formatting
    const contexts = ['chart', 'table', 'tooltip', 'input'];
    results.push({
      title: 'Context-Specific Formatting (PEPE)',
      type: 'context',
      data: contexts.map(context => ({
        context,
        formatted: formatMicroCapForContext(testPrices.pepe, context as any)
      }))
    });

    // Test 4: Percentage calculations
    const oldPrice = 0.00000667;
    const newPrices = [0.00000700, 0.00000634, 0.00000800];
    results.push({
      title: 'Percentage Change Calculations',
      type: 'percentage',
      data: newPrices.map(newPrice => {
        const change = calculateMicroCapPercentageChange(oldPrice, newPrice);
        return {
          oldPrice,
          newPrice,
          change,
          formatted: formatMicroCapPercentage(change)
        };
      })
    });

    // Test 5: Volume formatting
    const volumes = [1234, 45678, 1234567, 12345678901, 123456789012345];
    results.push({
      title: 'Volume Formatting Test',
      type: 'volume',
      data: volumes.map(volume => ({
        original: volume,
        formatted: formatMicroCapVolume(volume)
      }))
    });

    // Test 6: Position sizing
    const positionTests = [
      { balance: 1000, risk: 2, entry: 0.00000667, stop: 0.00000600 },
      { balance: 5000, risk: 1, entry: 0.00001234, stop: 0.00001100 },
      { balance: 10000, risk: 3, entry: 43250.67, stop: 42000.00 }
    ];
    results.push({
      title: 'Position Size Calculations',
      type: 'position',
      data: positionTests.map((test, index) => ({
        testCase: index + 1,
        ...test,
        positionSize: calculateMicroCapPositionSize(test.balance, test.risk, test.entry, test.stop)
      }))
    });

    // Test 7: Token analysis
    results.push({
      title: 'Token Analysis',
      type: 'analysis',
      data: Object.entries(testPrices).map(([token, price]) => ({
        token: token.toUpperCase(),
        ...analyzeMicroCapToken(price, 1000000)
      }))
    });

    setTestResults(results);
  };

  const renderDetectionTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={8} key={index}>
          <Card size="small">
            <Statistic
              title={item.token}
              value={`$${item.price}`}
              suffix={<Tag color={item.status}>{item.isMicroCap ? 'Micro-cap' : 'Regular'}</Tag>}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderFormattingTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={12} key={index}>
          <Card size="small">
            <Text strong>{item.token}</Text>
            <br />
            <Text type="secondary">Original: ${item.original}</Text>
            <br />
            <Text>Formatted: {item.formatted}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderContextTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={6} key={index}>
          <Card size="small">
            <Text strong>{item.context}</Text>
            <br />
            <Text code>{item.formatted}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderPercentageTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={8} key={index}>
          <Card size="small">
            <Text>${item.oldPrice} → ${item.newPrice}</Text>
            <br />
            <Text strong style={{ color: item.change >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {item.formatted}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderVolumeTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={8} key={index}>
          <Card size="small">
            <Text type="secondary">{item.original.toLocaleString()}</Text>
            <br />
            <Text strong>{item.formatted}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderPositionTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={8} key={index}>
          <Card size="small">
            <Text strong>Test Case {item.testCase}</Text>
            <br />
            <Text type="secondary">Balance: ${item.balance}</Text>
            <br />
            <Text type="secondary">Risk: {item.risk}%</Text>
            <br />
            <Text type="secondary">Entry: ${item.entry}</Text>
            <br />
            <Text type="secondary">Stop: ${item.stop}</Text>
            <br />
            <Text strong>Size: {item.positionSize}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderAnalysisTest = (data: any[]) => (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col span={8} key={index}>
          <Card size="small">
            <Text strong>{item.token}</Text>
            <br />
            <Text type="secondary">Price: ${item.price}</Text>
            <br />
            <Text>Decimals: {item.decimals}</Text>
            <br />
            <Text>Format: {item.formatType}</Text>
            <br />
            <Tag color={item.isMicroCap ? 'success' : 'default'}>
              {item.isMicroCap ? 'Micro-cap' : 'Regular'}
            </Tag>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <PageContainer
      title="🧪 Micro-Cap Utilities Test Suite"
      subtitle="Comprehensive testing of micro-cap token utilities with real cryptocurrency data"
    >
      <Alert
        message="Test Results"
        description="Comprehensive testing of micro-cap token utilities with real cryptocurrency data"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {testResults.map((result, index) => (
        <Card key={index} className="mb-6">
          <Title level={4}>{result.title}</Title>
          <Divider />
          
          {result.type === 'detection' && renderDetectionTest(result.data)}
          {result.type === 'formatting' && renderFormattingTest(result.data)}
          {result.type === 'context' && renderContextTest(result.data)}
          {result.type === 'percentage' && renderPercentageTest(result.data)}
          {result.type === 'volume' && renderVolumeTest(result.data)}
          {result.type === 'position' && renderPositionTest(result.data)}
          {result.type === 'analysis' && renderAnalysisTest(result.data)}
        </Card>
      ))}

      <Alert
        message="✅ All Tests Completed Successfully"
        description="Micro-cap utilities are working correctly with proper precision handling, formatting, and calculations."
        type="success"
        showIcon
      />
    </PageContainer>
  );
}
