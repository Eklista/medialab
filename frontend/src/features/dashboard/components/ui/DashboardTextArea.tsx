// src/features/dashboard/components/ui/DashboardTextArea.tsx
import React, { useState, useRef, useEffect } from 'react';

// INTERFAZ ORIGINAL EXACTA - SIN CAMBIOS
export interface DashboardTextareaProps {
  id: string;
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  helperText?: string;
  showCharCount?: boolean;
  // Nuevas props opcionales que no rompen compatibilidad
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  loading?: boolean;
  success?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  spellCheck?: boolean;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const DashboardTextArea: React.FC<DashboardTextareaProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error,
  className = '',
  rows = 4,
  maxLength,
  helperText,
  showCharCount = false,
  // Props nuevas con valores por defecto
  size = 'md',
  variant = 'default',
  resize = 'vertical',
  autoResize = false,
  minRows = 2,
  maxRows = 10,
  loading = false,
  success = false,
  readOnly = false,
  autoFocus = false,
  spellCheck = true,
  icon,
  clearable = false,
  onClear,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [currentRows, setCurrentRows] = useState(rows);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { 
      textarea: 'px-3 py-2 text-sm', 
      icon: 'h-4 w-4', 
      label: 'text-sm', 
      helper: 'text-xs',
      minHeight: 'min-h-[80px]'
    },
    md: { 
      textarea: 'px-4 py-2.5 text-sm', 
      icon: 'h-5 w-5', 
      label: 'text-sm', 
      helper: 'text-sm',
      minHeight: 'min-h-[96px]'
    },
    lg: { 
      textarea: 'px-4 py-3 text-base', 
      icon: 'h-6 w-6', 
      label: 'text-base', 
      helper: 'text-sm',
      minHeight: 'min-h-[112px]'
    }
  };

  // Variant configurations
  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 border-gray-300 bg-white'
  };

  // Resize configurations
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantClasses[variant];
  const currentResize = resizeClasses[resize];

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the number of lines
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const padding = parseInt(getComputedStyle(textarea).paddingTop) + parseInt(getComputedStyle(textarea).paddingBottom);
      const scrollHeight = textarea.scrollHeight - padding;
      const lines = Math.round(scrollHeight / lineHeight);
      
      // Constrain within min and max rows
      const constrainedRows = Math.min(Math.max(lines, minRows), maxRows);
      setCurrentRows(constrainedRows);
      
      // Set the height
      textarea.style.height = `${(constrainedRows * lineHeight) + padding}px`;
    }
  }, [value, autoResize, minRows, maxRows]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      const syntheticEvent = {
        target: { name, value: '' },
        currentTarget: { name, value: '' }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
    textareaRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
  };

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

      <div className="relative">
        {/* Top icon (for textarea, typically goes in top-left) */}
        {icon && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className={`${currentSize.icon} text-gray-500 flex items-center justify-center`}>
              {icon}
            </span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          spellCheck={spellCheck}
          rows={autoResize ? currentRows : rows}
          maxLength={maxLength}
          className={`
            block w-full ${currentSize.textarea} ${currentVariant} ${currentResize}
            ${icon ? 'pl-10' : ''}
            ${clearable && value ? 'pr-10' : ''}
            ${currentSize.minHeight}
            rounded-lg
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                     'focus:ring-black focus:border-black'}
            ${success && !error ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            ${readOnly ? 'bg-gray-50 cursor-default' : ''}
            ${isFocused ? 'ring-2 ring-opacity-50' : ''}
            focus:outline-none transition-all duration-150 ease-in-out
            placeholder-gray-400
          `}
        />

        {/* Right elements container */}
        <div className="absolute top-3 right-3 flex items-start space-x-1">
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
              <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Error message and helper text */}
      <div className="mt-1 flex justify-between items-start">
        <div className="flex-1">
          {error && (
            <p className={`text-red-600 ${currentSize.helper}`}>{error}</p>
          )}
          
          {helperText && !error && (
            <p className={`text-gray-500 ${currentSize.helper}`}>{helperText}</p>
          )}
        </div>
        
        {/* Character count */}
        {(showCharCount || maxLength) && maxLength && (
          <p className={`
            ${currentSize.helper} text-gray-500 ml-2 flex-shrink-0
            ${value.length >= maxLength ? 'text-red-500' : ''}
            ${value.length >= maxLength * 0.9 ? 'font-medium' : ''}
          `}>
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardTextArea;