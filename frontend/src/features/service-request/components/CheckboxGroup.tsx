// src/features/service-request/components/CheckboxGroup.tsx
import React, { useState } from 'react';
import Checkbox from './Checkbox';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export interface CheckboxOption {
  id: string;
  label: string;
  value: string;
  description?: string; // Añadimos descripción para tooltip
}

export interface CheckboxGroupProps {
  name: string;
  label?: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  label,
  options,
  selectedValues,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  columns = 1,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(val => val !== value));
    }
  };
  
  // Determine grid columns class based on props
  const gridColumnsClass = {
    1: '',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }[columns];

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <div className="mb-2">
          <span className="block text-sm font-medium text-black">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
      )}
      
      <div className={`grid gap-x-6 gap-y-3 ${gridColumnsClass}`}>
        {options.map((option) => (
          <div key={option.id} className="relative">
            <div className="flex items-center">
              <Checkbox
                id={`${name}-${option.id}`}
                name={`${name}[${option.id}]`}
                label={option.label}
                checked={selectedValues.includes(option.value)}
                onChange={(e) => handleCheckboxChange(e, option.value)}
                disabled={disabled}
              />
              
              {/* Icono de información para tooltip si hay description */}
              {option.description && (
                <div 
                  className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onMouseEnter={() => setActiveTooltip(option.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip(option.id)}
                  onBlur={() => setActiveTooltip(null)}
                >
                  <InformationCircleIcon className="h-4 w-4" />
                </div>
              )}
            </div>
            
            {/* Tooltip */}
            {activeTooltip === option.id && option.description && (
              <div className="absolute z-10 w-64 bg-black bg-opacity-90 text-white text-xs rounded p-2 mt-1 left-0 shadow-lg">
                {option.description}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CheckboxGroup;