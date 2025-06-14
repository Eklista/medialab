// src/features/dashboard/components/layout/DashboardLayout.tsx - CON CALENDAR

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../../../auth/hooks/useAuth';
import LockScreen from '../../../auth/components/LockScreen';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ClipboardDocumentListIcon, 
  BellIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { RightSidebarSection } from '../rightSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true; // Por defecto colapsado
  });
  const [rightSidebarSection, setRightSidebarSection] = useState<RightSidebarSection>(null);
  // Estados para móvil
  const [mobileLeftSidebarOpen, setMobileLeftSidebarOpen] = useState(false);
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false);
  const [mobilePanelSection, setMobilePanelSection] = useState<RightSidebarSection>('calendar'); // Default calendar
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

  const handleRightSidebarItemClick = (section: RightSidebarSection) => {
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

  const handleMobilePanelSectionChange = (section: RightSidebarSection) => {
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
          onToggleCollapse={toggleSidebarCollapse}
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

      {/* Contenido principal FLOTANTE - MENOS padding en móvil */}
      <div className="flex flex-col flex-1 overflow-hidden lg:p-3 md:p-2 p-1 lg:pb-3 md:pb-2 pb-1">
        <div className="flex flex-col flex-1 bg-[var(--color-bg-main)] lg:rounded-xl md:rounded-lg rounded-md shadow-lg overflow-hidden lg:mb-0 md:mb-12 mb-10">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-zinc-50 lg:p-6 md:p-4 p-3 lg:pt-4 md:pt-3 pt-2 pb-14 sm:pb-3">
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

            <button 
              onClick={() => handleRightSidebarItemClick('online-users')}
              className={`w-full flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                rightSidebarSection === 'online-users' 
                  ? 'bg-white/10 text-[var(--color-accent-1)]' 
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Usuarios Online"
            >
              <UserGroupIcon className="h-6 w-6" />
              <span className="w-2 h-2 bg-green-500 rounded-full mt-1"></span>
            </button>

            {/* 🆕 Nuevo botón para calendario */}
            <button 
              onClick={() => handleRightSidebarItemClick('calendar')}
              className={`w-full flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                rightSidebarSection === 'calendar' 
                  ? 'bg-white/10 text-[var(--color-accent-1)]' 
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Mi Agenda"
            >
              <CalendarDaysIcon className="h-6 w-6" />
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
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
          
          {/* Tabs para cambiar sección - 🆕 Agregado calendario */}
          <div className="flex bg-white/10 rounded-lg p-1 text-xs">
            <button 
              onClick={() => handleMobilePanelSectionChange('calendar')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-all duration-200 ${
                mobilePanelSection === 'calendar' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Agenda
            </button>
            <button 
              onClick={() => handleMobilePanelSectionChange('tasks')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-all duration-200 ${
                mobilePanelSection === 'tasks' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Tareas
            </button>
            <button 
              onClick={() => handleMobilePanelSectionChange('notifications')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-all duration-200 ${
                mobilePanelSection === 'notifications' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Actividad
            </button>
            <button 
              onClick={() => handleMobilePanelSectionChange('online-users')}
              className={`flex-1 py-2 px-2 rounded-md font-medium transition-all duration-200 ${
                mobilePanelSection === 'online-users' 
                  ? 'bg-[var(--color-accent-1)] text-[var(--color-text-main)]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Usuarios
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

      {/* Bottom bar MÁS COMPACTO - solo móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-10 lg:hidden bg-[var(--color-text-main)] px-3 py-2">
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
            <Bars3Icon className="h-4 w-4" />
            <span className="text-xs mt-0.5 font-medium">Menú</span>
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
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span className="text-xs mt-0.5 font-medium">Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;