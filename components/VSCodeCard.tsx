// File: components/VSCodeCard.tsx
'use client';

import { ReactNode, useState } from 'react';

interface VSCodeCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export default function VSCodeCard({
  title,
  subtitle,
  children,
  className = '',
  headerActions,
  collapsible = false,
  defaultCollapsed = false,
  icon,
  variant = 'default'
}: VSCodeCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const variantClasses = {
    default: '',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    error: 'border-red-200 bg-red-50/50'
  };

  return (
    <div className={`vscode-card ${variantClasses[variant]} ${className}`}>
      {title && (
        <div className="vscode-card-header flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {collapsible && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="vscode-button-secondary p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {icon && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                {icon}
              </div>
            )}
            <div>
              <h3 className="vscode-card-title">{title}</h3>
              {subtitle && (
                <p className="vscode-card-subtitle">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {(!collapsible || !isCollapsed) && (
        <div className="vscode-card-content">
          {children}
        </div>
      )}
    </div>
  );
}
