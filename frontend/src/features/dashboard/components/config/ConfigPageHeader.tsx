// src/features/dashboard/components/config/ConfigPageHeader.tsx
import React from 'react';

export interface ConfigPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    count?: number;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    badge?: React.ReactNode;
  }>;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  stats?: Array<{
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  }>;
}

const ConfigPageHeader: React.FC<ConfigPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actionButton,
  tabs,
  isLoading = false,
  hasError = false,
  onRetry,
  stats
}) => {

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header principal */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0 lg:space-x-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Icono de la página */}
            {icon && (
              <div className="flex-shrink-0 p-2 sm:p-3 bg-blue-100 rounded-xl">
                <div className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}

            {/* Título y subtítulo */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-32 sm:w-48"></div>
                  ) : (
                    title
                  )}
                </h1>
                
                {hasError && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm text-red-600 hover:text-red-800 font-medium flex-shrink-0 mt-1 sm:mt-0"
                  >
                    Reintentar
                  </button>
                )}
              </div>
              
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 break-words leading-relaxed">
                  {isLoading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-48 sm:w-64 mt-2"></div>
                  ) : (
                    subtitle
                  )}
                </p>
              )}

              {/* Estadísticas rápidas */}
              {stats && stats.length > 0 && !isLoading && (
                <div className="mt-3 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{stat.label}:</span>
                      <span 
                        className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                          stat.variant === 'success' ? 'text-green-600' :
                          stat.variant === 'warning' ? 'text-amber-600' :
                          stat.variant === 'danger' ? 'text-red-600' :
                          'text-gray-900'
                        }`}
                      >
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón de acción */}
          {actionButton && !isLoading && (
            <div className="flex-shrink-0 w-full sm:w-auto">
              {actionButton}
            </div>
          )}

          {/* Loading placeholder para el botón */}
          {isLoading && (
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full sm:w-32"></div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="mt-6">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  disabled={tab.disabled || isLoading}
                  className={`
                    flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${tab.isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                    ${tab.disabled || isLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                    }
                    flex items-center gap-1.5 sm:gap-2
                  `}
                >
                  <span className="whitespace-nowrap">{isLoading ? 'Cargando...' : tab.label}</span>
                  
                  {/* Badge del tab */}
                  {tab.badge && !isLoading && (
                    <span>{tab.badge}</span>
                  )}
                  
                  {/* Contador del tab */}
                  {tab.count !== undefined && !isLoading && (
                    <span className={`
                      px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full whitespace-nowrap
                      ${tab.isActive 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPageHeader;