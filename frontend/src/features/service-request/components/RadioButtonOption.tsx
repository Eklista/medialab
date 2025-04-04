// components/RadioButtonOption.tsx
import React from 'react';

interface RadioButtonOptionProps {
  id: string;
  label: string;
  value: string;
  name: string;
  checked: boolean;
  onChange: (value: string) => void;
  description?: string;
  icon?: React.ReactNode;
}

const RadioButtonOption: React.FC<RadioButtonOptionProps> = ({
  id,
  label,
  value,
  name,
  checked,
  onChange,
  description,
  icon
}) => {
  // Utiliza una función más directa
  const handleClick = () => {
    onChange(value);
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
        checked
          ? 'border-black bg-black/5'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={handleClick}
      // Eliminar onTouchEnd ya que puede causar problemas en algunos dispositivos
      role="button" // Cambio a role="button" para mejor compatibilidad táctil
      tabIndex={0}
    >
      {/* Input oculto para mantener la accesibilidad y funcionalidad */}
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        className="sr-only"
        checked={checked}
        onChange={handleClick}
      />
     
      <div className="flex items-start">
        {checked && (
          <div className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
       
        <div className="flex flex-1">
          {icon && (
            <div className={`mr-3 ${checked ? 'text-black' : 'text-gray-500'}`}>
              {icon}
            </div>
          )}
          <div className="w-full">
            {/* Cambiar label a div para evitar problemas con eventos */}
            <div className="block text-lg font-medium text-black cursor-pointer">
              {label}
            </div>
            {description && (
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioButtonOption;