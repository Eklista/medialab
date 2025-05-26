// src/features/dashboard/components/ui/DashboardSelect.tsx
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';

// INTERFAZ ORIGINAL EXACTA - SIN CAMBIOS
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DashboardSelectProps {
  id: string;
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
  // Nuevas props opcionales que no rompen compatibilidad
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  loading?: boolean;
  success?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  searchable?: boolean;
  multiple?: boolean;
  icon?: React.ReactNode;
  customDropdown?: boolean;
}

const DashboardSelect: React.FC<DashboardSelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccione una opción',
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
  // Props nuevas con valores por defecto
  size = 'md',
  variant = 'default',
  loading = false,
  success = false,
  clearable = false,
  onClear,
  searchable = false,
  multiple = false,
  icon,
  customDropdown = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Size configurations
  const sizeConfig = {
    sm: { select: 'h-9 px-3 py-1.5 text-sm', icon: 'h-4 w-4', label: 'text-sm', helper: 'text-xs' },
    md: { select: 'h-10 px-4 py-2 text-sm', icon: 'h-5 w-5', label: 'text-sm', helper: 'text-sm' },
    lg: { select: 'h-12 px-4 py-2.5 text-base', icon: 'h-6 w-6', label: 'text-base', helper: 'text-sm' }
  };

  // Variant configurations
  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 border-gray-300 bg-white'
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantClasses[variant];

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      const syntheticEvent = {
        target: { name, value: '' },
        currentTarget: { name, value: '' }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  // Filter options for searchable select
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Custom dropdown (nueva funcionalidad opcional)
  if (customDropdown && !multiple) {
    const selectedOption = options.find(opt => opt.value === value);

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
          {/* Custom Select Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              relative w-full ${currentSize.select} ${currentVariant}
              ${icon ? 'pl-10' : ''}
              ${clearable && value ? 'pr-16' : 'pr-10'}
              text-left rounded-lg cursor-default
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                       'focus:ring-black focus:border-black'}
              ${success && !error ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out
            `}
          >
            {/* Left icon */}
            {icon && (
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className={`${currentSize.icon} text-gray-500 flex items-center justify-center`}>
                  {icon}
                </span>
              </span>
            )}

            {/* Selected value */}
            <span className={`block truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            {/* Right elements */}
            <span className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              {/* Loading indicator */}
              {loading && (
                <svg className={`${currentSize.icon} animate-spin text-blue-500`} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}

              {/* Success indicator */}
              {success && !loading && !error && (
                <svg className={`${currentSize.icon} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}

              {/* Clear button */}
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Dropdown arrow */}
              {isOpen ? (
                <ChevronUpIcon className={`${currentSize.icon} text-gray-500`} />
              ) : (
                <ChevronDownIcon className={`${currentSize.icon} text-gray-500`} />
              )}
            </span>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg border border-gray-300 overflow-auto">
              {/* Search input */}
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Options list */}
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      if (!option.disabled) {
                        const syntheticEvent = {
                          target: { name, value: option.value },
                          currentTarget: { name, value: option.value }
                        } as React.ChangeEvent<HTMLSelectElement>;
                        onChange(syntheticEvent);
                        setIsOpen(false);
                        setSearchTerm('');
                      }
                    }}
                    className={`
                      cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100
                      ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}
                      ${value === option.value ? 'bg-blue-50 text-blue-900' : ''}
                    `}
                  >
                    <span className={`block truncate ${value === option.value ? 'font-medium' : 'font-normal'}`}>
                      {option.label}
                    </span>
                    {value === option.value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                    )}
                  </li>
                ))}
                {filteredOptions.length === 0 && (
                  <li className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                    No se encontraron opciones
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Overlay to close dropdown */}
          {isOpen && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setIsOpen(false)}
            />
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className={`mt-1 text-red-600 ${currentSize.helper}`}>{error}</p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p className={`mt-1 text-gray-500 ${currentSize.helper}`}>{helperText}</p>
        )}
      </div>
    );
  }

  // Select nativo tradicional (comportamiento original)
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
        {/* Left icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`${currentSize.icon} text-gray-500 flex items-center justify-center`}>
              {icon}
            </span>
          </div>
        )}

        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          multiple={multiple}
          className={`
            block w-full ${currentSize.select} ${currentVariant}
            ${icon ? 'pl-10' : ''}
            ${clearable && value ? 'pr-16' : 'pr-10'}
            rounded-lg appearance-none
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                     'focus:ring-black focus:border-black'}
            ${success && !error ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Right elements */}
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3 pointer-events-none">
          {/* Loading indicator */}
          {loading && (
            <svg className={`${currentSize.icon} animate-spin text-blue-500`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}

          {/* Success indicator */}
          {success && !loading && !error && (
            <svg className={`${currentSize.icon} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}

          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
            >
              <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Custom dropdown arrow */}
          <ChevronDownIcon className={`${currentSize.icon} text-gray-500`} />
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <p className={`mt-1 text-red-600 ${currentSize.helper}`}>{error}</p>
      )}
      
      {/* Helper text */}
      {helperText && !error && (
        <p className={`mt-1 text-gray-500 ${currentSize.helper}`}>{helperText}</p>
      )}
    </div>
  );
};

export default DashboardSelect;