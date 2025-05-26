// frontend/src/features/dashboard/components/config/ConfigSidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export interface ConfigMenuItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface ConfigSidebarProps {
  items: ConfigMenuItem[];
  activeItemId: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  items,
  activeItemId,
  title = 'Configuración',
  className = '',
  compact = false
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {title && !compact && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <nav className={compact ? "p-2" : "p-4"}>
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = activeItemId === item.id;
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`
                    group flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200
                    ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                    ${item.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : isActive 
                        ? 'bg-black text-white shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                    }
                  `}
                  aria-disabled={item.disabled}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {item.icon && (
                      <span className={`flex-shrink-0 ${compact ? 'mr-2' : 'mr-3'}`}>
                        <span className={`
                          h-5 w-5 flex items-center justify-center
                          ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                          ${item.disabled ? 'text-gray-400' : ''}
                        `}>
                          {item.icon}
                        </span>
                      </span>
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  
                  {item.badge && (
                    <div className="flex-shrink-0 ml-2">
                      {item.badge}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default ConfigSidebar;