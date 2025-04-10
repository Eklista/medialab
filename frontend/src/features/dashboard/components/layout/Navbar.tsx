// src/features/dashboard/components/layout/Navbar.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/hooks/useAuth';
import { 
  BellIcon, 
  ChevronDownIcon, 
  UserIcon, 
  LockClosedIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state, logout, lockSession } = useAuth();
  const navigate = useNavigate();
  
  // Función para alternar el menú de usuario
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Función para bloquear la sesión
  const handleLock = () => {
    lockSession();
  };
  
  // Cerrar el menú de usuario al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !((event.target as Element).closest('.user-menu-container'))) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);
  
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notificaciones (placeholder) */}
        <button className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
          <BellIcon className="h-6 w-6" />
        </button>
        
        {/* Menú de usuario */}
        <div className="relative user-menu-container">
          <button 
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {state.user?.firstName.charAt(0)}{state.user?.lastName.charAt(0)}
              </span>
            </div>
            <span className="hidden sm:inline font-medium">{state.user?.firstName} {state.user?.lastName}</span>
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          
          {/* Menú desplegable */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                Conectado como <span className="font-medium">{state.user?.email}</span>
              </div>
              
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/dashboard/settings');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Mi perfil
                </div>
              </button>
              
              <button
                onClick={handleLock}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-2" />
                  Bloquear sesión
                </div>
              </button>
              
              <div className="border-t border-gray-200 mt-1"></div>
              
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;