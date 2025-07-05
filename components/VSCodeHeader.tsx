// File: components/VSCodeHeader.tsx
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';

interface VSCodeHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function VSCodeHeader({ 
  title = "Crypto Trading Dashboard", 
  subtitle = "AI-powered trading environment with real-time analysis"
}: VSCodeHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="floating-card border-b bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50" style={{ borderRadius: 0, margin: 0 }}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Modern logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)] gradient-text">
                {title}
              </h1>
              <p className="text-sm text-[var(--muted)] hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation and Controls */}
        <div className="flex items-center space-x-4">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#dashboard" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105">
              Dashboard
            </a>
            <a href="#trading" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105">
              Trading
            </a>
            <a href="#analytics" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105">
              Analytics
            </a>
            <a href="#history" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-all duration-200 hover:scale-105">
              History
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="vscode-button-secondary p-2.5 rounded-xl hover:shadow-lg transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 bg-[var(--secondary-bg)] px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--success)]">Live</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden vscode-button-secondary p-2.5 rounded-xl"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-6 py-4 animate-fade-in bg-[var(--secondary-bg)]/50 backdrop-blur-sm">
          <nav className="flex flex-col space-y-3">
            <a href="#dashboard" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] py-2 px-3 rounded-lg hover:bg-[var(--hover)] transition-all">
              Dashboard
            </a>
            <a href="#trading" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] py-2 px-3 rounded-lg hover:bg-[var(--hover)] transition-all">
              Trading
            </a>
            <a href="#analytics" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] py-2 px-3 rounded-lg hover:bg-[var(--hover)] transition-all">
              Analytics
            </a>
            <a href="#history" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] py-2 px-3 rounded-lg hover:bg-[var(--hover)] transition-all">
              History
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
