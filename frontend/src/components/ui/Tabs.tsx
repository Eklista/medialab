// src/components/ui/Tabs.tsx
import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  
  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variants = {
    default: {
      container: 'bg-gray-100 rounded-lg p-1',
      tab: (isActive: boolean) => `
        rounded-md transition-all duration-200 font-medium
        ${isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        }
      `,
    },
    pills: {
      container: 'space-x-2',
      tab: (isActive: boolean) => `
        rounded-full transition-all duration-200 font-medium border
        ${isActive 
          ? 'bg-gray-900 text-white border-gray-900' 
          : 'text-gray-600 border-gray-300 hover:text-gray-900 hover:border-gray-400'
        }
      `,
    },
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive: boolean) => `
        border-b-2 transition-all duration-200 font-medium relative
        ${isActive 
          ? 'border-gray-900 text-gray-900' 
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        }
      `,
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={className}>
      <div className={`flex ${fullWidth ? 'w-full' : ''} ${currentVariant.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              ${sizes[size]} ${currentVariant.tab(activeTab === tab.id)}
              ${fullWidth ? 'flex-1' : ''}
              flex items-center justify-center gap-2
            `}
          >
            {tab.icon && (
              <span className="flex-shrink-0">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${activeTab === tab.id 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};