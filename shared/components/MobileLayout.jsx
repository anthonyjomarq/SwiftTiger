import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useResponsive, useOrientation } from '../hooks/useResponsive';
import { NotificationBell, NotificationPanel } from './NotificationHub';

/**
 * Mobile-First Layout Components
 * Optimized for technician field work and mobile users
 */

// Mobile App Shell
export const MobileAppShell = ({ 
  children,
  header,
  bottomNav,
  showHeader = true,
  showBottomNav = true,
  className,
  ...props 
}) => {
  const orientation = useOrientation();
  
  return (
    <div 
      className={cn(
        'min-h-screen bg-st-bg-primary flex flex-col',
        'pt-safe', // Safe area top
        orientation === 'landscape' && 'landscape:pt-2',
        className
      )}
      {...props}
    >
      {showHeader && header}
      
      <main className={cn(
        'flex-1 overflow-auto',
        showBottomNav && 'pb-safe mb-16' // Space for bottom nav + safe area
      )}>
        {children}
      </main>
      
      {showBottomNav && bottomNav}
    </div>
  );
};

// Mobile Header
export const MobileHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBack = false,
  showSearch = false,
  showNotifications = true,
  onBack,
  onSearch,
  searchValue,
  onSearchChange,
  className,
  ...props
}) => {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const BackButton = () => (
    <button
      onClick={onBack}
      className="p-2 -ml-2 text-st-text-primary hover:bg-st-gray-100 rounded-lg transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );

  const SearchButton = () => (
    <button
      onClick={() => setShowSearchBar(!showSearchBar)}
      className="p-2 text-st-text-secondary hover:text-st-text-primary transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );

  return (
    <>
      <header 
        className={cn(
          'bg-white border-b border-st-border-primary sticky top-0 z-40',
          'px-4 py-3',
          className
        )}
        {...props}
      >
        {!showSearchBar ? (
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {showBack && <BackButton />}
              {leftAction}
              
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-lg font-semibold text-st-text-primary truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-st-text-secondary truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2 relative">
              {showSearch && <SearchButton />}
              
              {showNotifications && (
                <div className="relative">
                  <NotificationBell
                    onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  />
                  <NotificationPanel
                    isOpen={showNotificationPanel}
                    onClose={() => setShowNotificationPanel(false)}
                  />
                </div>
              )}
              
              {rightAction}
            </div>
          </div>
        ) : (
          // Search mode
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSearchBar(false)}
              className="p-1 text-st-text-secondary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <input
              type="search"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="flex-1 px-3 py-2 bg-st-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-st-primary-500"
              autoFocus
            />
          </div>
        )}
      </header>
    </>
  );
};

// Mobile Bottom Navigation
export const MobileBottomNav = ({
  items = [],
  activeItem,
  onItemChange,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-st-border-primary',
        'flex items-center justify-around',
        'pb-safe pt-2', // Safe area bottom + padding top
        variant === 'elevated' && 'shadow-st-shadow-lg',
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemChange?.(item)}
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
            'min-w-0 flex-1 relative',
            activeItem === item.id
              ? 'text-st-primary-600 bg-st-primary-50 scale-105'
              : 'text-st-text-secondary hover:text-st-text-primary hover:bg-st-gray-50'
          )}
        >
          <div className="text-xl mb-1">
            {typeof item.icon === 'string' ? item.icon : item.icon}
          </div>
          <span className="text-xs font-medium truncate max-w-full">
            {item.label}
          </span>
          {item.badge && (
            <span className="absolute -top-1 -right-1 bg-st-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Mobile Card optimized for touch
export const MobileCard = ({
  children,
  onClick,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const cardVariants = {
    default: 'bg-white border border-st-border-primary',
    elevated: 'bg-white shadow-st-shadow-sm',
    flat: 'bg-st-gray-50',
  };

  const paddingVariants = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        cardVariants[variant],
        paddingVariants[padding],
        onClick && 'cursor-pointer active:scale-98 hover:shadow-st-shadow-md',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile List Item
export const MobileListItem = ({
  children,
  leftContent,
  rightContent,
  onClick,
  subtitle,
  divider = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center space-x-3 py-3 px-4',
        'transition-colors duration-150',
        onClick && 'cursor-pointer hover:bg-st-gray-50 active:bg-st-gray-100',
        divider && 'border-b border-st-border-primary last:border-b-0',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {leftContent && (
        <div className="flex-shrink-0">
          {leftContent}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-st-text-primary truncate">
          {children}
        </div>
        {subtitle && (
          <div className="text-xs text-st-text-secondary truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
      
      {onClick && !rightContent && (
        <div className="flex-shrink-0 text-st-text-tertiary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Mobile Floating Action Button
export const MobileFAB = ({
  children,
  onClick,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  const positions = {
    'bottom-right': 'fixed bottom-20 right-4',
    'bottom-left': 'fixed bottom-20 left-4',
    'bottom-center': 'fixed bottom-20 left-1/2 transform -translate-x-1/2',
  };

  const sizes = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-16 h-16 text-lg',
  };

  const variants = {
    primary: 'bg-st-primary-500 hover:bg-st-primary-600 text-white',
    secondary: 'bg-white hover:bg-st-gray-50 text-st-text-primary border border-st-border-primary',
    accent: 'bg-st-accent-500 hover:bg-st-accent-600 text-white',
  };

  return (
    <button
      className={cn(
        'rounded-full shadow-st-shadow-lg',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'z-40',
        positions[position],
        sizes[size],
        variants[variant],
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile Pull to Refresh
export const MobilePullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  className,
  ...props
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - 60);
      setPullDistance(Math.min(distance, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !refreshing) {
      onRefresh?.();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'text-st-text-secondary transition-all duration-200',
          'transform -translate-y-full',
          (isPulling || refreshing) && 'translate-y-0'
        )}
        style={{ height: Math.max(pullDistance, refreshing ? 60 : 0) }}
      >
        {refreshing ? (
          <div className="animate-spin w-5 h-5 border-2 border-st-primary-500 border-t-transparent rounded-full" />
        ) : (
          <div className="text-sm">
            {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

// Mobile Swipe Actions
export const MobileSwipeActions = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  className,
  ...props
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTrackingSwipe, setIsTrackingSwipe] = useState(false);

  // Touch handling would be implemented here for swipe gestures
  // This is a simplified version for the foundation

  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.onPress?.()}
              className={cn(
                'flex items-center justify-center px-4',
                action.color === 'danger' && 'bg-st-error-500 text-white',
                action.color === 'warning' && 'bg-st-warning-500 text-white',
                action.color === 'success' && 'bg-st-success-500 text-white',
                !action.color && 'bg-st-gray-500 text-white'
              )}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.onPress?.()}
              className={cn(
                'flex items-center justify-center px-4',
                action.color === 'danger' && 'bg-st-error-500 text-white',
                action.color === 'warning' && 'bg-st-warning-500 text-white',
                action.color === 'success' && 'bg-st-success-500 text-white',
                !action.color && 'bg-st-gray-500 text-white'
              )}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Main content */}
      <div
        className="relative bg-white z-10 transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileAppShell;