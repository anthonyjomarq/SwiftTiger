import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useDashboard } from './DashboardProvider';
import { useResponsiveContext } from '../ResponsiveProvider';

/**
 * Universal Dashboard Widget
 * Flexible widget component that adapts to different data types and layouts
 */

const DashboardWidget = ({
  id,
  type,
  title,
  subtitle,
  data,
  size = 'medium',
  showCustomization = false,
  refreshable = false,
  onRefresh,
  className,
  ...props
}) => {
  const { removeWidget, updateWidget } = useDashboard();
  const { responsive } = useResponsiveContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getSizeClasses = () => {
    if (responsive.isMobile) return 'col-span-1';
    
    const sizeMap = {
      small: 'col-span-1',
      medium: 'col-span-1 md:col-span-2',
      large: 'col-span-1 md:col-span-2 lg:col-span-3',
      full: 'col-span-full',
    };
    
    return sizeMap[size] || sizeMap.medium;
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsLoading(true);
      try {
        await onRefresh();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemove = () => {
    removeWidget(id);
    setShowMenu(false);
  };

  const handleResize = (newSize) => {
    updateWidget(id, { size: newSize });
    setShowMenu(false);
  };

  const renderWidgetContent = () => {
    switch (type) {
      case 'stats':
        return <StatsWidget data={data} />;
      case 'chart':
        return <ChartWidget data={data} />;
      case 'list':
        return <ListWidget data={data} />;
      case 'table':
        return <TableWidget data={data} />;
      case 'progress':
        return <ProgressWidget data={data} />;
      case 'activity':
        return <ActivityWidget data={data} />;
      case 'system':
        return <SystemWidget data={data} />;
      case 'map':
        return <MapWidget data={data} />;
      case 'calendar':
        return <CalendarWidget data={data} />;
      case 'metric':
        return <MetricWidget data={data} />;
      default:
        return <GenericWidget data={data} />;
    }
  };

  const WidgetMenu = () => (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-st-text-tertiary hover:text-st-text-secondary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-st-border-primary z-20">
            <div className="py-1">
              {refreshable && (
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-left text-sm text-st-text-primary hover:bg-st-gray-50 flex items-center space-x-2"
                >
                  <svg className={cn("w-4 h-4", isLoading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              )}
              
              <div className="px-3 py-2 text-xs font-medium text-st-text-secondary border-t border-st-border-primary">
                Size
              </div>
              
              {['small', 'medium', 'large'].map((sizeOption) => (
                <button
                  key={sizeOption}
                  onClick={() => handleResize(sizeOption)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-st-gray-50 capitalize",
                    size === sizeOption ? 'text-st-primary-600 bg-st-primary-50' : 'text-st-text-primary'
                  )}
                >
                  {sizeOption}
                </button>
              ))}
              
              <hr className="my-1" />
              
              <button
                onClick={handleRemove}
                className="w-full px-3 py-2 text-left text-sm text-st-error-600 hover:bg-st-error-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={cn(getSizeClasses(), className)} {...props}>
      <Card variant="elevated" className="h-full">
        {(title || subtitle || showCustomization) && (
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              {title && (
                <CardTitle className="text-base font-medium">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-sm text-st-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {refreshable && !showCustomization && (
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-1 text-st-text-tertiary hover:text-st-text-secondary transition-colors"
                >
                  <svg className={cn("w-4 h-4", isLoading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              
              {showCustomization && <WidgetMenu />}
            </div>
          </CardHeader>
        )}
        
        <CardContent className={cn("flex-1", !title && !subtitle && "pt-6")}>
          {renderWidgetContent()}
        </CardContent>
      </Card>
    </div>
  );
};

// Stats Widget - Grid of statistics
const StatsWidget = ({ data = [] }) => {
  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'rating':
        return `${value}/5`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((stat, index) => (
        <div key={index} className="text-center">
          <div className={`text-2xl mb-2 text-st-${stat.color || 'primary'}-600`}>
            {stat.icon}
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold text-st-${stat.color || 'primary'}-600`}>
              {formatValue(stat.value || 0, stat.format)}
            </div>
            <div className="text-xs text-st-text-secondary font-medium">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart Widget - Placeholder for charts
const ChartWidget = ({ data }) => (
  <div className="h-64 bg-st-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center text-st-text-secondary">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">Chart visualization</p>
    </div>
  </div>
);

// List Widget - Simple list display
const ListWidget = ({ data = [] }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={index} className="flex items-center justify-between p-2 bg-st-gray-50 rounded-lg">
        <span className="text-sm font-medium">{item.label}</span>
        <span className="text-sm text-st-text-secondary">{item.value}</span>
      </div>
    ))}
  </div>
);

// Progress Widget - Progress indicators
const ProgressWidget = ({ data = [] }) => (
  <div className="space-y-4">
    {data.map((item, index) => (
      <div key={index}>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{item.label}</span>
          <span className="text-st-text-secondary">{item.value}%</span>
        </div>
        <div className="w-full bg-st-gray-200 rounded-full h-2">
          <div 
            className={`bg-st-${item.color || 'primary'}-500 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${item.value || 0}%` }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);

// Activity Widget - Activity feed
const ActivityWidget = ({ data = [] }) => (
  <div className="space-y-3 max-h-64 overflow-y-auto">
    {data.map((activity, index) => (
      <div key={index} className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full bg-st-${activity.type || 'info'}-500 mt-2 flex-shrink-0`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-st-text-primary">{activity.message}</p>
          <p className="text-xs text-st-text-secondary">{activity.timestamp}</p>
        </div>
      </div>
    ))}
  </div>
);

// System Widget - System metrics
const SystemWidget = ({ data = {} }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4 text-center">
      <div>
        <div className="text-lg font-bold text-st-success-600">
          {data.uptime || '99.9%'}
        </div>
        <div className="text-xs text-st-text-secondary">Uptime</div>
      </div>
      <div>
        <div className="text-lg font-bold text-st-info-600">
          {data.load || '2.1'}
        </div>
        <div className="text-xs text-st-text-secondary">Load Avg</div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>CPU</span>
        <span>{data.cpu || 45}%</span>
      </div>
      <div className="w-full bg-st-gray-200 rounded-full h-2">
        <div 
          className="bg-st-info-500 h-2 rounded-full"
          style={{ width: `${data.cpu || 45}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm">
        <span>Memory</span>
        <span>{data.memory || 62}%</span>
      </div>
      <div className="w-full bg-st-gray-200 rounded-full h-2">
        <div 
          className="bg-st-warning-500 h-2 rounded-full"
          style={{ width: `${data.memory || 62}%` }}
        ></div>
      </div>
    </div>
  </div>
);

// Map Widget - Placeholder for map
const MapWidget = ({ data }) => (
  <div className="h-64 bg-st-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center text-st-text-secondary">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      <p className="text-sm">Map view</p>
    </div>
  </div>
);

// Table Widget
const TableWidget = ({ data = { headers: [], rows: [] } }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-st-border-primary">
          {data.headers.map((header, index) => (
            <th key={index} className="text-left py-2 font-medium text-st-text-secondary">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, index) => (
          <tr key={index} className="border-b border-st-border-primary last:border-b-0">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="py-2 text-st-text-primary">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Calendar Widget
const CalendarWidget = ({ data }) => (
  <div className="h-64 bg-st-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center text-st-text-secondary">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm">Calendar view</p>
    </div>
  </div>
);

// Metric Widget - Single large metric
const MetricWidget = ({ data = {} }) => (
  <div className="text-center py-8">
    <div className={`text-4xl font-bold text-st-${data.color || 'primary'}-600 mb-2`}>
      {data.value || '0'}
    </div>
    <div className="text-sm text-st-text-secondary">
      {data.label || 'Metric'}
    </div>
    {data.change && (
      <div className={`text-xs mt-1 ${data.change > 0 ? 'text-st-success-600' : 'text-st-error-600'}`}>
        {data.change > 0 ? '↗' : '↘'} {Math.abs(data.change)}%
      </div>
    )}
  </div>
);

// Generic Widget - Fallback
const GenericWidget = ({ data }) => (
  <div className="h-32 bg-st-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center text-st-text-secondary">
      <div className="text-sm">Generic Widget</div>
      <div className="text-xs mt-1">No specific renderer</div>
    </div>
  </div>
);

export default DashboardWidget;