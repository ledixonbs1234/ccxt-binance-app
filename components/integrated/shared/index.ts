// File: components/integrated/shared/index.ts

// Export all shared components
export { default as PageHeader } from './PageHeader';
export { default as LoadingSpinner, PageLoadingSpinner, CardLoadingSpinner, ButtonLoadingSpinner } from './LoadingSpinner';
export { default as ErrorBoundary, withErrorBoundary, ErrorDisplay } from './ErrorBoundary';

// Re-export commonly used components from existing codebase
export { default as LoadingOverlay } from '../../LoadingOverlay';
export { default as PageContainer } from '../../PageContainer';
export { default as HydrationSafeWrapper } from '../../HydrationSafeWrapper';
