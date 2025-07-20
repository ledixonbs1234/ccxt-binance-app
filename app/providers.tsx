// File: app/providers.tsx
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { ConfigProvider, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import viVN from 'antd/locale/vi_VN';
import { integratedLightTheme, integratedDarkTheme } from '../lib/antd-theme';
import { TradingProvider } from '../contexts/TradingContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import {
  UserProvider,
  MarketProvider,
  BacktestProvider,
  EnhancedTradingProvider,
  NotificationProvider,
  WebSocketProvider
} from '../contexts/integrated';

// Import the React 19 compatibility patch
import '@ant-design/v5-patch-for-react-19';

// Ant Design Theme Provider Component
function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ConfigProvider theme={integratedLightTheme} locale={viVN}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const antdTheme = currentTheme === 'dark' ? integratedDarkTheme : integratedLightTheme;

  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <AntdRegistry>
      <NextThemesProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
          themes={['light', 'dark']}
          {...props}
       >
        <AntdThemeProvider>
          <LanguageProvider defaultLanguage="vi">
            <UserProvider>
              <NotificationProvider>
                <WebSocketProvider>
                  <MarketProvider>
                    <TradingProvider>
                      <EnhancedTradingProvider>
                        <BacktestProvider>
                          {children}
                        </BacktestProvider>
                      </EnhancedTradingProvider>
                    </TradingProvider>
                  </MarketProvider>
                </WebSocketProvider>
              </NotificationProvider>
            </UserProvider>
          </LanguageProvider>
        </AntdThemeProvider>
      </NextThemesProvider>
    </AntdRegistry>
  );
}