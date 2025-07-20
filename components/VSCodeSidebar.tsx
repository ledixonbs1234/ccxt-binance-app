// File: components/VSCodeSidebar.tsx
'use client';

import { Layout, Menu, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  RobotOutlined,
  StarOutlined,
  HistoryOutlined,
  SettingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useTranslations } from '../contexts/LanguageContext';

const { Sider } = Layout;

interface VSCodeSidebarProps {
  currentSection: string;
  onSectionChange?: (section: string) => void;
}

export default function VSCodeSidebar({ currentSection, onSectionChange }: VSCodeSidebarProps) {
  const t = useTranslations();

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t.navigation.dashboard,
    },
    {
      key: 'trading',
      icon: <LineChartOutlined />,
      label: t.navigation.manualTrade,
    },
    {
      key: 'smart-trailing',
      icon: <RobotOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t.navigation.smartTrailing}</span>
          <Badge count="AI" style={{ backgroundColor: '#1890ff', fontSize: '10px' }} />
        </div>
      ),
    },
    {
      key: 'enhanced-trailing-demo',
      icon: <StarOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t.navigation.enhancedDemo}</span>
          <Badge count="MỚI" style={{ backgroundColor: '#52c41a', fontSize: '10px' }} />
        </div>
      ),
    },
    {
      key: 'ai-backtesting',
      icon: <ExperimentOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>AI Backtesting</span>
          <Badge count="HOT" style={{ backgroundColor: '#ff4d4f', fontSize: '10px' }} />
        </div>
      ),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: t.navigation.history,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t.navigation.settings,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    onSectionChange?.(e.key);
  };

  return (
    <Sider
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64, // Account for header height
        bottom: 32, // Account for status bar height
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[currentSection]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{
          height: '100%',
          borderRight: 0,
          paddingTop: '12px'
        }}
      />
    </Sider>
  );
}