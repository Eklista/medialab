// src/features/service-request/components/CheckboxGroup.tsx
import React from 'react';
import Checkbox from './Checkbox';

export interface CheckboxOption {
  id: string;
  label: string;
  value: string;
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
          <Checkbox
            key={option.id}
            id={`${name}-${option.id}`}
            name={`${name}[${option.id}]`}
            label={option.label}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleCheckboxChange(e, option.value)}
            disabled={disabled}
          />
        ))}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CheckboxGroup;