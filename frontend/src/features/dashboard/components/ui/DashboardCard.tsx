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
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  headerAction,
  noPadding = false,
}) => {
  const hasHeader = title || subtitle || headerAction;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Card Header */}
      {hasHeader && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="flex-shrink-0 ml-4">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;