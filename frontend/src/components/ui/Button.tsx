// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  children,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-(--color-accent-1) text-(--color-text-main) hover:bg-(--color-hover) focus:ring-(--color-accent-1)',
    secondary: 'bg-(--color-btn-secondary) text-(--color-text-main) hover:bg-gray-200 focus:ring-gray-300',
    outline: 'border-2 border-(--color-accent-1) text-(--color-accent-1) hover:bg-(--color-accent-1) hover:text-(--color-text-main) focus:ring-(--color-accent-1)',
    ghost: 'text-(--color-text-main) hover:bg-gray-100 focus:ring-gray-300',
    link: 'text-(--color-accent-1) hover:text-(--color-hover) hover:underline'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  
  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      <span>{children}</span>
      
      {rightIcon && !loading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};