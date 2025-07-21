'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Input, 
  Card, 
  Typography, 
  Space, 
  Breadcrumb, 
  Anchor,
  Divider,
  Tag,
  Alert,
  Button,
  Drawer
} from 'antd';
import { 
  BookOutlined, 
  SettingOutlined, 
  KeyOutlined, 
  MonitorOutlined,
  SearchOutlined,
  MenuOutlined,
  HomeOutlined,
  ApiOutlined,
  SafetyOutlined,
  ToolOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PageContainer from '@/components/PageContainer';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface DocSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  tags: string[];
}

export default function DocumentationPage() {
  const [selectedDoc, setSelectedDoc] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [docContent, setDocContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const docSections: DocSection[] = [
    {
      key: 'overview',
      title: 'Tổng quan hệ thống',
      icon: <HomeOutlined />,
      content: 'overview',
      tags: ['architecture', 'overview', 'system']
    },
    {
      key: 'production-setup',
      title: 'Production Setup Guide',
      icon: <SettingOutlined />,
      content: 'production-setup-guide',
      tags: ['production', 'deployment', 'server', 'nginx']
    },
    {
      key: 'api-keys',
      title: 'API Keys & External Services',
      icon: <KeyOutlined />,
      content: 'api-keys-external-services',
      tags: ['api', 'binance', 'supabase', 'security']
    },
    {
      key: 'monitoring',
      title: 'Monitoring & Troubleshooting',
      icon: <MonitorOutlined />,
      content: 'monitoring-troubleshooting-guide',
      tags: ['monitoring', 'troubleshooting', 'performance', 'alerts']
    }
  ];

  useEffect(() => {
    const loadDocumentation = async () => {
      setLoading(true);
      try {
        const docs: Record<string, string> = {};
        
        // Load overview content
        docs['overview'] = `# 🚀 CCXT Binance Trading App - Production Documentation

## 📋 Tổng quan hệ thống

Ứng dụng CCXT Binance Trading App là một nền tảng giao dịch cryptocurrency tiên tiến được xây dựng với Next.js 15, tích hợp với Binance API và các công nghệ hiện đại.

### 🏗️ Kiến trúc hệ thống

- **Frontend**: Next.js 15.2.4 với App Router
- **UI Framework**: Ant Design 5.26.3 + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Trading API**: CCXT 4.4.69 (Binance integration)
- **Charts**: LightWeight Charts 5.0.8
- **Real-time**: WebSocket connections
- **Language**: TypeScript 5

### 🔧 Core Services

#### TradingApiService
- Tích hợp Binance API với caching thông minh
- Rate limiting và error handling
- Support cả testnet và mainnet

#### NotificationService  
- Real-time notifications với WebSocket
- Browser notifications
- Email alerts (optional)

#### EnhancedTrailingStopService
- Advanced trailing stop strategies
- Multiple algorithm support
- Risk management integration

#### MarketAnalysisService
- Technical analysis tools
- Market alerts và signals
- Performance analytics

### 📊 Features chính

1. **Enhanced Trailing Stop System**
   - Multiple strategies: Percentage, ATR, Fibonacci, Smart Money
   - Real-time position monitoring
   - Advanced risk management

2. **Market Analysis**
   - Technical indicators
   - Market sentiment analysis
   - Price alerts và notifications

3. **Performance Dashboard**
   - Real-time P&L tracking
   - Win rate analytics
   - Risk metrics

4. **Risk Management**
   - Position sizing calculator
   - Max loss protection
   - Portfolio risk assessment

5. **Real-time Notifications**
   - WebSocket-based alerts
   - Browser notifications
   - System health monitoring

### 🔒 Security Features

- API key encryption
- Rate limiting
- Input validation
- HTTPS enforcement
- Row Level Security (RLS)

### 📈 Performance Optimizations

- API response caching
- Batch API calls
- Lazy loading
- Skeleton screens
- Memory management

---

**⚠️ Lưu ý quan trọng:**
- Ứng dụng hỗ trợ cả testnet và production
- Luôn test trên testnet trước khi deploy production
- Backup database thường xuyên
- Monitor API usage để tránh rate limits`;

        // Load actual markdown files
        const markdownFiles = [
          'production-setup-guide.md',
          'api-keys-external-services.md',
          'monitoring-troubleshooting-guide.md'
        ];

        for (const file of markdownFiles) {
          try {
            const response = await fetch(`/api/docs/${file}`);
            if (response.ok) {
              const content = await response.text();
              const fileKey = file.replace('.md', '');
              docs[fileKey] = content;
            } else {
              const fileKey = file.replace('.md', '');
              docs[fileKey] = `# ${fileKey}\n\nContent loading failed. Please check if the file exists.`;
            }
          } catch (error) {
            const fileKey = file.replace('.md', '');
            docs[fileKey] = `# ${fileKey}\n\nError loading content: ${error}`;
          }
        }

        setDocContent(docs);
      } catch (error) {
        console.error('Error loading documentation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocumentation();
  }, []);

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentSection = docSections.find(section => section.key === selectedDoc);
  const currentContent = docContent[currentSection?.content || 'overview'] || '';

  const menuItems = filteredSections.map(section => ({
    key: section.key,
    icon: section.icon,
    label: (
      <div>
        <div>{section.title}</div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {section.tags.map(tag => (
            <Tag key={tag}  style={{ margin: '1px' }}>
              {tag}
            </Tag>
          ))}
        </div>
      </div>
    )
  }));

  const sidebarContent = (
    <div style={{ padding: '16px 0' }}>
      <div style={{ padding: '0 16px 16px' }}>
        <Search
          placeholder="Tìm kiếm documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
        />
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[selectedDoc]}
        items={menuItems}
        onClick={({ key }) => {
          setSelectedDoc(key);
          setMobileMenuVisible(false);
        }}
        style={{ border: 'none' }}
      />
    </div>
  );

  return (
    <PageContainer>
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        {/* Desktop Sidebar */}
        <Sider
          width={320}
          style={{
            background: 'var(--card-bg)',
            borderRight: '1px solid var(--border)'
          }}
          className="desktop-sidebar"
        >
          {sidebarContent}
        </Sider>

        {/* Mobile Drawer */}
        <Drawer
          title="Documentation Menu"
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          width={320}
        >
          {sidebarContent}
        </Drawer>

        <Layout>
          <Content style={{ padding: '24px' }}>
            {/* Mobile Menu Button */}
            <div className="mobile-menu-button" style={{ marginBottom: '16px' }}>
              <Button
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuVisible(true)}
              >
                Menu
              </Button>
            </div>

            {/* Breadcrumb */}
            <Breadcrumb
              style={{ marginBottom: '24px' }}
              items={[
                {
                  title: (
                    <>
                      <HomeOutlined />
                      <span>Documentation</span>
                    </>
                  )
                },
                {
                  title: currentSection?.title
                }
              ]}
            />

            {/* Content */}
            <Card>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Text>Loading documentation...</Text>
                </div>
              ) : (
                <div className="documentation-content">
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        const inline = false;
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow as any}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => <Title level={1}>{children}</Title>,
                      h2: ({ children }) => <Title level={2}>{children}</Title>,
                      h3: ({ children }) => <Title level={3}>{children}</Title>,
                      h4: ({ children }) => <Title level={4}>{children}</Title>,
                      p: ({ children }) => <Paragraph>{children}</Paragraph>,
                      blockquote: ({ children }) => (
                        <Alert
                          message={children}
                          type="info"
                          showIcon
                          style={{ margin: '16px 0' }}
                        />
                      )
                    }}
                  >
                    {currentContent}
                  </ReactMarkdown>
                </div>
              )}
            </Card>

            {/* Quick Links */}
            <Card title="Quick Links" style={{ marginTop: '24px' }}>
              <Space wrap>
                <Button icon={<ApiOutlined />} href="/api/system-health" target="_blank">
                  System Health API
                </Button>
                <Button icon={<MonitorOutlined />} href="/production-hub" target="_blank">
                  Production Hub
                </Button>
                <Button icon={<SafetyOutlined />} href="/notifications" target="_blank">
                  Notifications
                </Button>
                <Button icon={<ToolOutlined />} href="/test-websocket" target="_blank">
                  WebSocket Test
                </Button>
              </Space>
            </Card>
          </Content>
        </Layout>
      </Layout>

      <style jsx global>{`
        .documentation-content {
          line-height: 1.8;
        }
        
        .documentation-content pre {
          background: #2d3748;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
        }
        
        .documentation-content code {
          background: var(--input-bg);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
        }
        
        .documentation-content blockquote {
          border-left: 4px solid var(--accent);
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
        }
        
        .documentation-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        
        .documentation-content th,
        .documentation-content td {
          border: 1px solid var(--border);
          padding: 8px 12px;
          text-align: left;
        }
        
        .documentation-content th {
          background: var(--secondary-bg);
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }

          .mobile-menu-button {
            display: block !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
