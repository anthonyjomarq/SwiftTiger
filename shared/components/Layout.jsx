import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { NotificationBell, NotificationPanel } from './NotificationHub';

/**
 * Universal Layout System
 * Adaptive layouts for Admin, Mobile, and Customer interfaces
 */

// Main Layout Container
export const Layout = ({ 
  children, 
  variant = 'desktop', 
  className,
  ...props 
}) => {
  const layoutClasses = cn(
    'min-h-screen bg-st-bg-primary',
    variant === 'mobile' && 'pb-safe', // Safe area for mobile
    className
  );

  return (
    <div className={layoutClasses} {...props}>
      {children}
    </div>
  );
};

// Header component with responsive design
export const Header = ({
  title,
  subtitle,
  leftContent,
  rightContent,
  showNotifications = true,
  variant = 'desktop',
  className,
  ...props
}) => {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const headerClasses = cn(
    'bg-white border-b border-st-border-primary sticky top-0 z-40',
    variant === 'mobile' ? 'px-4 py-3' : 'px-6 py-4',
    className
  );

  return (
    <header className={headerClasses} {...props}>
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {leftContent}
          
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className={cn(
                'font-semibold text-st-text-primary truncate',
                variant === 'mobile' ? 'text-lg' : 'text-xl'
              )}>
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
        <div className="flex items-center space-x-3 relative">
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
          
          {rightContent}
        </div>
      </div>
    </header>
  );
};

// Sidebar for desktop interfaces
export const Sidebar = ({
  children,
  isOpen = true,
  onToggle,
  width = 'w-64',
  variant = 'default',
  className,
  ...props
}) => {
  const sidebarClasses = cn(
    'bg-white border-r border-st-border-primary transition-all duration-300',
    'flex flex-col',
    isOpen ? width : 'w-0 overflow-hidden',
    variant === 'overlay' && 'fixed inset-y-0 left-0 z-30',
    className
  );

  return (
    <aside className={sidebarClasses} {...props}>
      {children}
    </aside>
  );
};

// Main content area
export const Main = ({
  children,
  hasSidebar = false,
  sidebarWidth = 'w-64',
  variant = 'desktop',
  className,
  ...props
}) => {
  const mainClasses = cn(
    'flex-1 overflow-auto',
    variant === 'mobile' ? 'p-4' : 'p-6',
    className
  );

  return (
    <main className={mainClasses} {...props}>
      {children}
    </main>
  );
};

// Bottom navigation for mobile
export const BottomNavigation = ({
  items = [],
  activeItem,
  onItemChange,
  className,
  ...props
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-st-border-primary',
        'flex items-center justify-around py-2 px-1',
        'pb-safe', // Safe area for mobile
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemChange?.(item)}
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
            'min-w-0 flex-1',
            activeItem === item.id
              ? 'text-st-primary-600 bg-st-primary-50'
              : 'text-st-text-secondary'
          )}
        >
          <div className="text-xl mb-1">
            {item.icon}
          </div>
          <span className="text-xs font-medium truncate">
            {item.label}
          </span>
          {item.badge && (
            <span className="absolute -top-1 -right-1 bg-st-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Page container with responsive padding
export const Page = ({
  children,
  title,
  subtitle,
  headerContent,
  variant = 'desktop',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'space-y-6',
        variant === 'mobile' && 'pb-20', // Space for bottom nav
        className
      )}
      {...props}
    >
      {(title || subtitle || headerContent) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className={cn(
                'font-bold text-st-text-primary',
                variant === 'mobile' ? 'text-xl' : 'text-2xl'
              )}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-st-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerContent && (
            <div>
              {headerContent}
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

// Section container
export const Section = ({
  children,
  title,
  description,
  headerContent,
  variant = 'default',
  className,
  ...props
}) => {
  const sectionClasses = cn(
    'space-y-4',
    variant === 'card' && 'bg-white rounded-lg border border-st-border-primary p-6',
    variant === 'elevated' && 'bg-white rounded-lg shadow-st-shadow-md p-6',
    className
  );

  return (
    <section className={sectionClasses} {...props}>
      {(title || description || headerContent) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-st-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-st-text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
          {headerContent && (
            <div>
              {headerContent}
            </div>
          )}
        </div>
      )}
      
      {children}
    </section>
  );
};

// Grid system
export const Grid = ({
  children,
  cols = 1,
  gap = 4,
  responsive = true,
  className,
  ...props
}) => {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    responsive ? {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    }[cols] : `grid-cols-${cols}`,
    className
  );

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

// Flexible layout for different interfaces
export const AppLayout = ({
  children,
  variant = 'desktop',
  sidebar,
  header,
  bottomNav,
  className,
  ...props
}) => {
  if (variant === 'mobile') {
    return (
      <Layout variant="mobile" className={className} {...props}>
        {header}
        <Main variant="mobile">
          {children}
        </Main>
        {bottomNav}
      </Layout>
    );
  }

  if (variant === 'customer') {
    return (
      <Layout className={className} {...props}>
        {header}
        <div className="flex flex-1">
          <Main>
            {children}
          </Main>
        </div>
      </Layout>
    );
  }

  // Desktop admin layout
  return (
    <Layout className={className} {...props}>
      {header}
      <div className="flex flex-1">
        {sidebar}
        <Main hasSidebar={!!sidebar}>
          {children}
        </Main>
      </div>
    </Layout>
  );
};

// Container with max width and centering
export const Container = ({
  children,
  size = 'full',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Stack layout for vertical spacing
export const Stack = ({
  children,
  spacing = 4,
  align = 'stretch',
  className,
  ...props
}) => {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        `space-y-${spacing}`,
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Layout;