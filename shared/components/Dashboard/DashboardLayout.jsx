import React from 'react';
import { cn } from '../../utils/cn';
import { useDashboard } from './DashboardProvider';
import { useResponsiveContext } from '../ResponsiveProvider';
import { Page, Section, Grid } from '../Layout';
import DashboardWidget from './DashboardWidget';

/**
 * Unified Dashboard Layout
 * Responsive layout that adapts to all user types and devices
 */

const DashboardLayout = ({ 
  className,
  headerContent,
  children,
  showCustomization = false,
  ...props 
}) => {
  const { 
    dashboardConfig, 
    widgets, 
    layout,
    isLoading 
  } = useDashboard();
  
  const { responsive } = useResponsiveContext();

  if (isLoading || !dashboardConfig) {
    return <DashboardSkeleton />;
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'stack':
        return 'space-y-6';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6';
      case 'grid':
      default:
        return '';
    }
  };

  const getGridConfig = () => {
    if (layout === 'stack') return { cols: 1 };
    
    return {
      cols: dashboardConfig.columns,
      responsive: true,
      gap: dashboardConfig.spacing === 'tight' ? 4 : 6,
    };
  };

  const renderWidgets = () => {
    if (layout === 'stack') {
      return (
        <div className="space-y-6">
          {widgets.map((widget) => (
            <DashboardWidget
              key={widget.id}
              {...widget}
              showCustomization={showCustomization}
            />
          ))}
        </div>
      );
    }

    if (layout === 'masonry') {
      return (
        <div className={getLayoutClasses()}>
          {widgets.map((widget) => (
            <div key={widget.id} className="break-inside-avoid mb-6">
              <DashboardWidget
                {...widget}
                showCustomization={showCustomization}
              />
            </div>
          ))}
        </div>
      );
    }

    // Grid layout
    return (
      <Grid {...getGridConfig()}>
        {widgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            {...widget}
            showCustomization={showCustomization}
          />
        ))}
      </Grid>
    );
  };

  return (
    <Page
      title={dashboardConfig.title}
      subtitle={dashboardConfig.subtitle}
      headerContent={headerContent}
      variant={responsive.getLayoutVariant()}
      className={cn('dashboard-container', className)}
      {...props}
    >
      {children || (
        <Section>
          {renderWidgets()}
        </Section>
      )}
    </Page>
  );
};

// Dashboard customization toolbar
export const DashboardToolbar = ({ 
  onLayoutChange,
  onAddWidget,
  onResetDefault,
  className 
}) => {
  const { layout, changeLayout, dashboardConfig } = useDashboard();
  const { responsive } = useResponsiveContext();

  const layoutOptions = [
    { value: 'grid', label: 'Grid', icon: '⊞' },
    { value: 'stack', label: 'Stack', icon: '☰' },
    { value: 'masonry', label: 'Masonry', icon: '⊟' },
  ];

  if (responsive.isMobile) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <select
          value={layout}
          onChange={(e) => {
            changeLayout(e.target.value);
            onLayoutChange?.(e.target.value);
          }}
          className="text-sm border border-st-border-primary rounded-md px-2 py-1"
        >
          {layoutOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {/* Layout Selector */}
      <div className="flex items-center space-x-1 bg-st-gray-100 rounded-lg p-1">
        {layoutOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              changeLayout(option.value);
              onLayoutChange?.(option.value);
            }}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-md transition-colors',
              layout === option.value
                ? 'bg-white text-st-primary-600 shadow-sm'
                : 'text-st-text-secondary hover:text-st-text-primary'
            )}
            title={`${option.label} Layout`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onAddWidget}
          className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-st-primary-600 hover:text-st-primary-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Widget</span>
        </button>

        <button
          onClick={onResetDefault}
          className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

// Loading skeleton for dashboard
const DashboardSkeleton = () => {
  const { responsive } = useResponsiveContext();
  
  const skeletonCards = responsive.isMobile ? 4 : 8;
  
  return (
    <Page variant={responsive.getLayoutVariant()}>
      <Section>
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="h-8 bg-st-gray-200 rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-4 bg-st-gray-200 rounded-lg w-1/2 animate-pulse"></div>
          
          {/* Widgets skeleton */}
          <Grid cols={responsive.isMobile ? 1 : 3} gap={6}>
            {[...Array(skeletonCards)].map((_, i) => (
              <div
                key={i}
                className="bg-st-gray-200 rounded-lg animate-pulse"
                style={{ height: `${Math.floor(Math.random() * 100) + 200}px` }}
              ></div>
            ))}
          </Grid>
        </div>
      </Section>
    </Page>
  );
};

// Dashboard container with provider
export const Dashboard = ({ 
  userRole, 
  interfaceType, 
  children, 
  customConfig,
  ...props 
}) => {
  return (
    <DashboardProvider 
      userRole={userRole} 
      interfaceType={interfaceType}
      customConfig={customConfig}
    >
      <DashboardLayout {...props}>
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
};

export default DashboardLayout;