// src/features/dashboard/components/layout/DashboardLayout.tsx - Versión reestructurada

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../../auth/hooks/useAuth';
import LockScreen from '../../../auth/components/LockScreen';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Guardar la última ruta visitada
  useEffect(() => {
    if (state.isAuthenticated && !state.isLocked) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, state.isAuthenticated, state.isLocked]);
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-[var(--color-bg-main)] overflow-hidden">
      {/* Overlay para móviles */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity bg-black/50 ${
          sidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'
        } lg:hidden`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar para móviles y desktop con efecto flotante */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 lg:static lg:block transition-all transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Fondo del sidebar que permite ver el efecto flotante */}
        <div className="h-full bg-[var(--color-bg-main)] lg:bg-transparent">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar flotante */}
        <Navbar onMenuClick={toggleSidebar} />
        
        {/* Botón flotante para abrir sidebar en móviles */}
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[var(--color-accent-1)] text-[var(--color-text-main)] shadow-lg z-20 lg:hidden hover:bg-[var(--color-hover)] transition-colors"
          aria-label="Menu"
        >
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-main)] p-6 pt-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;