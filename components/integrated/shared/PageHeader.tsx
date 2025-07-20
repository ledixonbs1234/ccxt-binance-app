// File: components/integrated/shared/PageHeader.tsx
'use client';

import React from 'react';
import { Typography, Breadcrumb, Space, Button, Dropdown, Avatar } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useUser } from '../../../contexts/integrated/UserContext';
// import { useTranslations } from '../../../contexts/LanguageContext'; // Temporarily disabled

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
  }>;
  extra?: React.ReactNode;
  showUserActions?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbItems,
  extra,
  showUserActions = true,
}: PageHeaderProps) {
  const { state: userState, logout } = useUser();
  const t = (key: string) => key; // Simple fallback for translation

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      onClick: logout,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <Breadcrumb
              className="mb-2"
              items={breadcrumbItems.map(item => ({
                title: item.href ? (
                  <a href={item.href} className="text-slate-600 hover:text-blue-600">
                    {item.title}
                  </a>
                ) : (
                  <span className="text-slate-900 dark:text-slate-100">{item.title}</span>
                ),
              }))}
            />
          )}
          
          <div className="flex items-center gap-4">
            <div>
              <Title level={2} className="!mb-0 !text-slate-900 dark:!text-slate-100">
                {title}
              </Title>
              {subtitle && (
                <Text className="text-slate-600 dark:text-slate-400">
                  {subtitle}
                </Text>
              )}
            </div>
            
            {extra && (
              <div className="ml-auto">
                {extra}
              </div>
            )}
          </div>
        </div>

        {showUserActions && (
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              type="text"
              icon={<BellOutlined />}
              className="text-slate-600 hover:text-blue-600"
            />

            {/* User Menu */}
            {userState.user ? (
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
          </div>
        )}
      </div>
    </div>
  );
}
