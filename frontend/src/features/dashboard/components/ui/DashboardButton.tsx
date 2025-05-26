// src/features/dashboard/components/ui/DashboardButton.tsx
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success' | 'warning' | 'gradient';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DashboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: boolean;
  pulse?: boolean;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  rounded = 'lg',
  shadow = false,
  pulse = false,
  ...rest
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium relative transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles with improved gradients and hover effects
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 focus:ring-gray-500 shadow-sm',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-300 border border-gray-200',
    outline: 'border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 focus:ring-gray-300',
    text: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500 shadow-sm',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400 shadow-sm',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 focus:ring-blue-500 shadow-md'
  };
  
  // Size styles with better proportions
  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-sm px-3 py-2 gap-2',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
    xl: 'text-lg px-8 py-4 gap-3'
  };
  
  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
  
  // Icon sizes based on button size
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };
  
  // Loading spinner size
  const spinnerSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };
  
  // Combine all classes
  const buttonClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    roundedStyles[rounded],
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : '',
    shadow ? 'shadow-lg hover:shadow-xl' : '',
    pulse && !disabled && !loading ? 'animate-pulse' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Clone icons with proper sizing
  const renderIcon = (icon: React.ReactNode, position: 'left' | 'right') => {
    if (!icon) return null;
    
    if (React.isValidElement(icon)) {
      const iconClassName = `${iconSizes[size]} ${
        position === 'left' && children ? 'mr-2' : 
        position === 'right' && children ? 'ml-2' : ''
      }`;
      
      // Use a wrapper span to avoid cloneElement typing issues
      return (
        <span className={`${iconClassName} flex items-center justify-center`}>
          {icon}
        </span>
      );
    }
    
    return icon;
  };
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      {...rest}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className={`animate-spin ${spinnerSizes[size]} text-current`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
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
        </div>
      )}
      
      {/* Button content */}
      <span className={`flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {leftIcon && renderIcon(leftIcon, 'left')}
        {children && <span className="truncate">{children}</span>}
        {rightIcon && renderIcon(rightIcon, 'right')}
      </span>
      
      {/* Ripple effect (optional visual enhancement) */}
      {!disabled && !loading && (
        <span className="absolute inset-0 rounded-inherit opacity-0 transition-opacity duration-200 hover:opacity-10 active:opacity-20 bg-white pointer-events-none" />
      )}
    </button>
  );
};

// Button Group Component for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const DashboardButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
  size,
  variant,
  fullWidth = false
}) => {
  const groupClasses = [
    'inline-flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Clone children to apply group styles
  const clonedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    const isFirst = index === 0;
    const isLast = index === React.Children.count(children) - 1;
    const isMiddle = !isFirst && !isLast;
    
    let groupClassName = '';
    
    if (orientation === 'horizontal') {
      if (isFirst) groupClassName = 'rounded-r-none border-r-0';
      else if (isLast) groupClassName = 'rounded-l-none';
      else if (isMiddle) groupClassName = 'rounded-none border-r-0';
    } else {
      if (isFirst) groupClassName = 'rounded-b-none border-b-0';
      else if (isLast) groupClassName = 'rounded-t-none';
      else if (isMiddle) groupClassName = 'rounded-none border-b-0';
    }
    
    // Type assertion for child props
    const childElement = child as React.ReactElement<DashboardButtonProps>;
    
    return React.cloneElement(childElement, {
      className: `${childElement.props.className || ''} ${groupClassName}`.trim(),
      size: size || childElement.props.size,
      variant: variant || childElement.props.variant,
      fullWidth: fullWidth || childElement.props.fullWidth
    });
  });
  
  return (
    <div className={groupClasses}>
      {clonedChildren}
    </div>
  );
};

// Icon Button Component for icon-only buttons
interface IconButtonProps extends Omit<DashboardButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
  tooltip?: string;
}

export const DashboardIconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  rounded = 'lg',
  className = '',
  ...rest
}) => {
  // Icon button specific size adjustments for square buttons
  const iconButtonSizes = {
    xs: 'h-6 w-6 p-1',
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5',
    xl: 'h-16 w-16 p-3'
  };
  
  return (
    <DashboardButton
      size={size}
      rounded={rounded}
      className={`${iconButtonSizes[size]} ${className}`}
      {...rest}
    >
      {icon}
    </DashboardButton>
  );
};

export default DashboardButton;