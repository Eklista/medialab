// src/features/dashboard/components/layout/DashboardLayout.tsx

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../../auth/hooks/useAuth';
import LockScreen from '../../../auth/components/LockScreen';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Overlay para móviles */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity bg-black/50 ${
          sidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'
        } lg:hidden`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar para móviles */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-(--color-text-main) lg:static lg:block transition-all transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={toggleSidebar} />
        
        {/* Botón para abrir sidebar en móviles (fuera del Navbar) */}
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 right-4 p-3 rounded-full bg-(--color-accent-1) text-(--color-text-main) shadow-lg z-20 lg:hidden"
          aria-label="Menu"
        >
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        
        {/* Contenido de la página - Eliminada la restricción de ancho máximo */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;