// File: components/integrated/layout/CardContainer.tsx
'use client';

import React, { ReactNode } from 'react';
import { Card, Typography, Button, Space, Divider } from 'antd';
import { MoreOutlined, FullscreenOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CardContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
  loading?: boolean;
  className?: string;
  bodyClassName?: string;
  size?: 'small' | 'default' | 'large';
  bordered?: boolean;
  hoverable?: boolean;
  actions?: ReactNode[];
  onRefresh?: () => void;
  onFullscreen?: () => void;
  showDivider?: boolean;
}

export default function CardContainer({
  children,
  title,
  subtitle,
  extra,
  loading = false,
  className = '',
  bodyClassName = '',
  size = 'default',
  bordered = true,
  hoverable = false,
  actions,
  onRefresh,
  onFullscreen,
  showDivider = false,
}: CardContainerProps) {
  // Build header extra actions
  const headerExtra = (
    <Space>
      {extra}
      {onRefresh && (
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          className="text-slate-500 hover:text-blue-600"
        />
      )}
      {onFullscreen && (
        <Button
          type="text"
          size="small"
          icon={<FullscreenOutlined />}
          onClick={onFullscreen}
          className="text-slate-500 hover:text-blue-600"
        />
      )}
    </Space>
  );

  return (
    <Card
      title={
        title && (
          <div>
            <Title level={4} className="!mb-0">
              {title}
            </Title>
            {subtitle && (
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {subtitle}
              </Text>
            )}
          </div>
        )
      }
      extra={headerExtra}
      loading={loading}
      className={`shadow-sm hover:shadow-md transition-shadow ${className}`}
      styles={{
        body: {
          padding: size === 'small' ? '12px' : size === 'large' ? '32px' : '24px',
        }
      }}
      size={size as 'small' | 'default'}
      variant={bordered ? 'outlined' : 'borderless'}
      hoverable={hoverable}
      actions={actions}
    >
      <div className={bodyClassName}>
        {showDivider && title && <Divider className="mt-0" />}
        {children}
      </div>
    </Card>
  );
}

// Specialized card variants
export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  loading = false,
  className = '',
}: {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
  }[changeType];

  return (
    <CardContainer
      loading={loading}
      className={`text-center ${className}`}
      size="small"
      hoverable
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Text className="text-slate-500 dark:text-slate-400 text-sm block mb-1">
            {title}
          </Text>
          <Title level={3} className="!mb-0">
            {value}
          </Title>
          {change && (
            <Text className={`text-sm ${changeColor}`}>
              {change}
            </Text>
          )}
        </div>
        {icon && (
          <div className="text-2xl text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </CardContainer>
  );
}

export function ChartCard({
  title,
  children,
  timeframe,
  onTimeframeChange,
  loading = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  loading?: boolean;
  className?: string;
}) {
  const timeframeOptions = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <CardContainer
      title={title}
      loading={loading}
      className={className}
      extra={
        onTimeframeChange && (
          <Space>
            {timeframeOptions.map(tf => (
              <Button
                key={tf}
                type={timeframe === tf ? 'primary' : 'text'}
                size="small"
                onClick={() => onTimeframeChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </Space>
        )
      }
      onRefresh={() => console.log('Refresh chart')}
      onFullscreen={() => console.log('Fullscreen chart')}
    >
      <div className="h-64 md:h-80 lg:h-96">
        {children}
      </div>
    </CardContainer>
  );
}

export function TableCard({
  title,
  children,
  searchable = false,
  onSearch,
  loading = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  searchable?: boolean;
  onSearch?: (value: string) => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <CardContainer
      title={title}
      loading={loading}
      className={className}
      extra={
        searchable && onSearch && (
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1 border border-slate-300 rounded-md text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        )
      }
      onRefresh={() => console.log('Refresh table')}
    >
      {children}
    </CardContainer>
  );
}

export function FormCard({
  title,
  children,
  loading = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <CardContainer
      title={title}
      loading={loading}
      className={className}
      size="small"
    >
      {children}
    </CardContainer>
  );
}

export function WidgetCard({
  title,
  children,
  color = 'blue',
  loading = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
  className?: string;
}) {
  const colorClasses = {
    blue: 'border-l-4 border-l-blue-500',
    green: 'border-l-4 border-l-green-500',
    red: 'border-l-4 border-l-red-500',
    yellow: 'border-l-4 border-l-yellow-500',
    purple: 'border-l-4 border-l-purple-500',
  };

  return (
    <CardContainer
      title={title}
      loading={loading}
      className={`${colorClasses[color]} ${className}`}
      size="small"
      hoverable
    >
      {children}
    </CardContainer>
  );
}
