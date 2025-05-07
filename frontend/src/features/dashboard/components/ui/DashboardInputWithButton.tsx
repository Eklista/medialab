// src/features/dashboard/components/ui/DashboardInputWithButton.tsx
import React, { useState } from 'react';
import DashboardButton from './DashboardButton';

export interface DashboardInputWithButtonProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  buttonText: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  buttonIcon?: React.ReactNode;
  maxLength?: number;
  validateInput?: (value: string) => string | undefined;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

const DashboardInputWithButton: React.FC<DashboardInputWithButtonProps> = ({
  id,
  name,
  label,
  placeholder = '',
  buttonText,
  onSubmit,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  buttonIcon,
  maxLength,
  validateInput,
  variant = 'primary',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (validationError) setValidationError(undefined);
  };
  
  const handleSubmitClick = () => {
    // No proceder si el input está vacío
    if (!inputValue.trim()) {
      setValidationError('Este campo no puede estar vacío');
      return;
    }
    
    // Validar input si se proporciona una función de validación
    if (validateInput) {
      const errorMessage = validateInput(inputValue);
      if (errorMessage) {
        setValidationError(errorMessage);
        return;
      }
    }
    
    // Llamar a onSubmit con el valor actual del input
    onSubmit(inputValue);
    
    // Limpiar el campo de entrada después de añadir
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitClick();
    }
  };
  
  const showError = error || validationError;
  
  return (
    <div className={`${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex">
        <input
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={`
            rounded-l-md border border-r-0 border-gray-300 block flex-1 min-w-0 w-full px-3 py-2 text-sm
            ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
              'focus:ring-blue-500 focus:border-blue-500'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
          `}
        />
        <DashboardButton
          variant={variant}
          type="button"
          onClick={handleSubmitClick}
          disabled={disabled || !inputValue.trim()}
          className="rounded-l-none"
          rightIcon={buttonIcon}
          size="md"
        >
          {buttonText}
        </DashboardButton>
      </div>
      
      {(showError || helperText) && (
        <p className={`mt-1 text-sm ${showError ? 'text-red-600' : 'text-gray-500'}`}>
          {showError || helperText}
        </p>
      )}
    </div>
  );
};

export default DashboardInputWithButton;