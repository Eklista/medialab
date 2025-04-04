// src/features/service-request/components/Checkbox.tsx
import React from 'react';

export interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  helperText?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  required = false,
  className = '',
  helperText,
}) => {
  // Utilizamos un enfoque personalizado con Tailwind
  return (
    <div className={`flex items-start ${className}`}>
      <div className="relative flex items-center h-5">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="sr-only" // Ocultar el checkbox real
        />
        <span 
          className={`
            flex items-center justify-center
            h-5 w-5 rounded transition-colors duration-150 ease-in-out
            ${checked ? 'bg-black' : 'bg-white'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
            border ${checked ? 'border-black' : 'border-gray-300'}
          `}
          onClick={disabled ? undefined : () => {
            const fakeEvent = {
              target: { checked: !checked }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(fakeEvent);
          }}
          aria-hidden="true"
        >
          {checked && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 text-white" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </span>
      </div>
      <div className="ml-2 text-sm">
        <label 
          htmlFor={id} 
          className={`font-medium ${disabled ? 'text-gray-500' : 'text-black'} ${
            !disabled && 'cursor-pointer'
          }`}
          onClick={disabled ? undefined : () => {
            const fakeEvent = {
              target: { checked: !checked }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(fakeEvent);
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {helperText && (
          <p className="text-gray-500">{helperText}</p>
        )}
      </div>
    </div>
  );
};

export default Checkbox;;