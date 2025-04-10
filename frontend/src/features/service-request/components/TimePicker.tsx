// src/features/service-request/components/TimePicker.tsx
import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export interface TimePickerProps {
  id: string;
  name: string;
  label?: string;
  selectedTime: Date | null;
  onChange: (time: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
  timeFormat?: string;
  minTime?: Date;
  maxTime?: Date;
}

const TimePicker: React.FC<TimePickerProps> = ({
  id,
  name,
  label,
  selectedTime,
  onChange,
  placeholder = 'Seleccionar hora',
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
  timeFormat = "HH:mm",
  minTime,
  maxTime,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-black mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative w-full">
        <ReactDatePicker
          id={id}
          name={name}
          selected={selectedTime}
          onChange={onChange}
          placeholderText={placeholder}
          disabled={disabled}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          dateFormat="HH:mm"
          timeFormat={timeFormat}
          minTime={minTime}
          maxTime={maxTime}
          className={`
            block w-full px-4 py-2 rounded-lg border
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    'border-gray-300 focus:ring-black focus:border-black'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
          `}
          wrapperClassName="w-full"
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

export default TimePicker;