// src/features/dashboard/components/ui/DashboardTextarea.tsx
import React from 'react';

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
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`
          block w-full px-4 py-2 rounded-lg border resize-y
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                   'border-gray-300 focus:ring-black focus:border-black'}
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
        `}
      />
      
      <div className="flex justify-between mt-1">
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
        
        {showCharCount && maxLength && (
          <p className={`text-sm text-gray-500 ml-auto ${value.length >= maxLength ? 'text-red-500' : ''}`}>
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardTextArea;