// src/features/dashboard/components/ui/DashboardCard.tsx
import React from 'react';

export interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  hover?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  headerAction,
  noPadding = false,
  variant = 'default',
  size = 'md',
  icon,
  badge,
  loading = false,
  error = null,
  onRetry,
  collapsible = false,
  defaultCollapsed = false,
  hover = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const hasHeader = title || subtitle || headerAction || icon || badge;
  
  // Variant styles
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    bordered: 'bg-white border-2 border-gray-300',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm'
  };
  
  // Size styles
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  // Padding styles based on size
  const paddingClasses = {
    sm: noPadding ? '' : 'p-4',
    md: noPadding ? '' : 'p-6',
    lg: noPadding ? '' : 'p-8'
  };
  
  const headerPaddingClasses = {
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-5'
  };
  
  const footerPaddingClasses = {
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-5'
  };
  
  // Loading skeleton
  if (loading) {
    return (
      <div className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        rounded-xl overflow-hidden animate-pulse
        ${className}
      `}>
        {hasHeader && (
          <div className={`${headerPaddingClasses[size]} border-b border-gray-200`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && <div className="h-6 w-6 bg-gray-200 rounded"></div>}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  {subtitle && <div className="h-3 bg-gray-200 rounded w-32"></div>}
                </div>
              </div>
              {headerAction && <div className="h-8 bg-gray-200 rounded w-20"></div>}
            </div>
          </div>
        )}
        
        <div className={paddingClasses[size]}>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-3/5"></div>
          </div>
        </div>
        
        {footer && (
          <div className={`${footerPaddingClasses[size]} border-t border-gray-200 bg-gray-50`}>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        )}
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        rounded-xl overflow-hidden
        ${className}
      `}>
        {hasHeader && (
          <div className={`${headerPaddingClasses[size]} border-b border-gray-200`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    {icon}
                  </div>
                )}
                <div>
                  {title && <h3 className="font-medium text-gray-900">{title}</h3>}
                  {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
                {badge && <div className="ml-auto">{badge}</div>}
              </div>
              {headerAction && (
                <div className="flex-shrink-0 ml-4">
                  {headerAction}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={paddingClasses[size]}>
          <div className="text-center py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            {onRetry && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>
        
        {footer && (
          <div className={`${footerPaddingClasses[size]} border-t border-gray-200 bg-gray-50`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`
      ${variantClasses[variant]} 
      ${sizeClasses[size]} 
      rounded-xl overflow-hidden
      ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300' : ''}
      ${className}
    `}>
      {/* Header */}
      {hasHeader && (
        <div className={`${headerPaddingClasses[size]} border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                  <span className="h-5 w-5 text-blue-600 flex items-center justify-center">
                    {icon}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {title && (
                    <h3 className="font-semibold text-gray-900 truncate">
                      {title}
                    </h3>
                  )}
                  {badge && <div className="flex-shrink-0">{badge}</div>}
                </div>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {headerAction && <div>{headerAction}</div>}
              {collapsible && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg 
                    className={`h-4 w-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      {!isCollapsed && (
        <div className={paddingClasses[size]}>
          {children}
        </div>
      )}
      
      {/* Footer */}
      {footer && !isCollapsed && (
        <div className={`${footerPaddingClasses[size]} border-t border-gray-200 bg-gray-50`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;