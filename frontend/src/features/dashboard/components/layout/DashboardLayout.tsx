// src/features/dashboard/components/layout/DashboardLayout.tsx - Corregido

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../../../auth/hooks/useAuth';
import LockScreen from '../../../auth/components/LockScreen';
import { Bars3Icon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentListIcon, BellIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [rightSidebarSection, setRightSidebarSection] = useState<'tasks' | 'notifications' | null>(null);
  // Estados para móvil
  const [mobileLeftSidebarOpen, setMobileLeftSidebarOpen] = useState(false);
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false);
  const [mobilePanelSection, setMobilePanelSection] = useState<'tasks' | 'notifications'>('tasks');
  const location = useLocation();
  
  useEffect(() => {
    if (state.isAuthenticated && !state.isLocked) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, state.isAuthenticated, state.isLocked]);
  
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  const toggleSidebarCollapse = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
  };

  const handleRightSidebarItemClick = (section: 'tasks' | 'notifications') => {
    if (rightSidebarSection === section) {
      setRightSidebarSection(null);
    } else {
      setRightSidebarSection(section);
    }
  };

  const closeRightSidebar = () => {
    setRightSidebarSection(null);
  };

  // Funciones para móvil - solo una barra a la vez
  const toggleMobileLeftSidebar = () => {
    if (mobileRightSidebarOpen) {
      setMobileRightSidebarOpen(false);
      setRightSidebarSection(null);
    }
    setMobileLeftSidebarOpen(!mobileLeftSidebarOpen);
  };

  const toggleMobileRightSidebar = () => {
    if (mobileLeftSidebarOpen) {
      setMobileLeftSidebarOpen(false);
    }
    setMobileRightSidebarOpen(!mobileRightSidebarOpen);
    if (!mobileRightSidebarOpen) {
      // Si se abre, usar la sección actual del panel móvil
      setRightSidebarSection(mobilePanelSection);
    } else {
      setRightSidebarSection(null);
    }
  };

  const handleMobilePanelSectionChange = (section: 'tasks' | 'notifications') => {
    setMobilePanelSection(section);
    setRightSidebarSection(section);
  };
  
  return (
    <div className="flex h-screen bg-[var(--color-text-main)] overflow-hidden relative">
      {/* Overlay para móviles - sidebar izquierdo */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity bg-black/50 lg:hidden ${
          mobileLeftSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'
        }`}
        onClick={() => setMobileLeftSidebarOpen(false)}
      />

      {/* Overlay para móviles - sidebar derecho */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity bg-black/50 lg:hidden ${
          mobileRightSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'
        }`}
        onClick={() => setMobileRightSidebarOpen(false)}
      />
      
      {/* Sidebar izquierdo - OCULTO en móvil */}
      <div 
        className={`hidden lg:flex inset-y-0 left-0 z-30 transition-all flex-col ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <Sidebar 
          onClose={() => {}} 
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Sidebar izquierdo móvil */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 transition-all transform lg:hidden ${
          mobileLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
          onClose={() => setMobileLeftSidebarOpen(false)} 
          collapsed={false}
        />
      </div>

      {/* Botón de colapsar sidebar izquierdo - SOLO desktop */}
      <div
        className={`hidden lg:block fixed z-40 top-6 ${
          sidebarCollapsed ? 'left-20' : 'left-72'
        }`}
        style={{ 
          transition: 'left 0.3s ease-in-out'
        }}
      >
        <button
          onClick={toggleSidebarCollapse}
          className="relative bg-[var(--color-text-main)] hover:bg-[var(--color-text-main)]/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '0 50% 50% 0',
            marginLeft: '-20px'
          }}
          aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <div className="flex items-center justify-center w-full h-full ml-2">
            {sidebarCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-white font-bold" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-white font-bold" />
            )}
          </div>
        </button>
      </div>
      
      {/* Contenido principal FLOTANTE - bordes redondeados abajo en móvil */}
      <div className="flex flex-col flex-1 overflow-hidden p-3 lg:pb-3 pb-3">
        <div className="flex flex-col flex-1 bg-[var(--color-bg-main)] lg:rounded-xl rounded-t-xl shadow-lg overflow-hidden lg:mb-0 mb-16">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-[var(--color-bg-main)] p-6 pt-4">
            {children}
          </main>
        </div>
      </div>

      {/* Sidebar derecho - OCULTO en móvil */}
      <div className={`hidden lg:flex transition-all duration-300 ${
        rightSidebarSection ? 'w-96' : 'w-20'
      } bg-[var(--color-text-main)]`}>
        {/* Barra de iconos siempre visible */}
        <div className="w-20 flex flex-col">
          <div className="p-4 border-b border-white/10"></div>
          <div className="p-2 space-y-2">
            <button 
              onClick={() => handleRightSidebarItemClick('tasks')}
              className={`w-full flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                rightSidebarSection === 'tasks' 
                  ? 'bg-white/10 text-[var(--color-accent-1)]' 
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Mis Tareas"
            >
              <ClipboardDocumentListIcon className="h-6 w-6" />
              <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1"></span>
            </button>
            
            <button 
              onClick={() => handleRightSidebarItemClick('notifications')}
              className={`w-full flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                rightSidebarSection === 'notifications' 
                  ? 'bg-white/10 text-[var(--color-accent-1)]' 
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Actividad Reciente"
            >
              <BellIcon className="h-6 w-6" />
              <span className="w-2 h-2 bg-[var(--color-accent-1)] rounded-full mt-1"></span>
            </button>
          </div>
        </div>
        
        {/* Panel expandido - parte del mismo sidebar */}
        {rightSidebarSection && (
          <div className="flex-1 border-l border-white/10">
            <RightSidebar 
              activeSection={rightSidebarSection}
              onClose={closeRightSidebar}
            />
          </div>
        )}
      </div>

      {/* Sidebar derecho móvil con tabs */}
      <div 
        className={`fixed inset-y-0 right-0 z-30 w-80 transition-all transform lg:hidden ${
          mobileRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } bg-[var(--color-text-main)]`}
      >
        {/* Header con tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Panel de Control</h2>
            <button 
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              onClick={() => setMobileRightSidebarOpen(false)}
              aria-label="Cerrar panel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Tabs para cambiar sección */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button 
              onClick={() => handleMobilePanelSectionChange('tasks')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                mobilePanelSection === 'tasks' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Tareas
            </button>
            <button 
              onClick={() => handleMobilePanelSectionChange('notifications')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                mobilePanelSection === 'notifications' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Actividad
            </button>
          </div>
        </div>
        
        {/* Contenido según la sección */}
        <div className="flex-1 overflow-hidden">
          <RightSidebar 
            activeSection={mobilePanelSection}
            onClose={() => {}} // No mostrar botón X aquí, ya está arriba
          />
        </div>
      </div>

      {/* Bottom bar NEGRO y compacto */}
      <div className="fixed bottom-0 left-0 right-0 z-10 lg:hidden bg-[var(--color-text-main)] px-4 py-3">
        <div className="flex items-center justify-center max-w-xs mx-auto">
          {/* Botón sidebar izquierdo - Navegación */}
          <button
            onClick={toggleMobileLeftSidebar}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 flex-1 ${
              mobileLeftSidebarOpen 
                ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bars3Icon className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Navegación</span>
          </button>

          {/* Botón sidebar derecho - Panel */}
          <button
            onClick={toggleMobileRightSidebar}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 flex-1 ${
              mobileRightSidebarOpen 
                ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;