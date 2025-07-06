// File: components/VSCodeLayout.tsx
'use client';

import { Layout } from 'antd';
import VSCodeHeader from './VSCodeHeader';
import VSCodeSidebar from './VSCodeSidebar';
import VSCodeStatusBar from './VSCodeStatusBar';

const { Content } = Layout;

interface VSCodeLayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function VSCodeLayout({
  children,
  currentSection = 'dashboard',
  onSectionChange
}: VSCodeLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <VSCodeHeader />
      <Layout style={{ marginTop: 64 }}>
        <VSCodeSidebar
          currentSection={currentSection}
          onSectionChange={onSectionChange}
        />
        <Layout style={{ marginLeft: 256 }}>
          <Content style={{
            padding: '24px',
            margin: 0,
            minHeight: 'calc(100vh - 96px)', // Account for header and footer
            overflow: 'auto',
            marginBottom: 32 // Account for status bar
          }}>
            <div style={{ maxWidth: '100%' }}>
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
      <VSCodeStatusBar />
    </Layout>
  );
}