'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Layout, Button, Avatar, Dropdown, Space, Badge, Drawer, Typography } from 'antd';
import {
  HomeOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  DashboardOutlined,
  BarChartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '../../../contexts/integrated/UserContext';
// import { useTranslations } from '../../../contexts/LanguageContext'; // Temporarily disabled

const { Header } = Layout;
const { Text } = Typography;

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface NavigationProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

const navigationItems: NavigationItem[] = [
  {
    key: 'home',
    label: 'Homepage',
    icon: <HomeOutlined />,
    href: '/integrated-trading',
  },
  {
    key: 'trading',
    label: 'Trading',
    icon: <LineChartOutlined />,
    href: '/integrated-trading/trading',
  },
  {
    key: 'backtesting',
    label: 'Backtesting',
    icon: <ExperimentOutlined />,
    href: '/integrated-trading/backtesting',
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    href: '/integrated-trading/dashboard',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChartOutlined />,
    href: '/integrated-trading/analytics',
  },
];

export default function IntegratedNavigation({ className = '', onNavigate }: NavigationProps) {
  const pathname = usePathname();
  const { state: userState, logout } = useUser();
  // const { t } = useTranslations(); // Temporarily disabled
  const t = (key: string) => key; // Simple fallback
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current active key based on pathname
  const getCurrentKey = () => {
    const currentItem = navigationItems.find(item =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    return currentItem?.key || 'home';
  };

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile'),
      onClick: () => console.log('Profile clicked'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings'),
      onClick: () => console.log('Settings clicked'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      onClick: logout,
      danger: true,
    },
  ];

  // Handle menu click
  const handleMenuClick = (key: string) => {
    const item = navigationItems.find(nav => nav.key === key);
    if (item) {
      onNavigate?.(item.href);
      setMobileMenuOpen(false);
    }
  };

  // Desktop Navigation Menu
  const DesktopMenu = () => (
    <Menu
      mode="horizontal"
      selectedKeys={[getCurrentKey()]}
      className="flex-1 border-none bg-transparent"
      items={navigationItems.map(item => ({
        key: item.key,
        icon: item.icon,
        label: (
          <Link href={item.href} className="text-slate-700 dark:text-slate-300">
            {item.label}
          </Link>
        ),
      }))}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );

  // Mobile Navigation Menu
  const MobileMenu = () => (
    <Menu
      mode="vertical"
      selectedKeys={[getCurrentKey()]}
      className="border-none"
      items={navigationItems.map(item => ({
        key: item.key,
        icon: item.icon,
        label: (
          <Link href={item.href} className="text-slate-700 dark:text-slate-300">
            {item.label}
          </Link>
        ),
      }))}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );

  return (
    <>
      <Header className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 ${className}`}>
        <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/integrated-trading" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ThunderboltOutlined className="text-white text-lg" />
              </div>
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 hidden sm:block">
                CryptoTrader
              </Text>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
            <DesktopMenu />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              />
            </Badge>

            {/* User Menu */}
            {userState.isAuthenticated ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
                  <Avatar
                    size="small"
                    src={userState.user?.avatar}
                    icon={<UserOutlined />}
                    className="bg-blue-500"
                  />
                  <div className="hidden sm:block">
                    <Text className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {userState.user?.name || userState.user?.email}
                    </Text>
                  </div>
                </div>
              </Dropdown>
            ) : (
              <Space>
                <Button type="default" size="small">
                  {t('login')}
                </Button>
                <Button type="primary" size="small">
                  {t('register')}
                </Button>
              </Space>
            )}

            {/* Mobile Menu Button */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="lg:hidden text-slate-600 hover:text-blue-600 dark:text-slate-400"
              onClick={() => setMobileMenuOpen(true)}
            />
          </div>
        </div>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
              <ThunderboltOutlined className="text-white text-sm" />
            </div>
            <Text className="font-bold text-slate-900 dark:text-slate-100">
              CryptoTrader
            </Text>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        className="lg:hidden"
        width={280}
      >
        <MobileMenu />

        {/* Mobile User Section */}
        {userState.isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                src={userState.user?.avatar}
                icon={<UserOutlined />}
                className="bg-blue-500"
              />
              <div>
                <Text className="block font-medium text-slate-900 dark:text-slate-100">
                  {userState.user?.name || userState.user?.email}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {userState.user?.email}
                </Text>
              </div>
            </div>

            <Space direction="vertical" className="w-full">
              <Button type="text" icon={<UserOutlined />} className="w-full justify-start">
                {t('profile')}
              </Button>
              <Button type="text" icon={<SettingOutlined />} className="w-full justify-start">
                {t('settings')}
              </Button>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={logout}
              >
                {t('logout')}
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </>
  );
}
