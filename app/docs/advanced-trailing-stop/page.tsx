'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Typography, Anchor, Card, Space, Divider, Button, Alert } from 'antd';
import { BookOutlined, CodeOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

export default function AdvancedTrailingStopDocsPage() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load markdown content
    fetch('/docs/advanced-trailing-stop-guide.md')
      .then(response => response.text())
      .then(content => {
        setMarkdownContent(content);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load documentation:', error);
        setLoading(false);
      });
  }, []);

  const anchorItems = [
    {
      key: 'overview',
      href: '#tổng-quan',
      title: 'Tổng quan',
      children: [
        { key: 'architecture', href: '#kiến-trúc-hệ-thống', title: 'Kiến trúc hệ thống' }
      ]
    },
    {
      key: 'strategies',
      href: '#11-chiến-lược-trailing-stop',
      title: '11 Chiến lược',
      children: [
        { key: 'percentage', href: '#1-percentage-based-cơ-bản', title: 'Percentage Based' },
        { key: 'atr', href: '#2-atr-based-average-true-range', title: 'ATR Based' },
        { key: 'fibonacci', href: '#3-fibonacci-retracement', title: 'Fibonacci' },
        { key: 'bollinger', href: '#4-bollinger-bands', title: 'Bollinger Bands' },
        { key: 'hybrid', href: '#11-hybrid-multi-strategy', title: 'Hybrid Multi-Strategy' }
      ]
    },
    {
      key: 'examples',
      href: '#code-examples',
      title: 'Code Examples',
    },
    {
      key: 'performance',
      href: '#performance-metrics',
      title: 'Performance Metrics',
    },
    {
      key: 'api',
      href: '#api-reference',
      title: 'API Reference',
    },
    {
      key: 'troubleshooting',
      href: '#troubleshooting',
      title: 'Troubleshooting',
    },
    {
      key: 'best-practices',
      href: '#best-practices',
      title: 'Best Practices',
    }
  ];

  const customComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '13px'
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code 
          className={className} 
          style={{ 
            background: 'var(--secondary-bg)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            color: 'var(--foreground)',
            fontSize: '13px'
          }} 
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <Title level={1} style={{ color: 'var(--foreground)', marginTop: '32px' }}>
        {children}
      </Title>
    ),
    h2: ({ children }: any) => (
      <Title level={2} style={{ color: 'var(--foreground)', marginTop: '24px' }}>
        {children}
      </Title>
    ),
    h3: ({ children }: any) => (
      <Title level={3} style={{ color: 'var(--foreground)', marginTop: '20px' }}>
        {children}
      </Title>
    ),
    h4: ({ children }: any) => (
      <Title level={4} style={{ color: 'var(--foreground)', marginTop: '16px' }}>
        {children}
      </Title>
    ),
    p: ({ children }: any) => (
      <Paragraph style={{ color: 'var(--foreground)', lineHeight: '1.6' }}>
        {children}
      </Paragraph>
    ),
    ul: ({ children }: any) => (
      <ul style={{ color: 'var(--foreground)', paddingLeft: '20px' }}>
        {children}
      </ul>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: '4px' }}>
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <Alert
        message={children}
        type="info"
        showIcon
        style={{ margin: '16px 0' }}
      />
    ),
    table: ({ children }: any) => (
      <div style={{ overflowX: 'auto', margin: '16px 0' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th style={{ 
        padding: '12px', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--secondary-bg)',
        color: 'var(--foreground)',
        fontWeight: '600',
        textAlign: 'left'
      }}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td style={{ 
        padding: '12px', 
        borderBottom: '1px solid var(--border)',
        color: 'var(--foreground)'
      }}>
        {children}
      </td>
    )
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Sider 
        width={280} 
        style={{ 
          background: 'var(--card-bg)', 
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          overflow: 'auto'
        }}
      >
        <div style={{ padding: '24px 16px' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ color: 'var(--foreground)', margin: 0 }}>
                <BookOutlined /> Documentation
              </Title>
              <Paragraph style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: '12px' }}>
                Advanced Trailing Stop System
              </Paragraph>
            </div>

            <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />

            <Anchor
              items={anchorItems}
              offsetTop={80}
              style={{ 
                background: 'transparent',
                fontSize: '13px'
              }}
            />

            <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />

            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<CodeOutlined />} 
                size="small"
                href="/advanced-trailing-stop"
                style={{ width: '100%' }}
              >
                Live Demo
              </Button>
              <Button 
                icon={<BarChartOutlined />} 
                size="small"
                href="/trading"
                style={{ width: '100%' }}
              >
                Trading Dashboard
              </Button>
              <Button 
                icon={<SettingOutlined />} 
                size="small"
                href="/settings"
                style={{ width: '100%' }}
              >
                Settings
              </Button>
            </Space>
          </Space>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 280 }}>
        <Content style={{ padding: '24px 32px', maxWidth: '900px' }}>
          {loading ? (
            <Card loading style={{ minHeight: '400px' }} />
          ) : (
            <div className="documentation-content">
              <ReactMarkdown 
                components={customComponents}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
