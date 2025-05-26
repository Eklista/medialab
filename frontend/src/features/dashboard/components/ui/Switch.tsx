// src/features/dashboard/components/ui/Switch.tsx
import React, { useState } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  label?: string;
  description?: string;
  loading?: boolean;
  icons?: {
    checked?: React.ReactNode;
    unchecked?: React.ReactNode;
  };
  showLabels?: boolean;
  labels?: {
    on?: string;
    off?: string;
  };
  id?: string;
  name?: string;
  required?: boolean;
  onLabel?: string;
  offLabel?: string;
}

const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default',
  label,
  description,
  loading = false,
  icons,
  showLabels = false,
  labels = { on: 'On', off: 'Off' },
  id,
  name,
  required = false,
  onLabel,
  offLabel
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      switch: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4',
      padding: 'p-0.5',
      text: 'text-xs',
      gap: 'gap-2'
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5', 
      translate: 'translate-x-5',
      padding: 'p-0.5',
      text: 'text-sm',
      gap: 'gap-3'
    },
    lg: {
      switch: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7', 
      padding: 'p-0.5',
      text: 'text-base',
      gap: 'gap-4'
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      checked: 'bg-blue-600',
      unchecked: 'bg-gray-200',
      focus: 'focus:ring-blue-500'
    },
    success: {
      checked: 'bg-green-600',
      unchecked: 'bg-gray-200', 
      focus: 'focus:ring-green-500'
    },
    warning: {
      checked: 'bg-amber-500',
      unchecked: 'bg-gray-200',
      focus: 'focus:ring-amber-500'
    },
    danger: {
      checked: 'bg-red-600',
      unchecked: 'bg-gray-200',
      focus: 'focus:ring-red-500'
    }
  };

  const sizeClasses = sizeConfig[size];
  const variantClasses = variantConfig[variant];

  const handleToggle = () => {
    if (!disabled && !loading) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  const switchComponent = (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-required={required}
      aria-describedby={description ? `${id}-description` : undefined}
      disabled={disabled || loading}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`
        ${checked ? variantClasses.checked : variantClasses.unchecked}
        relative inline-flex ${sizeClasses.switch} flex-shrink-0 cursor-pointer
        rounded-full border-2 border-transparent transition-colors ease-in-out duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses.focus}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${isFocused ? 'ring-2 ring-offset-2' : ''}
        ${className}
      `}
    >
      <span className="sr-only">{label || 'Toggle switch'}</span>
      
      {/* Switch background with labels */}
      {showLabels && (
        <>
          <span className={`
            absolute inset-0 flex items-center justify-start pl-2
            ${sizeClasses.text} font-medium text-white
            ${checked ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}>
            {labels.on}
          </span>
          <span className={`
            absolute inset-0 flex items-center justify-end pr-2
            ${sizeClasses.text} font-medium text-gray-500
            ${!checked ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}>
            {labels.off}
          </span>
        </>
      )}
      
      {/* Thumb */}
      <span
        className={`
          ${checked ? sizeClasses.translate : 'translate-x-0'}
          pointer-events-none inline-block ${sizeClasses.thumb} transform rounded-full
          bg-white shadow-lg ring-0 transition ease-in-out duration-200
          flex items-center justify-center
        `}
      >
        {loading ? (
          <svg className="animate-spin h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : icons ? (
          <span className="text-gray-400 flex items-center justify-center">
            {checked ? icons.checked : icons.unchecked}
          </span>
        ) : null}
      </span>
    </button>
  );

  // If no label or description, return just the switch
  if (!label && !description && !onLabel && !offLabel) {
    return switchComponent;
  }

  // Full switch with label and description
  return (
    <div className={`flex items-start ${sizeClasses.gap}`}>
      {switchComponent}
      
      <div className="flex-1 min-w-0">
        {(label || onLabel || offLabel) && (
          <label 
            htmlFor={id}
            className={`
              ${sizeClasses.text} font-medium text-gray-900 cursor-pointer
              ${disabled ? 'text-gray-400' : ''}
            `}
          >
            {label || (checked ? onLabel : offLabel)}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p 
            id={`${id}-description`}
            className={`
              mt-1 text-xs text-gray-500
              ${disabled ? 'text-gray-400' : ''}
            `}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Switch Group component for multiple related switches
interface SwitchGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'tight' | 'normal' | 'loose';
}

export const SwitchGroup: React.FC<SwitchGroupProps> = ({
  children,
  title,
  description,
  className = '',
  orientation = 'vertical',
  spacing = 'normal'
}) => {
  const spacingClasses = {
    tight: orientation === 'vertical' ? 'space-y-2' : 'space-x-2',
    normal: orientation === 'vertical' ? 'space-y-4' : 'space-x-4', 
    loose: orientation === 'vertical' ? 'space-y-6' : 'space-x-6'
  };

  const orientationClasses = orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap';

  return (
    <div className={className}>
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
      
      <div className={`flex ${orientationClasses} ${spacingClasses[spacing]}`}>
        {children}
      </div>
    </div>
  );
};

// Toggle Card component - Switch with card-like container
interface ToggleCardProps extends Omit<SwitchProps, 'className'> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export const ToggleCard: React.FC<ToggleCardProps> = ({
  title,
  description,
  icon,
  className = '',
  badge,
  ...switchProps
}) => {
  return (
    <div className={`
      relative rounded-lg border border-gray-200 bg-white p-4
      hover:border-gray-300 transition-colors duration-200
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
          <Switch {...switchProps} />
        </div>
      </div>
    </div>
  );
};

export default Switch;