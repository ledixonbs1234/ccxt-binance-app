import React from 'react';
import { Card, Skeleton, Row, Col, Space } from 'antd';

export const MarketSkeleton: React.FC = () => {
  return (
    <Card 
      title={<Skeleton.Input style={{ width: 150 }} active />}
      className="mb-6"
    >
      <Row gutter={[16, 16]}>
        {/* Market Selector Skeleton */}
        <Col span={24}>
          <Space size="middle" wrap>
            {[1, 2, 3].map((i) => (
              <Skeleton.Button 
                key={i}
                active 
                size="large" 
                style={{ width: 120, height: 40 }}
              />
            ))}
          </Space>
        </Col>
        
        {/* Price Cards Skeleton */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            {[1, 2, 3].map((i) => (
              <Col xs={24} sm={8} key={i}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Skeleton.Input style={{ width: 80 }} active />
                    <Skeleton.Input style={{ width: 120 }} active />
                    <Skeleton.Input style={{ width: 100 }} active />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <Card 
      title={<Skeleton.Input style={{ width: 200 }} active />}
      className="mb-6"
    >
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton.Node active style={{ width: '100%', height: '100%' }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite'
          }} />
        </Skeleton.Node>
      </div>
    </Card>
  );
};

export const BalanceSkeleton: React.FC = () => {
  return (
    <Card 
      title={<Skeleton.Input style={{ width: 120 }} active />}
      className="mb-6"
    >
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={12} sm={6} key={i}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Skeleton.Input style={{ width: 80 }} active />
              <Skeleton.Input style={{ width: 100 }} active />
            </Space>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export const OrderHistorySkeleton: React.FC = () => {
  return (
    <Card 
      title={<Skeleton.Input style={{ width: 150 }} active />}
      className="mb-6"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Skeleton.Avatar size="small" active />
              <Skeleton.Input style={{ width: 80 }} active />
              <Skeleton.Input style={{ width: 60 }} active />
            </Space>
            <Space>
              <Skeleton.Input style={{ width: 100 }} active />
              <Skeleton.Input style={{ width: 80 }} active />
            </Space>
          </div>
        ))}
      </Space>
    </Card>
  );
};

export const OrderFormSkeleton: React.FC = () => {
  return (
    <Card 
      title={<Skeleton.Input style={{ width: 120 }} active />}
      className="mb-6"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Order Type Buttons */}
        <Space size="middle">
          <Skeleton.Button active size="large" style={{ width: 80 }} />
          <Skeleton.Button active size="large" style={{ width: 80 }} />
        </Space>
        
        {/* Form Fields */}
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Skeleton.Input active style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active style={{ width: '100%', height: 40 }} />
        </Space>
        
        {/* Submit Button */}
        <Skeleton.Button active size="large" style={{ width: '100%', height: 50 }} />
      </Space>
    </Card>
  );
};
