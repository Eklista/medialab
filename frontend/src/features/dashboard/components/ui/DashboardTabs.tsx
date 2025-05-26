// src/features/dashboard/components/ui/DashboardTabs.tsx
import React from 'react';

export interface DashboardTab {
  id: string;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}

export interface DashboardTabsProps {
  tabs: DashboardTab[];
  variant?: 'default' | 'pills' | 'underline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  isLoading?: boolean;
  loadingCount?: number;
  fullWidth?: boolean;
  showDivider?: boolean;
  allowOverflow?: boolean;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  variant = 'default',
  size = 'md',
  className = '',
  orientation = 'horizontal',
  isLoading = false,
  loadingCount = 3,
  fullWidth = false,
  showDivider = true,
  allowOverflow = true
}) => {
  
  // Configuraciones de tamaño
  const sizeClasses = {
    sm: {
      padding: 'px-3 py-2',
      text: 'text-xs',
      iconSize: 'h-3 w-3',
      gap: 'gap-1.5',
      spacing: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1'
    },
    md: {
      padding: 'px-4 py-2.5',
      text: 'text-sm',
      iconSize: 'h-4 w-4',
      gap: 'gap-2',
      spacing: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1'
    },
    lg: {
      padding: 'px-6 py-3',
      text: 'text-base',
      iconSize: 'h-5 w-5',
      gap: 'gap-2.5',
      spacing: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2'
    }
  };

  // Configuraciones de variante
  const variantClasses = {
    default: {
      active: 'bg-blue-100 text-blue-700 border border-blue-200',
      inactive: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
      disabled: 'opacity-50 cursor-not-allowed',
      base: 'rounded-lg transition-all duration-200 font-medium'
    },
    pills: {
      active: 'bg-blue-600 text-white shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
      disabled: 'opacity-50 cursor-not-allowed',
      base: 'rounded-full transition-all duration-200 font-medium border border-transparent'
    },
    underline: {
      active: 'text-blue-600 border-b-2 border-blue-600',
      inactive: 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300',
      disabled: 'opacity-50 cursor-not-allowed border-b-2 border-transparent',
      base: 'transition-all duration-200 font-medium'
    },
    minimal: {
      active: 'text-blue-600 bg-blue-50',
      inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
      disabled: 'opacity-50 cursor-not-allowed',
      base: 'transition-all duration-200 font-medium rounded-md'
    }
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  // Renderizar loading state
  if (isLoading) {
    return (
      <div className={`
        ${orientation === 'horizontal' ? 'flex' : 'flex flex-col'} 
        ${currentSize.spacing} 
        ${allowOverflow && orientation === 'horizontal' ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300' : ''}
        ${className}
      `}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <div
            key={index}
            className={`
              ${currentSize.padding} ${currentVariant.base}
              bg-gray-200 animate-pulse
              ${orientation === 'horizontal' ? 'flex-shrink-0' : 'w-full'}
              h-10 rounded-lg
            `}
            style={{ width: orientation === 'horizontal' ? `${60 + Math.random() * 40}px` : undefined }}
          />
        ))}
      </div>
    );
  }

  // Container classes
  const containerClasses = [
    orientation === 'horizontal' ? 'flex' : 'flex flex-col',
    currentSize.spacing,
    allowOverflow && orientation === 'horizontal' ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300' : '',
    fullWidth && orientation === 'horizontal' ? 'w-full' : '',
    showDivider && orientation === 'horizontal' ? 'border-b border-gray-200 pb-0' : '',
    showDivider && orientation === 'vertical' ? 'border-r border-gray-200 pr-4' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={containerClasses} role="tablist">
      {tabs.map((tab) => {
        const isDisabled = tab.disabled || isLoading;
        
        return (
          <button
            key={tab.id}
            onClick={!isDisabled ? tab.onClick : undefined}
            disabled={isDisabled}
            role="tab"
            aria-selected={tab.isActive}
            aria-controls={`tabpanel-${tab.id}`}
            title={tab.description}
            className={`
              ${currentSize.padding}
              ${currentSize.text}
              ${currentVariant.base}
              ${tab.isActive 
                ? currentVariant.active 
                : isDisabled 
                  ? currentVariant.disabled
                  : currentVariant.inactive
              }
              ${orientation === 'horizontal' && !fullWidth ? 'flex-shrink-0' : ''}
              ${fullWidth && orientation === 'horizontal' ? 'flex-1' : ''}
              ${orientation === 'vertical' ? 'w-full justify-start' : ''}
              flex items-center ${currentSize.gap}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${!isDisabled ? 'cursor-pointer' : ''}
            `}
          >
            {/* Icono */}
            {tab.icon && (
              <span className={`${currentSize.iconSize} flex-shrink-0 flex items-center justify-center`}>
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span className={orientation === 'vertical' ? 'truncate' : ''}>{tab.label}</span>

            {/* Badge personalizado */}
            {tab.badge && !isLoading && (
              <span className="flex-shrink-0">{tab.badge}</span>
            )}

            {/* Contador */}
            {tab.count !== undefined && !isLoading && !tab.badge && (
              <span className={`
                px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium
                ${tab.isActive 
                  ? variant === 'pills' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
                }
                ${isDisabled ? 'opacity-50' : ''}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

// Subcomponente para el contenido de las tabs
export interface DashboardTabPanelProps {
  tabId: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  unmountOnHide?: boolean;
  lazy?: boolean;
}

export const DashboardTabPanel: React.FC<DashboardTabPanelProps> = ({
  tabId,
  isActive,
  children,
  className = '',
  unmountOnHide = false,
  lazy = false
}) => {
  const [hasBeenActive, setHasBeenActive] = React.useState(isActive);

  React.useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  // Si es lazy y nunca ha estado activo, no renderizar nada
  if (lazy && !hasBeenActive) {
    return null;
  }

  // Si unmountOnHide está activado y no está activo, no renderizar
  if (unmountOnHide && !isActive) {
    return null;
  }

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={`
        ${isActive ? 'block' : 'hidden'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Hook para manejar el estado de las tabs más fácilmente
export const useDashboardTabs = (initialTabId: string) => {
  const [activeTabId, setActiveTabId] = React.useState(initialTabId);

  const createTab = (
    id: string, 
    label: string, 
    options: Partial<Omit<DashboardTab, 'id' | 'label' | 'isActive' | 'onClick'>> = {}
  ): DashboardTab => ({
    id,
    label,
    isActive: activeTabId === id,
    onClick: () => setActiveTabId(id),
    ...options
  });

  return {
    activeTabId,
    setActiveTabId,
    createTab
  };
};

export default DashboardTabs;