// src/features/service-request/components/MultiDayPicker.tsx
import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Button from './Button';

export interface MultiDayPickerProps {
  id: string;
  name: string;
  label?: string;
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MultiDayPicker: React.FC<MultiDayPickerProps> = ({
  id,
  name,
  label,
  selectedDates,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
  minDate,
  maxDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Función para formatar fecha en DD/MM/YYYY
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Añadir una fecha a la selección
  const handleAddDate = () => {
    if (currentDate) {
      // Verificar que la fecha no esté ya seleccionada
      const dateExists = selectedDates.some(date => 
        date.getFullYear() === currentDate.getFullYear() && 
        date.getMonth() === currentDate.getMonth() && 
        date.getDate() === currentDate.getDate()
      );

      if (!dateExists) {
        onChange([...selectedDates, currentDate]);
        setCurrentDate(null);
      }
    }
  };

  // Eliminar una fecha de la selección
  const handleRemoveDate = (indexToRemove: number) => {
    onChange(selectedDates.filter((_, index) => index !== indexToRemove));
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
      
      <div className="space-y-4">
        <div className="flex items-end space-x-3">
          <div className="flex-grow">
            <ReactDatePicker
              id={id}
              name={name}
              selected={currentDate}
              onChange={setCurrentDate}
              placeholderText="Seleccionar fecha"
              disabled={disabled}
              dateFormat="dd/MM/yyyy"
              minDate={minDate}
              maxDate={maxDate}
              highlightDates={selectedDates}
              className={`
                block w-full px-4 py-2 rounded-lg border
                ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                       'border-gray-300 focus:ring-black focus:border-black'}
                ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
              `}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddDate}
            disabled={!currentDate || disabled}
            size="sm"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Agregar
          </Button>
        </div>
        
        {selectedDates.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Fechas seleccionadas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <div 
                  key={index}
                  className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"
                >
                  <span>{formatDate(date)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(index)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                    disabled={disabled}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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

export default MultiDayPicker;