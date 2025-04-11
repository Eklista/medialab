// src/features/dashboard/components/config/ConfigSidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export interface ConfigMenuItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface ConfigSidebarProps {
  items: ConfigMenuItem[];
  activeItemId: string;
  title?: string;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  items,
  activeItemId,
  title = 'Configuración'
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${activeItemId === item.id 
                    ? 'bg-black text-white' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ConfigSidebar;