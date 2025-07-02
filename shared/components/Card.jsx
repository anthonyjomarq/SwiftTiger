import React from 'react';
import { cn } from '../utils/cn';

/**
 * Universal Card Component
 * Flexible container component for all interfaces
 */

const cardVariants = {
  // Variant styles
  variant: {
    default: 'bg-white border border-st-border-primary',
    elevated: 'bg-white shadow-st-shadow-md',
    outlined: 'bg-transparent border-2 border-st-border-primary',
    filled: 'bg-st-gray-50',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
  },
  
  // Padding styles
  padding: {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  
  // Size styles
  size: {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'w-full',
  },
  
  // Interactive styles
  interactive: {
    true: 'cursor-pointer transition-all duration-200 hover:shadow-st-shadow-lg hover:-translate-y-0.5',
    false: '',
  },
};

const Card = React.forwardRef(({
  className,
  variant = 'default',
  padding = 'md',
  size = 'full',
  interactive = false,
  onClick,
  children,
  ...props
}, ref) => {
  const cardClasses = cn(
    // Base styles
    'rounded-lg overflow-hidden',
    
    // Variant styles
    cardVariants.variant[variant],
    
    // Padding styles
    cardVariants.padding[padding],
    
    // Size styles
    cardVariants.size[size],
    
    // Interactive styles
    cardVariants.interactive[interactive.toString()],
    
    // Custom classes
    className
  );

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// Card Header component
export const CardHeader = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('border-b border-st-border-primary px-4 py-3', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card Title component
export const CardTitle = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-st-text-primary', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

// Card Description component
export const CardDescription = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-st-text-secondary mt-1', className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

// Card Content component
export const CardContent = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('px-4 py-3', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Card Footer component
export const CardFooter = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('border-t border-st-border-primary px-4 py-3 bg-st-gray-50', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// Job Card - Specialized for job displays
export const JobCard = React.forwardRef(({
  job,
  onClick,
  showCustomer = true,
  showTechnician = true,
  showStatus = true,
  compact = false,
  className,
  ...props
}, ref) => {
  const statusColors = {
    pending: 'bg-st-warning-100 text-st-warning-800',
    in_progress: 'bg-st-info-100 text-st-info-800',
    completed: 'bg-st-success-100 text-st-success-800',
    cancelled: 'bg-st-error-100 text-st-error-800',
    on_hold: 'bg-st-warm-100 text-st-warm-800',
  };

  const statusIcons = {
    pending: '⏳',
    in_progress: '🔧',
    completed: '✅',
    cancelled: '❌',
    on_hold: '⏸️',
  };

  return (
    <Card
      ref={ref}
      variant="elevated"
      padding={compact ? 'sm' : 'md'}
      interactive={!!onClick}
      onClick={onClick}
      className={className}
      {...props}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-medium text-st-text-primary truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {job.title}
            </h4>
            {job.description && !compact && (
              <p className="text-sm text-st-text-secondary mt-1 line-clamp-2">
                {job.description}
              </p>
            )}
          </div>
          
          {showStatus && (
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2',
              statusColors[job.status] || statusColors.pending
            )}>
              <span className="mr-1">{statusIcons[job.status] || '📝'}</span>
              {job.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Details */}
        {!compact && (
          <div className="space-y-2 text-sm text-st-text-secondary">
            {showCustomer && job.customer_name && (
              <div className="flex items-center">
                <span className="mr-2">👤</span>
                <span>Customer: {job.customer_name}</span>
              </div>
            )}
            
            {showTechnician && job.technician_name && (
              <div className="flex items-center">
                <span className="mr-2">🔧</span>
                <span>Technician: {job.technician_name}</span>
              </div>
            )}
            
            {job.scheduled_date && (
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                <span>
                  Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}
                  {job.scheduled_time && ` at ${job.scheduled_time}`}
                </span>
              </div>
            )}
            
            {job.priority && job.priority !== 'normal' && (
              <div className="flex items-center">
                <span className="mr-2">⚡</span>
                <span className="capitalize">Priority: {job.priority}</span>
              </div>
            )}
          </div>
        )}

        {/* Compact details */}
        {compact && (
          <div className="flex items-center justify-between text-xs text-st-text-secondary">
            {showCustomer && job.customer_name && (
              <span className="truncate">👤 {job.customer_name}</span>
            )}
            {job.scheduled_date && (
              <span>📅 {new Date(job.scheduled_date).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

JobCard.displayName = 'JobCard';

export default Card;