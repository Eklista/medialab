// src/features/dashboard/components/config/ConfigPageTemplate.tsx
import React, { ReactNode } from 'react';
import DashboardCard from '../ui/DashboardCard';

interface ConfigPageTemplateProps {
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
  tabs?: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: ReactNode;
    disabled?: boolean;
  }[];
  children: ReactNode;
  error?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const ConfigPageTemplate: React.FC<ConfigPageTemplateProps> = ({
  title,
  subtitle,
  actionButton,
  tabs,
  children,
  error,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className={`px-4 pt-4 ${headerClassName}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          
          {actionButton && (
            <div className="flex-shrink-0">
              {actionButton}
            </div>
          )}
        </div>
        
        {/* Tabs Navigation */}
        {tabs && tabs.length > 0 && (
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    disabled={tab.disabled}
                    className={`
                      group flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${tab.disabled
                        ? 'text-gray-400 cursor-not-allowed border-transparent'
                        : tab.isActive
                          ? 'border-black text-black'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <div className="flex-shrink-0">
                        {tab.badge}
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div>{error}</div>
      )}
      
      {/* Main Content */}
      <div className={contentClassName}>
        <DashboardCard 
          className="shadow-sm hover:shadow-md transition-shadow duration-200"
          noPadding={false}
        >
          <div className="min-h-0 flex-1">
            {children}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default ConfigPageTemplate;