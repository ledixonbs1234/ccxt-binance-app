// File: components/VSCodeHeader.tsx
'use client';

import { Layout, Button, Badge, Space, Avatar, Typography } from 'antd';
import { SunOutlined, MoonOutlined, StarFilled } from '@ant-design/icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LanguageSwitcher, useTranslations } from '../contexts/LanguageContext';

const { Header } = Layout;
const { Title, Text } = Typography;

export default function VSCodeHeader() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 64,
        position: 'fixed',
        zIndex: 1,
        width: '100%',
        top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}>
            <StarFilled style={{ color: 'white', fontSize: 16 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pro Trader
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Môi trường giao dịch hỗ trợ AI
            </Text>
          </div>
        </div>
      </Header>
    );
  }

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: 64,
      position: 'fixed',
      zIndex: 1,
      width: '100%',
      top: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}>
          <StarFilled style={{ color: 'white', fontSize: 16 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pro Trader
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Môi trường giao dịch hỗ trợ AI
          </Text>
        </div>
      </div>

      <Space size="middle">
        <Badge status="processing" text="Trực tuyến" />

        {/* Language Switcher */}
        <LanguageSwitcher
          variant="buttons"
          showFlag={true}
          showName={false}
          className="text-xs"
        />

        {/* Theme Toggle Button */}
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
        />

        <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
          U
        </Avatar>
      </Space>
    </Header>
  );
}