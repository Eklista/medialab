// src/features/service-request/components/DatePicker.tsx
import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export interface DatePickerProps {
  id: string;
  name: string;
  label?: string;
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
  showTimeSelect?: boolean;
  timeFormat?: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  id,
  name,
  label,
  selectedDate,
  onChange,
  placeholder = 'Seleccionar fecha',
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
  showTimeSelect = false,
  timeFormat = "HH:mm",
  dateFormat = showTimeSelect ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy",
  minDate,
  maxDate,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-black mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        <ReactDatePicker
          id={id}
          name={name}
          selected={selectedDate}
          onChange={onChange}
          placeholderText={placeholder}
          disabled={disabled}
          dateFormat={dateFormat}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          minDate={minDate}
          maxDate={maxDate}
          className={`
            block w-full px-4 py-2 rounded-lg border
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    'border-gray-300 focus:ring-black focus:border-black'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
          `}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default DatePicker;