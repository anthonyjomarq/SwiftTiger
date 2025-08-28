import React, { Suspense } from 'react';
import { Helix } from 'ldrs/react';
import 'ldrs/helix';

// Loading component for lazy-loaded routes
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Helix size="45" speed="2.5" color="#3b82f6" />
      <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
    </div>
  </div>
);

// Component loader for smaller components
const ComponentLoader: React.FC<{ className?: string }> = ({ className = "h-32" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Helix size="32" speed="2.5" color="#3b82f6" />
  </div>
);

// Error boundary for lazy-loaded components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  LazyErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Failed to load this component. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for lazy-loaded pages
export const withLazyLoading = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  fallback: React.ComponentType = PageLoader
) => {
  const WrappedComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return (props: P) => (
    <LazyErrorBoundary>
      <Suspense fallback={React.createElement(fallback)}>
        <WrappedComponent {...(props as any)} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Lazy-loaded page components with code splitting
export const LazyDashboard = React.lazy(() => 
  import('../pages/Dashboard').then(module => ({ default: module.default }))
);

export const LazyJobs = React.lazy(() => 
  import('../pages/Jobs').then(module => ({ default: module.default }))
);


export const LazyCustomers = React.lazy(() => 
  import('../pages/Customers').then(module => ({ default: module.default }))
);


export const LazyUsers = React.lazy(() => 
  import('../pages/Users').then(module => ({ default: module.default }))
);



// Lazy-loaded chart components
export const LazyJobStatusChart: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/Charts/JobStatusChart')
);

export const LazyJobTrendChart: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/Charts/JobTrendChart')
);

export const LazyTechnicianWorkloadChart: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/Charts/TechnicianWorkloadChart')
);

// Lazy-loaded enhanced components
export const LazyEnhancedJobDetails: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/EnhancedJobDetails')
);

export const LazyPhotoCapture: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/PhotoCapture')
);

export const LazyDigitalSignature: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(() => 
  import('../components/DigitalSignature')
);

// Wrapper components with suspense
export const DashboardWithSuspense: React.FC = () => (
  <LazyErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <LazyDashboard />
    </Suspense>
  </LazyErrorBoundary>
);

export const JobsWithSuspense: React.FC = () => (
  <LazyErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <LazyJobs />
    </Suspense>
  </LazyErrorBoundary>
);

export const CustomersWithSuspense: React.FC = () => (
  <LazyErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <LazyCustomers />
    </Suspense>
  </LazyErrorBoundary>
);

export const UsersWithSuspense: React.FC = () => (
  <LazyErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <LazyUsers />
    </Suspense>
  </LazyErrorBoundary>
);


// Chart wrapper with suspense and error handling
export const ChartWithSuspense: React.FC<{
  ChartComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: any;
  fallback?: React.ComponentType<any>;
}> = ({ ChartComponent, props = {}, fallback: Fallback = ComponentLoader }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<Fallback />}>
      <ChartComponent {...props} />
    </Suspense>
  </LazyErrorBoundary>
);

export { PageLoader, ComponentLoader, LazyErrorBoundary };
export default withLazyLoading;