import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'medium',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium', 
    large: 'loading-spinner-large'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <div className="loading-slice"></div>
      <div className="loading-slice"></div>
      <div className="loading-slice"></div>
      <div className="loading-slice"></div>
      <div className="loading-slice"></div>
      <div className="loading-slice"></div>
    </div>
  );
}