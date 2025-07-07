// File: components/PageContainer.tsx
'use client';

import React from 'react';
import { Layout, Typography } from 'antd';
import styles from './PageContainer.module.css';

const { Content } = Layout;
const { Title } = Typography;

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: number | string;
  padding?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Consistent page container component for all pages
 * Uses Ant Design Layout system for proper centering and responsive design
 */
export default function PageContainer({
  children,
  title,
  subtitle,
  maxWidth = 1400,
  padding = 24,
  className = '',
  style = {}
}: PageContainerProps) {
  const containerStyle: React.CSSProperties = {
    ...style
  };

  const contentClassName = `${styles.content} ${className}`;

  return (
    <Layout style={containerStyle} className={styles.container}>
      <Content className={contentClassName}>
        {title && (
          <div className={styles.titleContainer}>
            <Title level={2}>
              {title}
            </Title>
            {subtitle && (
              <Typography.Paragraph className={styles.subtitle}>
                {subtitle}
              </Typography.Paragraph>
            )}
          </div>
        )}
        {children}
      </Content>
    </Layout>
  );
}

/**
 * Compact version for pages that need less padding
 */
export function CompactPageContainer(props: PageContainerProps) {
  const { className = '', ...otherProps } = props;
  return (
    <Layout style={props.style} className={styles.container}>
      <Content className={`${styles.contentCompact} ${className}`}>
        {props.title && (
          <div className={styles.titleContainer}>
            <Title level={2}>
              {props.title}
            </Title>
            {props.subtitle && (
              <Typography.Paragraph className={styles.subtitle}>
                {props.subtitle}
              </Typography.Paragraph>
            )}
          </div>
        )}
        {props.children}
      </Content>
    </Layout>
  );
}

/**
 * Wide version for dashboard-style pages
 */
export function WidePageContainer(props: PageContainerProps) {
  const { className = '', ...otherProps } = props;
  return (
    <Layout style={props.style} className={styles.container}>
      <Content className={`${styles.contentWide} ${className}`}>
        {props.title && (
          <div className={styles.titleContainer}>
            <Title level={2}>
              {props.title}
            </Title>
            {props.subtitle && (
              <Typography.Paragraph className={styles.subtitle}>
                {props.subtitle}
              </Typography.Paragraph>
            )}
          </div>
        )}
        {props.children}
      </Content>
    </Layout>
  );
}
