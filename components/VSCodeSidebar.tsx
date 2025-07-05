// File: components/VSCodeSidebar.tsx
'use client';

import { useState } from 'react';
import { useTrading } from '../contexts/TradingContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
}

interface VSCodeSidebarProps {
  onSectionChange?: (section: string) => void;
  currentSection?: string;
}

export default function VSCodeSidebar({ 
  onSectionChange, 
  currentSection = 'dashboard' 
}: VSCodeSidebarProps) {
  const { coinsData } = useTrading();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      active: currentSection === 'dashboard'
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      active: currentSection === 'trading'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      active: currentSection === 'portfolio'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      active: currentSection === 'analytics'
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      active: currentSection === 'history'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      active: currentSection === 'settings'
    }
  ];

  const handleItemClick = (itemId: string) => {
    onSectionChange?.(itemId);
  };

  return (
    <div className={`vscode-panel transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} h-full`} style={{ borderRadius: 0 }}>
      {/* Sidebar Header */}
      <div className="vscode-panel-header flex items-center justify-between">
        <span className={`font-semibold ${collapsed ? 'hidden' : 'block'}`}>
          Navigation
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="vscode-button-secondary p-1 rounded"
          aria-label="Toggle sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="vscode-panel-content p-0">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                item.active
                  ? 'bg-[var(--accent)] text-white shadow-md'
                  : 'text-[var(--foreground)] hover:bg-[var(--sidebar)] hover:text-[var(--accent)]'
              }`}
            >
              <span className="flex-shrink-0">
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="vscode-badge text-xs">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Market Status */}
        {!collapsed && (
          <div className="mt-8 px-3">
            <div className="vscode-card">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Market Status</h4>
              <div className="space-y-2">
                {Object.entries(coinsData).slice(0, 3).map(([symbol, data]) => (
                  <div key={symbol} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">{symbol}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-[var(--foreground)]">
                        ${data.price.toFixed(2)}
                      </span>
                      <span className={`text-xs font-medium ${
                        data.change24h >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                      }`}>
                        {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!collapsed && (
          <div className="mt-6 px-3">
            <div className="space-y-2">
              <button className="vscode-button w-full justify-center text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Trade
              </button>
              <button className="vscode-button-secondary w-full justify-center text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
