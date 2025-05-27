// src/components/ui/FilterBar.tsx
import React from 'react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  filters: Array<{
    id: string;
    label: string;
    options: FilterOption[];
    type: 'select' | 'multiselect' | 'toggle';
  }>;
  selectedFilters: Record<string, string | string[]>;
  onFilterChange: (filterId: string, value: string | string[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  className = ''
}) => {
  const hasActiveFilters = Object.values(selectedFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-(--color-text-main) dark:text-white">
          Filtros:
        </span>
        
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            <label className="text-sm text-(--color-text-secondary) dark:text-gray-300">
              {filter.label}:
            </label>
            
            {filter.type === 'select' && (
              <select
                value={selectedFilters[filter.id] as string || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-(--color-text-main) dark:text-white text-sm"
              >
                <option value="">Todos</option>
                {filter.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} {option.count && `(${option.count})`}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'multiselect' && (
              <div className="relative">
                {/* Implementar multiselect dropdown */}
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-(--color-text-main) dark:text-white text-sm">
                  Seleccionar...
                </button>
              </div>
            )}
          </div>
        ))}
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1 text-sm text-(--color-accent-1) hover:text-(--color-hover) transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};