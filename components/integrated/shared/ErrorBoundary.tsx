// File: components/integrated/shared/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Card } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <Result
              status="error"
              icon={<ExclamationCircleOutlined className="text-red-500" />}
              title="Something went wrong"
              subTitle="We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
              extra={[
                <Button
                  key="retry"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>,
              ]}
            >
              {this.props.showDetails && this.state.error && (
                <div className="mt-6 text-left">
                  <Paragraph>
                    <Text strong>Error Details:</Text>
                  </Paragraph>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Paragraph>
                      <Text code className="text-red-600">
                        {this.state.error.name}: {this.state.error.message}
                      </Text>
                    </Paragraph>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </Result>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error boundary hook for simpler usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple error display component
export function ErrorDisplay({
  error,
  onRetry,
  title = 'Error',
  description = 'Something went wrong. Please try again.',
}: {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={description}
      extra={
        onRetry && (
          <Button type="primary" onClick={onRetry} icon={<ReloadOutlined />}>
            Try Again
          </Button>
        )
      }
    >
      {error && (
        <div className="mt-4">
          <Text type="danger" className="text-sm">
            {error.message}
          </Text>
        </div>
      )}
    </Result>
  );
}
