// File: lib/antd-theme.ts
import type { ThemeConfig } from 'antd';

// Trading-specific colors that match your current design
export const tradingColors = {
  buy: '#10b981',      // Emerald 500 - Buy/Long positions
  sell: '#ef4444',     // Red 500 - Sell/Short positions
  profit: '#10b981',   // Green for profits
  loss: '#ef4444',     // Red for losses
  neutral: '#64748b',  // Gray for neutral states
};

// Light theme configuration
export const lightTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#3b82f6',        // Blue 500 - matches your accent color
    colorSuccess: '#10b981',        // Emerald 500
    colorWarning: '#f59e0b',        // Amber 500
    colorError: '#ef4444',          // Red 500
    colorInfo: '#0ea5e9',           // Sky 500
    
    // Background colors
    colorBgBase: '#ffffff',         // Card background
    colorBgContainer: '#ffffff',    // Container background
    colorBgElevated: '#ffffff',     // Elevated background
    colorBgLayout: '#f8fafc',       // Layout background - very light gray
    colorBgSpotlight: '#f1f5f9',    // Spotlight background
    
    // Text colors
    colorText: '#0f172a',           // Slate 900 - Dark text
    colorTextSecondary: '#64748b',  // Slate 500 - Muted text
    colorTextTertiary: '#94a3b8',   // Slate 400
    colorTextQuaternary: '#cbd5e1', // Slate 300
    
    // Border colors
    colorBorder: '#e2e8f0',         // Slate 200
    colorBorderSecondary: '#f1f5f9', // Slate 100
    
    // Component specific
    borderRadius: 8,                // Rounded corners
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    
    // Typography
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      paddingContentHorizontal: 16,
    },
    Card: {
      borderRadius: 8,
      paddingLG: 20,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
      paddingContentHorizontal: 12,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Table: {
      borderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f8fafc',
    },
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#3b82f6',        // Blue 500
    colorSuccess: '#10b981',        // Emerald 500
    colorWarning: '#f59e0b',        // Amber 500
    colorError: '#ef4444',          // Red 500
    colorInfo: '#0ea5e9',           // Sky 500
    
    // Background colors
    colorBgBase: '#1e293b',         // Slate 800 - Card background
    colorBgContainer: '#1e293b',    // Container background
    colorBgElevated: '#334155',     // Slate 700 - Elevated background
    colorBgLayout: '#0f172a',       // Slate 900 - Layout background
    colorBgSpotlight: '#334155',    // Slate 700
    
    // Text colors
    colorText: '#f1f5f9',           // Slate 100 - Light text
    colorTextSecondary: '#94a3b8',  // Slate 400 - Muted text
    colorTextTertiary: '#64748b',   // Slate 500
    colorTextQuaternary: '#475569', // Slate 600
    
    // Border colors
    colorBorder: '#334155',         // Slate 700
    colorBorderSecondary: '#475569', // Slate 600
    
    // Component specific
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    
    // Typography
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      paddingContentHorizontal: 16,
    },
    Card: {
      borderRadius: 8,
      paddingLG: 20,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
      paddingContentHorizontal: 12,
      colorBgContainer: '#1e293b',
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
      colorBgContainer: '#1e293b',
    },
    Table: {
      borderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      colorBgContainer: '#1e293b',
    },
    Layout: {
      headerBg: '#1e293b',
      siderBg: '#1e293b',
      bodyBg: '#0f172a',
    },
  },
};

// Trading-specific component styles
export const tradingComponentStyles = {
  '.trading-buy': {
    color: tradingColors.buy,
    borderColor: tradingColors.buy,
  },
  '.trading-sell': {
    color: tradingColors.sell,
    borderColor: tradingColors.sell,
  },
  '.trading-profit': {
    color: tradingColors.profit,
  },
  '.trading-loss': {
    color: tradingColors.loss,
  },
  '.trading-neutral': {
    color: tradingColors.neutral,
  },
};

// Integrated platform theme extensions
export const integratedThemeExtensions = {
  // Homepage specific colors
  homepage: {
    cardHover: '#f8fafc',
    cardHoverDark: '#334155',
    coinListHeader: '#f1f5f9',
    coinListHeaderDark: '#1e293b',
  },

  // Trading page specific colors
  trading: {
    chartBackground: '#ffffff',
    chartBackgroundDark: '#1e293b',
    orderFormBackground: '#f8fafc',
    orderFormBackgroundDark: '#0f172a',
  },

  // Backtesting page specific colors
  backtesting: {
    configPanelBackground: '#f8fafc',
    configPanelBackgroundDark: '#0f172a',
    resultsPanelBackground: '#ffffff',
    resultsPanelBackgroundDark: '#1e293b',
  },

  // Navigation colors
  navigation: {
    activeTab: '#3b82f6',
    inactiveTab: '#64748b',
    hoverTab: '#e2e8f0',
    hoverTabDark: '#334155',
  },
};

// Enhanced light theme for integrated platform
export const integratedLightTheme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    // Enhanced spacing for better layout
    marginXS: 4,
    marginSM: 8,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    // Enhanced padding
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,

    // Enhanced border radius for modern look
    borderRadiusXS: 4,
    borderRadiusSM: 6,
    borderRadiusLG: 12,
    borderRadiusOuter: 16,
  },
  components: {
    ...lightTheme.components,
    // Enhanced Menu component for navigation
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e2e8f0',
      itemHoverBg: '#f1f5f9',
      itemActiveBg: '#e2e8f0',
      itemSelectedColor: '#3b82f6',
      itemColor: '#64748b',
      horizontalItemSelectedBg: '#e2e8f0',
      horizontalItemHoverBg: '#f1f5f9',
    },

    // Enhanced Tabs component
    Tabs: {
      itemColor: '#64748b',
      itemSelectedColor: '#3b82f6',
      itemHoverColor: '#3b82f6',
      inkBarColor: '#3b82f6',
      cardBg: '#ffffff',
    },

    // Enhanced Drawer component for mobile navigation
    Drawer: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
    },

    // Enhanced Modal component
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
    },

    // Enhanced Notification component
    Notification: {
      colorBgElevated: '#ffffff',
      colorText: '#0f172a',
      colorTextHeading: '#0f172a',
    },
  },
};

// Enhanced dark theme for integrated platform
export const integratedDarkTheme: ThemeConfig = {
  ...darkTheme,
  token: {
    ...darkTheme.token,
    // Enhanced spacing for better layout
    marginXS: 4,
    marginSM: 8,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    // Enhanced padding
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,

    // Enhanced border radius for modern look
    borderRadiusXS: 4,
    borderRadiusSM: 6,
    borderRadiusLG: 12,
    borderRadiusOuter: 16,
  },
  components: {
    ...darkTheme.components,
    // Enhanced Menu component for navigation
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#334155',
      itemHoverBg: '#475569',
      itemActiveBg: '#334155',
      itemSelectedColor: '#3b82f6',
      itemColor: '#94a3b8',
      horizontalItemSelectedBg: '#334155',
      horizontalItemHoverBg: '#475569',
    },

    // Enhanced Tabs component
    Tabs: {
      itemColor: '#94a3b8',
      itemSelectedColor: '#3b82f6',
      itemHoverColor: '#3b82f6',
      inkBarColor: '#3b82f6',
      cardBg: '#1e293b',
    },

    // Enhanced Drawer component for mobile navigation
    Drawer: {
      colorBgElevated: '#1e293b',
      colorBgMask: 'rgba(0, 0, 0, 0.65)',
    },

    // Enhanced Modal component
    Modal: {
      contentBg: '#1e293b',
      headerBg: '#1e293b',
      footerBg: '#1e293b',
    },

    // Enhanced Notification component
    Notification: {
      colorBgElevated: '#1e293b',
      colorText: '#f1f5f9',
      colorTextHeading: '#f1f5f9',
    },
  },
};
