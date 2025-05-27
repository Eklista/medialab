// src/components/layout/BottomNavigation.tsx - Creado desde cero
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  Squares2X2Icon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid
} from '@heroicons/react/24/solid';
import { MobileExploreSidebar } from './MobileExploreSidebar';

interface BottomNavigationProps {
  onCategorySelect?: (facultadId: string, categoryId: string) => void;
  onFacultySelect?: (facultadId: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onCategorySelect,
  onFacultySelect
}) => {
  const location = useLocation();
  const [showExploreSidebar, setShowExploreSidebar] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Explore Sidebar */}
      <MobileExploreSidebar
        isOpen={showExploreSidebar}
        onClose={() => setShowExploreSidebar(false)}
        onCategorySelect={onCategorySelect}
        onFacultySelect={onFacultySelect}
      />

      {/* Bottom Navigation Bar - Solo visible en móviles */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/') 
                ? 'text-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isActive('/') ? (
              <HomeIconSolid className="h-6 w-6 mb-1" />
            ) : (
              <HomeIcon className="h-6 w-6 mb-1" />
            )}
            <span className="text-xs font-medium">Inicio</span>
          </Link>

          {/* Explore */}
          <button
            onClick={() => setShowExploreSidebar(true)}
            className="flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <Squares2X2Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Explorar</span>
          </button>

          {/* Request Service */}
          <Link
            to="/request"
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/request') 
                ? 'text-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isActive('/request') ? (
              <PlusIconSolid className="h-6 w-6 mb-1" />
            ) : (
              <PlusIcon className="h-6 w-6 mb-1" />
            )}
            <span className="text-xs font-medium">Servicio</span>
          </Link>
        </div>
      </div>
    </>
  );
};