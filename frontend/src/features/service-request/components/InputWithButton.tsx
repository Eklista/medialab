// src/features/service-request/components/InputWithButton.tsx
import React, { useState } from 'react';
import Button from './Button';

export interface InputWithButtonProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  buttonText: string;
  onAdd: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  buttonIcon?: React.ReactNode;
  maxLength?: number;
  validateInput?: (value: string) => string | null;
}

const InputWithButton: React.FC<InputWithButtonProps> = ({
  id,
  name,
  label,
  placeholder = '',
  buttonText,
  onAdd,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  buttonIcon,
  maxLength,
  validateInput,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Clear validation error when user is typing
    if (validationError) setValidationError(null);
  };

  const handleAddClick = () => {
    // Don't proceed if input is empty
    if (!inputValue.trim()) {
      setValidationError('Este campo no puede estar vacío');
      return;
    }
    
    // Validate input if validateInput function is provided
    if (validateInput) {
      const errorMessage = validateInput(inputValue);
      if (errorMessage) {
        setValidationError(errorMessage);
        return;
      }
    }
    
    // Call onAdd with current input value
    onAdd(inputValue);
    
    // Clear input field after adding
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
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
            rounded-l-lg border border-r-0 border-gray-300 block flex-1 min-w-0 w-full px-4 py-2
            ${(error || validationError) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    'focus:ring-black focus:border-black'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out
          `}
        />
        <Button
          variant="primary" 
          type="button"
          onClick={handleAddClick}
          disabled={disabled || !inputValue.trim()}
          className="rounded-l-none rounded-r-lg"
          rightIcon={buttonIcon}
        >
          {buttonText}
        </Button>
      </div>
      
      {(error || validationError || helperText) && (
        <p className={`mt-1 text-sm ${(error || validationError) ? 'text-red-600' : 'text-gray-500'}`}>
          {error || validationError || helperText}
        </p>
      )}
    </div>
  );
};

export default InputWithButton;