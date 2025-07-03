import React from 'react';
import { cn } from '../utils/cn';

/**
 * Universal Button Component
 * Works across Admin, Mobile, and Customer interfaces
 */

const buttonVariants = {
  // Variant styles
  variant: {
    primary: 'bg-st-primary-500 text-white hover:bg-st-primary-600 focus:ring-st-primary-500',
    secondary: 'bg-st-gray-100 text-st-gray-900 hover:bg-st-gray-200 focus:ring-st-gray-500',
    success: 'bg-st-success-500 text-white hover:bg-st-success-600 focus:ring-st-success-500',
    warning: 'bg-st-warning-500 text-white hover:bg-st-warning-600 focus:ring-st-warning-500',
    error: 'bg-st-error-500 text-white hover:bg-st-error-600 focus:ring-st-error-500',
    info: 'bg-st-info-500 text-white hover:bg-st-info-600 focus:ring-st-info-500',
    ghost: 'text-st-gray-600 hover:bg-st-gray-100 hover:text-st-gray-900',
    link: 'text-st-primary-500 underline-offset-4 hover:underline',
    outline: 'border border-st-border-primary bg-transparent hover:bg-st-gray-50 text-st-gray-900',
  },
  
  // Size styles
  size: {
    xs: 'px-2 py-1 text-xs rounded-md',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-lg',
    icon: 'p-2 rounded-md',
  },
  
  // Loading state
  loading: {
    true: 'cursor-not-allowed opacity-50',
    false: '',
  },
  
  // Disabled state
  disabled: {
    true: 'cursor-not-allowed opacity-50',
    false: 'cursor-pointer',
  },
  
  // Full width
  fullWidth: {
    true: 'w-full',
    false: '',
  },
};

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    
    // Variant styles
    buttonVariants.variant[variant],
    
    // Size styles
    buttonVariants.size[size],
    
    // State styles
    buttonVariants.loading[loading.toString()],
    buttonVariants.disabled[disabled.toString()],
    buttonVariants.fullWidth[fullWidth.toString()],
    
    // Custom classes
    className
  );

  return (
    <button
      ref={ref}
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Button group for related actions
export const ButtonGroup = ({ children, className, orientation = 'horizontal' }) => {
  const groupClasses = cn(
    'inline-flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    '[&>button]:rounded-none',
    '[&>button:first-child]:rounded-l-md',
    '[&>button:last-child]:rounded-r-md',
    orientation === 'vertical' && [
      '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-b-none',
      '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-t-none',
    ],
    '[&>button:not(:first-child)]:border-l-0',
    orientation === 'vertical' && '[&>button:not(:first-child)]:border-t-0',
    className
  );

  return (
    <div className={groupClasses} role="group">
      {children}
    </div>
  );
};

// Icon button variant
export const IconButton = React.forwardRef(({
  icon,
  'aria-label': ariaLabel,
  tooltip,
  ...props
}, ref) => (
  <Button
    ref={ref}
    size="icon"
    aria-label={ariaLabel}
    title={tooltip || ariaLabel}
    {...props}
  >
    {icon}
  </Button>
));

IconButton.displayName = 'IconButton';

// Floating Action Button for mobile interfaces
export const FloatingActionButton = React.forwardRef(({
  className,
  position = 'bottom-right',
  ...props
}, ref) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
  };

  return (
    <Button
      ref={ref}
      className={cn(
        'rounded-full shadow-lg hover:shadow-xl',
        'w-14 h-14',
        positionClasses[position],
        className
      )}
      {...props}
    />
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

export { Button };
export default Button;