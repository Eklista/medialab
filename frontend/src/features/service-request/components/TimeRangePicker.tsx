// src/features/service-request/components/TimeRangePicker.tsx
import React from 'react';
import TimePicker from './TimePicker';

export interface TimeRangePickerProps {
  id: string;
  name: string;
  label?: string;
  startTime: Date | null;
  endTime: Date | null;
  onStartTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  id,
  name,
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
}) => {
  const validateEndTime = (selectedTime: Date | null) => {
    if (selectedTime && startTime && selectedTime < startTime) {
      return "La hora de fin debe ser posterior a la hora de inicio";
    }
    return undefined; // Debe retornar undefined, no null
  };

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

      <div className="grid grid-cols-2 gap-3">
        <TimePicker
          id={`${id}-start`}
          name={`${name}-start`}
          label="Hora inicio"
          selectedTime={startTime}
          onChange={onStartTimeChange}
          required={required}
          disabled={disabled}
        />
        
        <TimePicker
          id={`${id}-end`}
          name={`${name}-end`}
          label="Hora fin"
          selectedTime={endTime}
          onChange={onEndTimeChange}
          required={required}
          disabled={disabled}
          error={validateEndTime(endTime)}
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

export default TimeRangePicker;