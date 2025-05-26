// src/features/dashboard/components/ui/DashboardCheckbox.tsx
import React, { useState } from 'react';
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline';

export interface DashboardCheckboxProps {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
  // Nuevas props para funcionalidad avanzada
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  layout?: 'horizontal' | 'vertical';
  indeterminate?: boolean;
  loading?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  customCheckbox?: boolean; // Para usar diseño custom vs nativo
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const DashboardCheckbox: React.FC<DashboardCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  error,
  className = '',
  required = false,
  size = 'md',
  variant = 'default',
  layout = 'horizontal',
  indeterminate = false,
  loading = false,
  helperText,
  icon,
  customCheckbox = true,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      checkbox: customCheckbox ? 'h-4 w-4' : 'h-3 w-3',
      label: 'text-sm',
      description: 'text-xs',
      helper: 'text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-2',
      padding: customCheckbox ? 'p-1' : ''
    },
    md: {
      checkbox: customCheckbox ? 'h-5 w-5' : 'h-4 w-4',
      label: 'text-sm',
      description: 'text-sm',
      helper: 'text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-3',
      padding: customCheckbox ? 'p-1' : ''
    },
    lg: {
      checkbox: customCheckbox ? 'h-6 w-6' : 'h-5 w-5',
      label: 'text-base',
      description: 'text-sm',
      helper: 'text-sm',
      icon: 'h-5 w-5',
      gap: 'gap-4',
      padding: customCheckbox ? 'p-1.5' : ''
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      checked: 'bg-blue-600 border-blue-600',
      unchecked: 'bg-white border-gray-300',
      hover: 'hover:border-blue-400',
      focus: 'focus:ring-blue-500',
      text: 'text-gray-900'
    },
    success: {
      checked: 'bg-green-600 border-green-600',
      unchecked: 'bg-white border-gray-300',
      hover: 'hover:border-green-400',
      focus: 'focus:ring-green-500',
      text: 'text-gray-900'
    },
    warning: {
      checked: 'bg-amber-500 border-amber-500',
      unchecked: 'bg-white border-gray-300',
      hover: 'hover:border-amber-400',
      focus: 'focus:ring-amber-500',
      text: 'text-gray-900'
    },
    danger: {
      checked: 'bg-red-600 border-red-600',
      unchecked: 'bg-white border-gray-300',
      hover: 'hover:border-red-400',
      focus: 'focus:ring-red-500',
      text: 'text-gray-900'
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && !loading) {
      onChange(e.target.checked);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Custom checkbox component
  const renderCustomCheckbox = () => (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled || loading}
        required={required}
        className="sr-only"
        ref={(el) => {
          if (el && indeterminate) {
            el.indeterminate = indeterminate;
          }
        }}
      />
      <div
        className={`
          ${currentSize.checkbox} ${currentSize.padding}
          border-2 rounded-md transition-all duration-200 ease-in-out cursor-pointer
          ${checked || indeterminate 
            ? currentVariant.checked 
            : `${currentVariant.unchecked} ${!disabled ? currentVariant.hover : ''}`
          }
          ${isFocused ? `ring-2 ring-offset-2 ${currentVariant.focus} ring-opacity-50` : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
          ${loading ? 'cursor-wait' : ''}
          flex items-center justify-center
        `}
        onClick={() => {
          const input = document.getElementById(id) as HTMLInputElement;
          if (input && !disabled && !loading) {
            input.click();
          }
        }}
      >
        {loading ? (
          <svg className={`animate-spin ${currentSize.icon} text-white`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : indeterminate ? (
          <MinusIcon className={`${currentSize.icon} text-white`} strokeWidth={3} />
        ) : checked ? (
          <CheckIcon className={`${currentSize.icon} text-white`} strokeWidth={3} />
        ) : null}
      </div>
    </div>
  );

  // Native checkbox component
  const renderNativeCheckbox = () => (
    <input
      id={id}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled || loading}
      required={required}
      className={`
        ${currentSize.checkbox} cursor-pointer transition-colors duration-200 ease-in-out
        ${currentVariant.focus} border-gray-300 rounded
        ${error ? 'border-red-500 focus:ring-red-500' : `text-blue-600 ${currentVariant.focus}`}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${loading ? 'cursor-wait' : ''}
      `}
      ref={(el) => {
        if (el && indeterminate) {
          el.indeterminate = indeterminate;
        }
      }}
    />
  );

  // Layout wrapper
  const containerClasses = `
    flex items-start ${currentSize.gap}
    ${layout === 'vertical' ? 'flex-col' : 'flex-row'}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-center">
        {icon && (
          <div className={`mr-2 ${currentSize.icon} text-gray-500 flex items-center justify-center`}>
            {icon}
          </div>
        )}
        {customCheckbox ? renderCustomCheckbox() : renderNativeCheckbox()}
      </div>

      {/* Content */}
      {(label || description || helperText || error) && (
        <div className={`flex-1 min-w-0 ${layout === 'vertical' ? 'mt-1' : ''}`}>
          {label && (
            <label
              htmlFor={id}
              className={`
                block font-medium cursor-pointer
                ${currentSize.label} ${currentVariant.text}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {description && (
            <p className={`
              ${currentSize.description} text-gray-500 mt-1
              ${disabled ? 'opacity-50' : ''}
            `}>
              {description}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className={`mt-1 ${currentSize.helper} text-red-600`}>
              {error}
            </p>
          )}

          {/* Helper text */}
          {helperText && !error && (
            <p className={`mt-1 ${currentSize.helper} text-gray-500`}>
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Checkbox Group component for multiple related checkboxes
interface CheckboxGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'tight' | 'normal' | 'loose';
  columns?: 1 | 2 | 3 | 4;
}

export const DashboardCheckboxGroup: React.FC<CheckboxGroupProps> = ({
  children,
  title,
  description,
  className = '',
  orientation = 'vertical',
  spacing = 'normal',
  columns = 1
}) => {
  const spacingClasses = {
    tight: 'gap-2',
    normal: 'gap-4',
    loose: 'gap-6'
  };

  const gridClasses = columns > 1 ? {
    1: '',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  } : {};

  const containerClasses = [
    className,
    columns > 1 ? `grid ${gridClasses[columns]} ${spacingClasses[spacing]}` : 
    orientation === 'vertical' ? `flex flex-col ${spacingClasses[spacing]}` : 
    `flex flex-wrap ${spacingClasses[spacing]}`
  ].filter(Boolean).join(' ');

  return (
    <div>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={containerClasses}>
        {children}
      </div>
    </div>
  );
};

// Checkbox Card component - Checkbox with card-like container
interface CheckboxCardProps extends Omit<DashboardCheckboxProps, 'className'> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export const DashboardCheckboxCard: React.FC<CheckboxCardProps> = ({
  title,
  description,
  icon,
  className = '',
  badge,
  ...checkboxProps
}) => {
  return (
    <div className={`
      relative rounded-lg border border-gray-200 bg-white p-4
      hover:border-gray-300 transition-colors duration-200
      ${checkboxProps.checked ? 'ring-2 ring-blue-500 ring-opacity-20 border-blue-300' : ''}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
              <span className="text-gray-600 flex items-center justify-center">
                {icon}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {title}
              </h3>
              {badge && badge}
            </div>
            
            {description && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <DashboardCheckbox
            {...checkboxProps}
            label="" // Remove label since it's in the card
            description="" // Remove description since it's in the card
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardCheckbox;