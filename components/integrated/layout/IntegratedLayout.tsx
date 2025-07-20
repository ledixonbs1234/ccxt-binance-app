// File: components/integrated/layout/IntegratedLayout.tsx
'use client';

import React, { ReactNode } from 'react';
import { Layout, ConfigProvider } from 'antd';
import { useRouter } from 'next/navigation';
import IntegratedNavigation from '../navigation/IntegratedNavigation';
import { PageHeader } from '../shared';
import ErrorBoundary from '../shared/ErrorBoundary';

const { Content, Footer } = Layout;

interface IntegratedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
  }>;
  headerExtra?: ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  showFooter?: boolean;
  className?: string;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function IntegratedLayout({
  children,
  title,
  subtitle,
  breadcrumbItems,
  headerExtra,
  showHeader = true,
  showNavigation = true,
  showFooter = true,
  className = '',
  contentClassName = '',
  maxWidth = 'xl',
  padding = 'md',
}: IntegratedLayoutProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            footerBg: 'transparent',
          },
        },
      }}
    >
      <Layout className={`min-h-screen bg-slate-50 dark:bg-slate-900 ${className}`}>
        {/* Navigation */}
        {showNavigation && (
          <IntegratedNavigation onNavigate={handleNavigate} />
        )}

        {/* Page Header */}
        {showHeader && title && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            breadcrumbItems={breadcrumbItems}
            extra={headerExtra}
            showUserActions={false} // Navigation already handles user actions
          />
        )}

        {/* Main Content */}
        <Content className={`flex-1 ${contentClassName}`}>
          <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]}`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </Content>

        {/* Footer */}
        {showFooter && (
          <Footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center">
            <div className={`mx-auto ${maxWidthClasses[maxWidth]} px-4`}>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
                <div className="text-slate-600 dark:text-slate-400">
                  © 2025 CryptoTrader. Built with Next.js & Ant Design.
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <a
                    href="/docs"
                    className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    Documentation
                  </a>
                  <a
                    href="/support"
                    className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    Support
                  </a>
                  <a
                    href="/api-health-demo"
                    className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    API Status
                  </a>
                </div>
              </div>
            </div>
          </Footer>
        )}
      </Layout>
    </ConfigProvider>
  );
}

// Specialized layout variants
export function HomePageLayout({ children, ...props }: Omit<IntegratedLayoutProps, 'title'>) {
  return (
    <IntegratedLayout
      title="Cryptocurrency Market"
      subtitle="Real-time market data and trading insights"
      maxWidth="full"
      {...props}
    >
      {children}
    </IntegratedLayout>
  );
}

export function TradingPageLayout({ children, ...props }: Omit<IntegratedLayoutProps, 'title'>) {
  return (
    <IntegratedLayout
      title="Trading Dashboard"
      subtitle="Execute trades and manage positions"
      maxWidth="full"
      padding="sm"
      {...props}
    >
      {children}
    </IntegratedLayout>
  );
}

export function BacktestingPageLayout({ children, ...props }: Omit<IntegratedLayoutProps, 'title'>) {
  return (
    <IntegratedLayout
      title="Strategy Backtesting"
      subtitle="Test and optimize your trading strategies"
      maxWidth="xl"
      {...props}
    >
      {children}
    </IntegratedLayout>
  );
}