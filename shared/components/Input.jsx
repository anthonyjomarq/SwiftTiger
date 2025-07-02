import React from 'react';
import { cn } from '../utils/cn';

/**
 * Universal Input Component
 * Supports text, email, password, number, search, etc.
 */

const inputVariants = {
  // Size styles
  size: {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-3 py-2 text-sm rounded-md',
    lg: 'px-4 py-3 text-base rounded-lg',
  },
  
  // State styles
  state: {
    default: 'border-st-border-primary focus:border-st-primary-500 focus:ring-st-primary-500',
    error: 'border-st-error-500 focus:border-st-error-500 focus:ring-st-error-500',
    success: 'border-st-success-500 focus:border-st-success-500 focus:ring-st-success-500',
    warning: 'border-st-warning-500 focus:border-st-warning-500 focus:ring-st-warning-500',
  },
  
  // Disabled state
  disabled: {
    true: 'cursor-not-allowed opacity-50 bg-st-gray-100',
    false: 'bg-white',
  },
  
  // Full width
  fullWidth: {
    true: 'w-full',
    false: '',
  },
};

const Input = React.forwardRef(({
  className,
  type = 'text',
  size = 'md',
  state = 'default',
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  error,
  success,
  warning,
  placeholder,
  ...props
}, ref) => {
  // Determine state based on props
  const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;

  const inputClasses = cn(
    // Base styles
    'border transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'placeholder:text-st-text-tertiary',
    'disabled:cursor-not-allowed disabled:opacity-50',
    
    // Size styles
    inputVariants.size[size],
    
    // State styles
    inputVariants.state[currentState],
    
    // Disabled styles
    inputVariants.disabled[disabled.toString()],
    
    // Full width
    inputVariants.fullWidth[fullWidth.toString()],
    
    // Icon padding adjustments
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    
    // Custom classes
    className
  );

  const hasIcons = leftIcon || rightIcon;

  if (hasIcons) {
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-st-text-tertiary">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="text-st-text-tertiary">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      className={inputClasses}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
});

Input.displayName = 'Input';

// Label component
export const Label = React.forwardRef(({
  className,
  required = false,
  children,
  ...props
}, ref) => (
  <label
    ref={ref}
    className={cn(
      'block text-sm font-medium text-st-text-primary mb-1',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-st-error-500 ml-1">*</span>}
  </label>
));

Label.displayName = 'Label';

// Helper text component
export const HelperText = React.forwardRef(({
  className,
  type = 'default',
  children,
  ...props
}, ref) => {
  const typeStyles = {
    default: 'text-st-text-secondary',
    error: 'text-st-error-600',
    success: 'text-st-success-600',
    warning: 'text-st-warning-600',
  };

  return (
    <p
      ref={ref}
      className={cn('text-xs mt-1', typeStyles[type], className)}
      {...props}
    >
      {children}
    </p>
  );
});

HelperText.displayName = 'HelperText';

// Textarea component
export const Textarea = React.forwardRef(({
  className,
  size = 'md',
  state = 'default',
  disabled = false,
  fullWidth = true,
  rows = 3,
  resize = 'vertical',
  error,
  success,
  warning,
  ...props
}, ref) => {
  const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        // Base styles
        'border transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'placeholder:text-st-text-tertiary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        
        // Size styles
        inputVariants.size[size],
        
        // State styles
        inputVariants.state[currentState],
        
        // Disabled styles
        inputVariants.disabled[disabled.toString()],
        
        // Full width
        inputVariants.fullWidth[fullWidth.toString()],
        
        // Resize behavior
        resizeClasses[resize],
        
        // Custom classes
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

// Search input with built-in search icon
export const SearchInput = React.forwardRef(({
  onClear,
  value,
  placeholder = 'Search...',
  ...props
}, ref) => {
  const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const ClearIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      value={value}
      leftIcon={<SearchIcon />}
      rightIcon={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="hover:text-st-text-primary transition-colors"
          >
            <ClearIcon />
          </button>
        ) : null
      }
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

// Form Group - combines label, input, and helper text
export const FormGroup = ({
  label,
  required = false,
  error,
  success,
  warning,
  helperText,
  children,
  className,
}) => {
  const helperId = React.useId();
  const hasHelperText = error || success || warning || helperText;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      
      <div>
        {React.cloneElement(children, {
          error: !!error,
          success: !!success,
          warning: !!warning,
          'aria-describedby': hasHelperText ? helperId : undefined,
        })}
      </div>
      
      {hasHelperText && (
        <HelperText
          id={helperId}
          type={error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'}
        >
          {error || success || warning || helperText}
        </HelperText>
      )}
    </div>
  );
};

export default Input;