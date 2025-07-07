import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Lazy load heavy components
export const LazyCandlestickChart = lazy(() => import('../CandlestickChart'));
export const LazyOrderHistory = lazy(() => import('../OrderHistory'));
export const LazyTrailingStopMonitor = lazy(() => import('../TrailingStopMonitor'));
export const LazySimplePriceChart = lazy(() => import('../SimplePriceChart'));

// Loading component for lazy components
const LazyLoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: 200,
    flexDirection: 'column',
    gap: 16
  }}>
    <Spin 
      indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
      size="large" 
    />
    <span style={{ color: '#666', fontSize: 14 }}>{message}</span>
  </div>
);

// Wrapper components with Suspense
export const LazyChartWrapper = ({ ...props }) => (
  <Suspense fallback={<LazyLoadingSpinner message="Loading chart..." />}>
    <LazyCandlestickChart {...props} />
  </Suspense>
);

export const LazyOrderHistoryWrapper = ({ ...props }) => (
  <Suspense fallback={<LazyLoadingSpinner message="Loading order history..." />}>
    <LazyOrderHistory {...props} />
  </Suspense>
);

export const LazyTrailingStopWrapper = ({ ...props }) => (
  <Suspense fallback={<LazyLoadingSpinner message="Loading trailing stops..." />}>
    <LazyTrailingStopMonitor {...props} />
  </Suspense>
);

export const LazyPriceChartWrapper = ({ ...props }) => (
  <Suspense fallback={<LazyLoadingSpinner message="Loading price chart..." />}>
    <LazySimplePriceChart {...props} />
  </Suspense>
);

// Intersection Observer hook for lazy loading on scroll
import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { ref, isIntersecting, hasIntersected };
};

// Lazy loading container component
export const LazyContainer = ({ 
  children, 
  fallback = <LazyLoadingSpinner />,
  once = true 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  once?: boolean;
}) => {
  const { ref, isIntersecting, hasIntersected } = useIntersectionObserver();
  
  const shouldRender = once ? hasIntersected : isIntersecting;

  return (
    <div ref={ref}>
      {shouldRender ? children : fallback}
    </div>
  );
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered ${renderCount.current} times (${renderTime}ms)`);
    }
    
    startTime.current = Date.now();
  });

  return renderCount.current;
};
