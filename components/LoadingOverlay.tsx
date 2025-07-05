'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  delay?: number; // Delay before showing overlay to prevent flickering
}

export default function LoadingOverlay({ 
  isLoading, 
  children, 
  message = "Đang tải...",
  delay = 300 // 300ms delay to prevent flickering
}: LoadingOverlayProps) {
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      // Show overlay after delay to prevent flickering for quick loads
      timeoutId = setTimeout(() => {
        setShouldShowOverlay(true);
      }, delay);
    } else {
      // Hide immediately when not loading
      setShouldShowOverlay(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, delay]);

  return (
    <div className="relative">
      <div className={shouldShowOverlay ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
      
      {shouldShowOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
          <div className="flex items-center space-x-3 bg-card px-4 py-3 rounded-lg shadow-lg border border-border">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium text-foreground">
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
