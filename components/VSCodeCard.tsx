// File: components/VSCodeCard.tsx
'use client';

import { ReactNode, useState } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface VSCodeCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: React.CSSProperties;
}

export default function VSCodeCard({
  title,
  subtitle,
  children,
  className = '',
  headerActions,
  collapsible = false,
  defaultCollapsed = false,
  icon,
  variant = 'default',
  style
}: VSCodeCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Define variant styles
  const getVariantStyle = () => {
    const baseStyle: React.CSSProperties = {
      transition: 'all 0.3s ease',
      ...style
    };

    switch (variant) {
      case 'success':
        return {
          ...baseStyle,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
        };
      case 'warning':
        return {
          ...baseStyle,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
        };
      case 'error':
        return {
          ...baseStyle,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
        };
      default:
        return baseStyle;
    }
  };

  // Create title element with icon and subtitle
  const titleElement = title ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        {collapsible && (
          <Button
            type="text"
            size="small"
            icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ padding: '4px 8px' }}
          />
        )}
        {icon && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6'
          }}>
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {headerActions && (
        <Space size="small">
          {headerActions}
        </Space>
      )}
    </div>
  ) : undefined;

  return (
    <Card
      title={titleElement}
      className={className}
      style={getVariantStyle()}
      styles={{
        header: {
          borderBottom: title ? '1px solid rgba(5, 5, 5, 0.06)' : 'none',
          background: title ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(241, 245, 249, 0.8))' : 'transparent',
        },
        body: {
          display: (!collapsible || !isCollapsed) ? 'block' : 'none',
          padding: title ? 20 : 16,
        }
      }}
    >
      {(!collapsible || !isCollapsed) && children}
    </Card>
  );
}
