'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component to prevent hydration mismatch errors
 * Renders fallback content during SSR and actual content after hydration
 */
export default function HydrationSafeWrapper({ 
  children, 
  fallback = null 
}: HydrationSafeWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if component is running on client side
 * Useful for conditional rendering to prevent hydration mismatches
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
