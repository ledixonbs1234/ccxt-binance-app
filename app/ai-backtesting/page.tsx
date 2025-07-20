'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
// import AIBacktestingPanel from '@/components/AIBacktestingPanel';

export default function AIBacktestingPage() {
  return (
    <ConfigProvider locale={viVN}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '100px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</h1>
            <h2 style={{ color: '#1890ff', marginBottom: '16px' }}>AI Trading Backtesting</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Hệ thống test giao dịch AI với dữ liệu lịch sử từ 2020-2024
            </p>
            <p style={{ color: '#999' }}>
              Trang này đang được phát triển. Vui lòng quay lại sau.
            </p>
            <div style={{ marginTop: '32px' }}>
              <a href="/ai-backtest-demo" style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#1890ff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                marginRight: '16px'
              }}>
                🚀 Xem Demo Hoạt Động
              </a>
              <a href="/test-ai-backtest" style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#52c41a',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                marginRight: '16px'
              }}>
                Trang Test Đơn Giản
              </a>
              <a href="/" style={{
                display: 'inline-block',
                padding: '12px 24px',
                border: '1px solid #d9d9d9',
                color: '#666',
                textDecoration: 'none',
                borderRadius: '6px'
              }}>
                Về trang chính
              </a>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
