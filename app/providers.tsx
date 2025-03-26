// File: app/providers.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // attribute="class" -> thêm class 'dark' vào thẻ <html>
  // defaultTheme="system" -> sử dụng theme hệ thống làm mặc định
  // enableSystem -> cho phép sử dụng theme hệ thống
  // disableTransitionOnChange -> tránh nhấp nháy khi đổi theme nhanh
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...props}
     >
      {children}
    </NextThemesProvider>
  );
}