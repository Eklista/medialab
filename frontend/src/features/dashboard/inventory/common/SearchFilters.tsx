// frontend/src/features/dashboard/inventory/common/SearchFilters.tsx

import React, { useState, useCallback } from 'react';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardCheckbox from '../../components/ui/DashboardCheckbox';
import Badge from '../../components/ui/Badge';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface FilterOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'text' | 'date' | 'range';
  options?: FilterOption[];
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  searchable?: boolean;
}

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
  displayText: string;
}

interface SearchFiltersProps {
  // Configuración básica
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filtros
  filters: FilterConfig[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  
  // Opciones de datos
  categories: FilterOption[];
  locations: FilterOption[];
  states?: FilterOption[];
  suppliers?: FilterOption[];
  
  // Estado
  isLoading?: boolean;
  
  // Configuración visual
  layout?: 'horizontal' | 'vertical' | 'compact';
  showActiveFilters?: boolean;
  showFilterCount?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  
  // Callbacks
  onReset?: () => void;
  onPresetApply?: (preset: string) => void;
  
  // Clase CSS
  className?: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  onClear?: () => void;
  className?: string;
}

// ===== COMPONENTE DE BARRA DE BÚSQUEDA =====
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar equipos, suministros...",
  isLoading,
  onClear,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <DashboardTextInput
        id="search"
        name="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        icon={isLoading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <MagnifyingGlassIcon className="h-4 w-4" />
        )}
        clearable={!!value}
        onClear={onClear}
        className="mb-0"
      />
    </div>
  );
};

// ===== COMPONENTE DE FILTRO INDIVIDUAL =====
const FilterField: React.FC<{
  config: FilterConfig;
  value: any;
  onChange: (value: any) => void;
  options?: FilterOption[];
  isLoading?: boolean;
}> = ({ config, value, onChange, options = [], isLoading }) => {
  const renderField = () => {
    switch (config.type) {
      case 'select':
        return (
          <DashboardSelect
            id={config.key}
            name={config.key}
            label={config.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            options={[
              { value: '', label: config.placeholder || `Todas las ${config.label.toLowerCase()}` },
              ...options
            ]}
            className="mb-0"
            loading={isLoading}
            clearable={config.clearable}
            customDropdown={config.searchable}
            searchable={config.searchable}
          />
        );

      case 'checkbox':
        return (
          <DashboardCheckbox
            id={config.key}
            checked={!!value}
            onChange={onChange}
            label={config.label}
            description={config.placeholder}
          />
        );

      case 'text':
        return (
          <DashboardTextInput
            id={config.key}
            name={config.key}
            label={config.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            className="mb-0"
          />
        );

      case 'date':
        return (
          <DashboardTextInput
            id={config.key}
            name={config.key}
            label={config.label}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="mb-0"
          />
        );

      case 'multiselect':
        // Para multiselect, necesitaríamos un componente más complejo
        // Por ahora usamos select normal
        return (
          <DashboardSelect
            id={config.key}
            name={config.key}
            label={config.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            options={[
              { value: '', label: config.placeholder || `Seleccionar ${config.label.toLowerCase()}` },
              ...options
            ]}
            className="mb-0"
            loading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return <div className="flex-1">{renderField()}</div>;
};

// ===== COMPONENTE DE FILTROS ACTIVOS =====
const ActiveFilters: React.FC<{
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClear: () => void;
  className?: string;
}> = ({ filters, onRemove, onClear, className = '' }) => {
  if (filters.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500 font-medium">Filtros activos:</span>
      
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          size="sm"
          closable
          onClose={() => onRemove(filter.key)}
          className="flex items-center gap-1"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.displayText}</span>
        </Badge>
      ))}
      
      {filters.length > 1 && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={onClear}
          leftIcon={<XMarkIcon className="h-3 w-3" />}
          className="text-gray-500 hover:text-gray-700"
        >
          Limpiar todo
        </DashboardButton>
      )}
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilters,
  onFiltersChange,
  categories,
  locations,
  states = [],
  suppliers = [],
  isLoading = false,
  layout = 'horizontal',
  showActiveFilters = true,
  showFilterCount = true,
  collapsible = false,
  defaultExpanded = true,
  onReset,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Contar filtros activos
  const activeFilterCount = Object.values(activeFilters).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;

  // Generar lista de filtros activos para mostrar
  const getActiveFiltersList = useCallback((): ActiveFilter[] => {
    return filters
      .map(filter => {
        const value = activeFilters[filter.key];
        if (!value || value === '') return null;

        let displayText = value;
        
        // Buscar el label para selects
        if (filter.type === 'select' && filter.options) {
          const option = filter.options.find(opt => opt.value === value);
          displayText = option?.label || value;
        }

        // Para datos específicos
        if (filter.key === 'category_id') {
          const category = categories.find(cat => cat.value === value);
          displayText = category?.label || value;
        } else if (filter.key === 'location_id') {
          const location = locations.find(loc => loc.value === value);
          displayText = location?.label || value;
        } else if (filter.key === 'state_id') {
          const state = states.find(st => st.value === value);
          displayText = state?.label || value;
        }

        return {
          key: filter.key,
          label: filter.label,
          value,
          displayText
        };
      })
      .filter(Boolean) as ActiveFilter[];
  }, [activeFilters, filters, categories, locations, states]);

  // Obtener opciones para un filtro específico
  const getOptionsForFilter = (filter: FilterConfig): FilterOption[] => {
    switch (filter.key) {
      case 'category_id':
      case 'category':
        return categories;
      case 'location_id':
      case 'location':
        return locations;
      case 'state_id':
      case 'state':
        return states;
      case 'supplier_id':
      case 'supplier':
        return suppliers;
      default:
        return filter.options || [];
    }
  };

  // Manejar cambio de filtro individual
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value
    });
  };

  // Remover filtro específico
  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  // Limpiar todos los filtros
  const handleClearAll = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  // Resetear todo
  const handleReset = () => {
    handleClearAll();
    onReset?.();
  };

  // Clases para el layout
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'space-y-4';
      case 'compact':
        return 'grid grid-cols-1 md:grid-cols-3 gap-3';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
    }
  };

  const activeFiltersList = getActiveFiltersList();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            isLoading={isLoading}
            onClear={() => onSearchChange('')}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Toggle de filtros si es collapsible */}
          {collapsible && (
            <DashboardButton
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
              className={isExpanded ? 'bg-blue-50 border-blue-300' : ''}
            >
              Filtros
              {showFilterCount && activeFilterCount > 0 && (
                <Badge variant="primary" size="xs" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </DashboardButton>
          )}
          
          {/* Botón de reset */}
          {(activeFilterCount > 0 || searchValue) && (
            <DashboardButton
              variant="outline"
              onClick={handleReset}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Reset
            </DashboardButton>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {(!collapsible || isExpanded) && filters.length > 0 && (
        <div className={getLayoutClasses()}>
          {filters.map((filter) => (
            <FilterField
              key={filter.key}
              config={filter}
              value={activeFilters[filter.key]}
              onChange={(value) => handleFilterChange(filter.key, value)}
              options={getOptionsForFilter(filter)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Filtros activos */}
      {showActiveFilters && activeFiltersList.length > 0 && (
        <ActiveFilters
          filters={activeFiltersList}
          onRemove={handleRemoveFilter}
          onClear={handleClearAll}
        />
      )}
    </div>
  );
};

// ===== PRESETS DE FILTROS COMUNES =====
export const FilterPresets = {
  equipment: {
    available: { assigned_user_id: '', state_operational: true },
    assigned: { assigned_user_id: 'not_empty' },
    damaged: { state_operational: false },
    recent: { created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
  },
  supplies: {
    lowStock: { low_stock_only: true },
    outOfStock: { out_of_stock_only: true },
    active: { is_active: true },
    recent: { created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
  }
};

// ===== HOOK PERSONALIZADO PARA FILTROS =====
export const useSearchFilters = (initialFilters: Record<string, any> = {}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const hasActiveFilters = Object.values(activeFilters).some(
    value => value !== null && value !== undefined && value !== ''
  );

  const resetFilters = useCallback(() => {
    setSearchValue('');
    setActiveFilters({});
  }, []);

  const applyPreset = useCallback((preset: Record<string, any>) => {
    setActiveFilters(preset);
  }, []);

  const updateFilter = useCallback((key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    searchValue,
    setSearchValue,
    activeFilters,
    setActiveFilters,
    hasActiveFilters,
    resetFilters,
    applyPreset,
    updateFilter,
    removeFilter
  };
};

// ===== COMPONENTE DE FILTROS RÁPIDOS =====
export const QuickFilters: React.FC<{
  type: 'equipment' | 'supplies';
  onPresetApply: (preset: Record<string, any>) => void;
  activeFilters: Record<string, any>;
  className?: string;
}> = ({ type, onPresetApply, activeFilters, className = '' }) => {
  const presets = type === 'equipment' ? FilterPresets.equipment : FilterPresets.supplies;
  
  const isPresetActive = (preset: Record<string, any>) => {
    return Object.entries(preset).every(([key, value]) => activeFilters[key] === value);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className="text-sm text-gray-500 font-medium self-center">Filtros rápidos:</span>
      
      {Object.entries(presets).map(([key, preset]) => {
        const isActive = isPresetActive(preset);
        const labels = {
          equipment: {
            available: 'Disponibles',
            assigned: 'Asignados',
            damaged: 'Dañados',
            recent: 'Recientes'
          },
          supplies: {
            lowStock: 'Stock Bajo',
            outOfStock: 'Sin Stock',
            active: 'Activos',
            recent: 'Recientes'
          }
        };
        
        return (
          <DashboardButton
            key={key}
            variant={isActive ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPresetApply(preset)}
          >
            {labels[type][key as keyof typeof labels[typeof type]]}
          </DashboardButton>
        );
      })}
    </div>
  );
};

export default SearchFilters;