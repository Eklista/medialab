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
  // Nuevas props opcionales que no rompen compatibilidad
  size?: 'sm' | 'md' | 'lg';
  buttonPosition?: 'right' | 'bottom';
  inputType?: 'text' | 'email' | 'url' | 'search';
  clearOnSubmit?: boolean;
  loading?: boolean;
  submitOnEnter?: boolean;
  showCharCount?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  allowEmptySubmit?: boolean;
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
  // Props nuevas con valores por defecto
  size = 'md',
  buttonPosition = 'right',
  inputType = 'text',
  clearOnSubmit = true,
  loading = false,
  submitOnEnter = true,
  showCharCount = false,
  icon,
  fullWidth = true,
  allowEmptySubmit = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  
  // Size configurations
  const sizeConfig = {
    sm: { input: 'h-9 px-3 text-sm', button: 'h-9', gap: 'gap-2', text: 'text-sm' },
    md: { input: 'h-10 px-4 text-sm', button: 'h-10', gap: 'gap-3', text: 'text-sm' },
    lg: { input: 'h-12 px-4 text-base', button: 'h-12', gap: 'gap-4', text: 'text-base' }
  };

  const currentSize = sizeConfig[size];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (validationError) setValidationError(undefined);
  };
  
  const validateAndSubmit = (value: string) => {
    if (!allowEmptySubmit && !value.trim()) {
      setValidationError('Este campo no puede estar vacío');
      return false;
    }

    if (validateInput) {
      const errorMessage = validateInput(value);
      if (errorMessage) {
        setValidationError(errorMessage);
        return false;
      }
    }

    return true;
  };
  
  const handleSubmitClick = () => {
    if (loading) return;

    if (validateAndSubmit(inputValue)) {
      onSubmit(inputValue);
      if (clearOnSubmit) {
        setInputValue('');
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && submitOnEnter) {
      e.preventDefault();
      handleSubmitClick();
    }
  };
  
  const showError = error || validationError;
  const isDisabled = disabled || loading;

  // Horizontal layout (default - mantiene compatibilidad)
  if (buttonPosition === 'right') {
    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={id}
            className={`block font-medium text-gray-700 mb-1 ${currentSize.text}`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className={`flex ${currentSize.gap}`}>
          <div className="relative flex-1">
            {/* Icon */}
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 h-5 w-5 flex items-center justify-center">
                  {icon}
                </span>
              </div>
            )}

            <input
              id={id}
              name={name}
              type={inputType}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              required={required}
              maxLength={maxLength}
              className={`
                block w-full ${currentSize.input}
                ${icon ? 'pl-10' : ''}
                rounded-l-lg rounded-r-none border-r-0
                border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
                placeholder-gray-400 transition-all duration-200 ease-in-out
                focus:outline-none
              `}
            />
          </div>

          <DashboardButton
            type="button"
            variant={variant}
            size={size}
            onClick={handleSubmitClick}
            disabled={isDisabled || (!allowEmptySubmit && !inputValue.trim())}
            loading={loading}
            className="rounded-l-none rounded-r-lg flex-shrink-0"
            rightIcon={buttonIcon}
          >
            {buttonText}
          </DashboardButton>
        </div>

        {/* Helper text and validation */}
        <div className="mt-1 flex justify-between items-start">
          <div className="flex-1">
            {showError && (
              <p className="text-red-600 text-sm">
                {showError}
              </p>
            )}
            {helperText && !showError && (
              <p className="text-gray-500 text-sm">
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p className={`
              text-sm text-gray-500 ml-2 flex-shrink-0
              ${inputValue.length >= maxLength ? 'text-red-500' : ''}
            `}>
              {inputValue.length} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Vertical layout (nueva funcionalidad)
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-medium text-gray-700 mb-1 ${currentSize.text}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 h-5 w-5 flex items-center justify-center">
                {icon}
              </span>
            </div>
          )}

          <input
            id={id}
            name={name}
            type={inputType}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            required={required}
            maxLength={maxLength}
            className={`
              block w-full ${currentSize.input}
              ${icon ? 'pl-10' : ''}
              rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ${isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
              placeholder-gray-400 transition-all duration-200 ease-in-out
              focus:outline-none
            `}
          />
        </div>

        <DashboardButton
          type="button"
          variant={variant}
          size={size}
          onClick={handleSubmitClick}
          disabled={isDisabled || (!allowEmptySubmit && !inputValue.trim())}
          loading={loading}
          className={`${fullWidth ? 'w-full' : 'w-auto'}`}
          rightIcon={buttonIcon}
        >
          {buttonText}
        </DashboardButton>
      </div>

      {/* Helper text and validation */}
      <div className="mt-1 flex justify-between items-start">
        <div className="flex-1">
          {showError && (
            <p className="text-red-600 text-sm">
              {showError}
            </p>
          )}
          {helperText && !showError && (
            <p className="text-gray-500 text-sm">
              {helperText}
            </p>
          )}
        </div>

        {showCharCount && maxLength && (
          <p className={`
            text-sm text-gray-500 ml-2 flex-shrink-0
            ${inputValue.length >= maxLength ? 'text-red-500' : ''}
          `}>
            {inputValue.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardInputWithButton;