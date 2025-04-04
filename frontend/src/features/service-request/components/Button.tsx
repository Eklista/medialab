// src/features/service-request/components/Button.tsx
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
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
  ...rest
}) => {
  // Determine button style based on variant
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-black/90',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300',
    outline: 'border-2 border-black text-black bg-transparent hover:bg-black/5',
    text: 'text-black hover:bg-black/5 border-none',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  // Determine button size
  const sizeStyles = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        font-medium rounded-lg relative
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-80 cursor-wait' : ''}
        ${disabled && !loading ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-150 ease-in-out
        ${className}
      `}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {/* Button content with optional icons */}
      <span className={`flex items-center justify-center ${loading ? 'opacity-0' : ''}`}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </span>
    </button>
  );
};

export default Button;