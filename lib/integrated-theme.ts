// File: lib/integrated-theme.ts
import type { ThemeConfig } from 'antd';
import { lightTheme, darkTheme, tradingColors } from './antd-theme';

// Integrated platform specific colors
export const integratedPlatformColors = {
  primary: '#3b82f6',    // Blue 500 - Primary color
  secondary: '#8b5cf6',  // Violet 500 - Secondary color
  accent: '#f59e0b',     // Amber 500 - Accent color
  
  // Section-specific colors
  home: '#3b82f6',       // Blue 500 - Home section
  trading: '#10b981',    // Emerald 500 - Trading section
  testing: '#8b5cf6',    // Violet 500 - Testing section
  
  // Status colors
  active: '#10b981',     // Emerald 500 - Active state
  inactive: '#94a3b8',   // Slate 400 - Inactive state
  warning: '#f59e0b',    // Amber 500 - Warning state
  error: '#ef4444',      // Red 500 - Error state
};

// Integrated platform light theme
export const integratedLightTheme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    colorPrimary: integratedPlatformColors.primary,
  },
  components: {
    ...lightTheme.components,
    Menu: {
      colorItemBgSelected: '#e0e7ff', // Indigo 100
      colorItemTextSelected: integratedPlatformColors.primary,
    },
    Tabs: {
      colorBgContainer: '#ffffff',
      inkBarColor: integratedPlatformColors.primary,
    },
  },
};

// Integrated platform dark theme
export const integratedDarkTheme: ThemeConfig = {
  ...darkTheme,
  token: {
    ...darkTheme.token,
    colorPrimary: integratedPlatformColors.primary,
  },
  components: {
    ...darkTheme.components,
    Menu: {
      colorItemBgSelected: '#312e81', // Indigo 900
      colorItemTextSelected: '#e0e7ff', // Indigo 100
    },
    Tabs: {
      colorBgContainer: '#1e293b',
      inkBarColor: integratedPlatformColors.primary,
    },
  },
};

// Integrated platform component styles
export const integratedComponentStyles = {
  '.integrated-section-home': {
    borderColor: integratedPlatformColors.home,
  },
  '.integrated-section-trading': {
    borderColor: integratedPlatformColors.trading,
  },
  '.integrated-section-testing': {
    borderColor: integratedPlatformColors.testing,
  },
  '.integrated-active': {
    color: integratedPlatformColors.active,
  },
  '.integrated-inactive': {
    color: integratedPlatformColors.inactive,
  },
  '.integrated-warning': {
    color: integratedPlatformColors.warning,
  },
  '.integrated-error': {
    color: integratedPlatformColors.error,
  },
};
