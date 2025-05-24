// src/features/dashboard/components/layout/Navbar.tsx - En español con UI moderna

import React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { 
  BellIcon, 
  Bars3Icon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { state } = useAuth();
  
  // Función para obtener el nombre de manera segura
  const getFirstName = () => {
    if (!state.user) return 'Usuario';
    const firstName = state.user.firstName;
    return firstName || state.user.email?.split('@')[0] || 'Usuario';
  };

  // Función para obtener el saludo según la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };
  
  return (
    <div className="mx-2 mt-2 mb-0 bg-white rounded-lg shadow-sm border border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
      {/* Menú hamburguesa para móviles */}
      <button 
        className="lg:hidden mr-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] transition-colors" 
        onClick={onMenuClick}
        aria-label="Menú"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
      
      {/* Saludo y mensaje de bienvenida */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-main)] mb-1">
          {getGreeting()}, {getFirstName()}! 👋
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Revisa tus proyectos, tareas o solicitudes de hoy
        </p>
      </div>
      
      {/* Acciones del lado derecho */}
      <div className="flex items-center">
        {/* Botón de notificaciones circular moderno */}
        <button className="relative p-3 rounded-full bg-[var(--color-text-main)] text-white hover:bg-[var(--color-text-main)]/90 transition-all duration-200 shadow-lg hover:shadow-xl">
          <BellIcon className="h-5 w-5" />
          {/* Indicador de notificaciones */}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-[var(--color-accent-1)] rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;