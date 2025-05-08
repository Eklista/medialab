// src/features/dashboard/components/config/ConfigPageHeader.tsx
import React, { ReactNode } from 'react';

interface ConfigPageHeaderProps {
  title: string;
  actionButton?: ReactNode;
  tabs?: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[];
}

const ConfigPageHeader: React.FC<ConfigPageHeaderProps> = ({
  title,
  actionButton,
  tabs
}) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {actionButton && (
          <div className="flex-shrink-0">
            {actionButton}
          </div>
        )}
      </div>
      
      {tabs && tabs.length > 0 && (
        <div className="overflow-x-auto pb-px scrollbar-thin">
          <nav className="flex -mb-px px-6 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`py-4 px-6 border-b-2 text-sm font-medium whitespace-nowrap ${
                  tab.isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={tab.onClick}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default ConfigPageHeader;