// File: components/VSCodeLayout.tsx
'use client';

import { useState } from 'react';
import VSCodeHeader from './VSCodeHeader';
import VSCodeSidebar from './VSCodeSidebar';
import VSCodeStatusBar from './VSCodeStatusBar';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <VSCodeHeader />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex-shrink-0 border-r border-[var(--border)]">
          <VSCodeSidebar 
            currentSection={currentSection}
            onSectionChange={onSectionChange}
          />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[var(--background)]">
          <div className="h-full p-4">
            {children}
          </div>
        </main>
      </div>
      
      {/* Status Bar */}
      <VSCodeStatusBar />
    </div>
  );
}
