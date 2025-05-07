// src/features/dashboard/components/ui/Switch.tsx
import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      className={`${checked ? 'bg-black' : 'bg-gray-200'} 
                  relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent 
                  rounded-full cursor-pointer transition-colors ease-in-out duration-200 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${className}`}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span className="sr-only">Activar</span>
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'} 
                   pointer-events-none inline-block h-5 w-5 rounded-full 
                   bg-white shadow transform ring-0 transition ease-in-out duration-200`}
      />
    </button>
  );
};

export default Switch;