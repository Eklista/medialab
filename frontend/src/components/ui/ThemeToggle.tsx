// src/components/ui/ThemeToggle.tsx
import React, { useState } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch' | 'dropdown';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  variant = 'button',
  className = '',
  showLabel = false
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const sizes = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizes[size]} ${className}
          inline-flex items-center justify-center
          rounded-lg transition-all duration-200
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700
          text-(--color-text-main) dark:text-white
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-(--color-accent-1)
        `}
        title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
      >
        {theme === 'light' ? (
          <MoonIcon className={iconSizes[size]} />
        ) : (
          <SunIcon className={iconSizes[size]} />
        )}
        {showLabel && (
          <span className="ml-2 text-sm">
            {theme === 'light' ? 'Oscuro' : 'Claro'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <span className="text-sm text-(--color-text-secondary) dark:text-gray-300">
            Tema oscuro
          </span>
        )}
        <button
          onClick={toggleTheme}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${theme === 'dark' ? 'bg-(--color-accent-1)' : 'bg-gray-200 dark:bg-gray-700'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizes[size]} ${className}
            inline-flex items-center justify-center
            rounded-lg transition-all duration-200
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            text-(--color-text-main) dark:text-white
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-(--color-accent-1)
          `}
        >
          {theme === 'light' ? (
            <SunIcon className={iconSizes[size]} />
          ) : (
            <MoonIcon className={iconSizes[size]} />
          )}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              <div className="p-1">
                <button
                  onClick={() => {
                    setTheme('light');
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors
                    ${theme === 'light' ? 'bg-(--color-accent-1) text-(--color-text-main)' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                  `}
                >
                  <SunIcon className="h-4 w-4" />
                  <span className="text-sm">Claro</span>
                </button>
                
                <button
                  onClick={() => {
                    setTheme('dark');
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors
                    ${theme === 'dark' ? 'bg-(--color-accent-1) text-(--color-text-main)' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                  `}
                >
                  <MoonIcon className="h-4 w-4" />
                  <span className="text-sm">Oscuro</span>
                </button>
                
                <button
                  onClick={() => {
                    // Auto theme based on system
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    setTheme(systemTheme);
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('theme'); // Let system preference take over
                    }
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ComputerDesktopIcon className="h-4 w-4" />
                  <span className="text-sm">Sistema</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};