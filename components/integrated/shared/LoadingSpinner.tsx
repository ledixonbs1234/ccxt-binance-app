// File: components/integrated/shared/LoadingSpinner.tsx
'use client';

import React from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const customIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export default function LoadingSpinner({
  size = 'default',
  message,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Spin 
        size={size} 
        indicator={customIcon}
        className="text-blue-500"
      />
      {message && (
        <Text className="text-slate-600 dark:text-slate-400 text-sm">
          {message}
        </Text>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading components
export function PageLoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="large" message={message} />
    </div>
  );
}

export function CardLoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="py-8">
      <LoadingSpinner message={message} />
    </div>
  );
}

export function ButtonLoadingSpinner() {
  return <Spin size="small" className="mr-2" />;
}
