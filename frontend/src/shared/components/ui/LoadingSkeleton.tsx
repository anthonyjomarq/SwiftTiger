import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'profile';
  lines?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({ 
  variant = 'text', 
  lines = 1, 
  height = 'h-4',
  className = ''
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  switch (variant) {
    case 'card':
      return (
        <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
          <div className={`${baseClasses} h-6 w-3/4`}></div>
          <div className={`${baseClasses} h-4 w-full`}></div>
          <div className={`${baseClasses} h-4 w-2/3`}></div>
          <div className="flex justify-between items-center pt-2">
            <div className={`${baseClasses} h-8 w-20`}></div>
            <div className={`${baseClasses} h-8 w-24`}></div>
          </div>
        </div>
      );

    case 'table':
      return (
        <tr className={className}>
          {Array.from({ length: 6 }).map((_, index) => (
            <td key={index} className="px-6 py-4">
              <div className={`${baseClasses} h-4 w-full`}></div>
            </td>
          ))}
        </tr>
      );

    case 'profile':
      return (
        <div className={`flex items-center space-x-3 ${className}`}>
          <div className={`${baseClasses} w-10 h-10 rounded-full`}></div>
          <div className="space-y-2 flex-1">
            <div className={`${baseClasses} h-4 w-32`}></div>
            <div className={`${baseClasses} h-3 w-24`}></div>
          </div>
        </div>
      );

    case 'text':
    default:
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, index) => (
            <div 
              key={index} 
              className={`${baseClasses} ${height} ${
                index === lines - 1 ? 'w-2/3' : 'w-full'
              }`}
            ></div>
          ))}
        </div>
      );
  }
}