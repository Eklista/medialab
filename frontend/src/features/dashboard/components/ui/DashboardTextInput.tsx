// src/features/dashboard/components/ui/DashboardTextInput.tsx
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface DashboardTextInputProps {
  id: string;
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  min?: string;
  max?: string;
  // Nuevas props opcionales que no rompen compatibilidad
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
  success?: boolean;
  showCharCount?: boolean;
}

const DashboardTextInput: React.FC<DashboardTextInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  error,
  className = '',
  icon,
  iconPosition = 'left',
  helperText,
  min,
  max,
  // Props nuevas con valores por defecto
  maxLength,
  autoComplete,
  autoFocus = false,
  readOnly = false,
  size = 'md',
  variant = 'default',
  clearable = false,
  onClear,
  loading = false,
  success = false,
  showCharCount = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Determinar si debemos mostrar un placeholder para tipos date/time
  const showPlaceholder = type !== 'date' && type !== 'time';

  // Size configurations
  const sizeClasses = {
    sm: { input: 'px-3 py-1.5 text-sm', icon: 'h-4 w-4', label: 'text-sm', helper: 'text-xs' },
    md: { input: 'px-4 py-2 text-sm', icon: 'h-5 w-5', label: 'text-sm', helper: 'text-sm' },
    lg: { input: 'px-4 py-2.5 text-base', icon: 'h-6 w-6', label: 'text-base', helper: 'text-sm' }
  };

  // Variant configurations
  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 border-gray-300 bg-white'
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      const syntheticEvent = {
        target: { name, value: '' },
        currentTarget: { name, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Calculate right padding based on right elements
  const getRightPadding = () => {
    let elements = 0;
    if (icon && iconPosition === 'right') elements++;
    if (clearable && value) elements++;
    if (type === 'password') elements++;
    if (loading || success) elements++;
    
    if (elements === 0) return '';
    return elements === 1 ? 'pr-10' : elements === 2 ? 'pr-16' : 'pr-20';
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-medium text-gray-700 mb-1 ${currentSize.label}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <span className={`${currentSize.icon} flex items-center justify-center`}>
              {icon}
            </span>
          </div>
        )}
        
        {/* Input field */}
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={showPlaceholder ? placeholder : undefined}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          max={max}
          className={`
            block w-full rounded-lg ${currentSize.input} ${currentVariant}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${getRightPadding()}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                     'focus:ring-black focus:border-black'}
            ${success && !error ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            ${readOnly ? 'bg-gray-50 cursor-default' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out
            placeholder-gray-400
          `}
        />
        
        {/* Right elements container */}
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center">
              <svg className={`${currentSize.icon} animate-spin text-blue-500`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          
          {/* Success indicator */}
          {success && !loading && !error && (
            <div className="flex items-center">
              <svg className={`${currentSize.icon} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          {/* Clear button */}
          {clearable && value && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className={currentSize.icon} />
            </button>
          )}
          
          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className={currentSize.icon} />
              ) : (
                <EyeIcon className={currentSize.icon} />
              )}
            </button>
          )}
          
          {/* Right icon */}
          {icon && iconPosition === 'right' && (
            <div className="flex items-center pointer-events-none text-gray-500">
              <span className={`${currentSize.icon} flex items-center justify-center`}>
                {icon}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <p className={`mt-1 text-red-600 ${currentSize.helper}`}>{error}</p>
      )}
      
      {/* Helper text and character count */}
      <div className="mt-1 flex justify-between items-start">
        <div className="flex-1">
          {helperText && !error && (
            <p className={`text-gray-500 ${currentSize.helper}`}>{helperText}</p>
          )}
        </div>
        
        {showCharCount && maxLength && (
          <p className={`
            ${currentSize.helper} text-gray-500 ml-2 flex-shrink-0
            ${value.length >= maxLength ? 'text-red-500' : ''}
          `}>
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardTextInput;