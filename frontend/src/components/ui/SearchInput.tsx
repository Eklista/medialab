// src/components/ui/SearchInput.tsx
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: string[];
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Buscar videos, eventos, facultades...",
  value,
  onChange,
  onSearch,
  suggestions = [],
  loading = false,
  size = 'md',
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch?.(suggestion);
    setShowSuggestions(false);
  };

  useEffect(() => {
    setShowSuggestions(isFocused && suggestions.length > 0 && value.length > 0);
  }, [isFocused, suggestions.length, value.length]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className={`
              w-full ${sizes[size]} pl-10 pr-20 
              border border-gray-300 dark:border-gray-600 
              rounded-full 
              bg-white dark:bg-gray-800 
              text-(--color-text-main) dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) focus:border-(--color-accent-1)
              transition-all duration-200
            `}
          />
          
          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {/* Search button */}
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-(--color-accent-1) text-(--color-text-main) rounded-full hover:bg-(--color-hover) transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <MagnifyingGlassIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                <span className="text-(--color-text-main) dark:text-white">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};