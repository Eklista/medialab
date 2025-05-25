// src/features/dashboard/components/layout/Navbar.tsx - UI mejorada según imagen

import React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';

interface NavbarProps {
  // Sin props ya que quitamos el botón
}

const Navbar: React.FC<NavbarProps> = () => {
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
    <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white">
      {/* Saludo y mensaje de bienvenida */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-main)] mb-1">
          {getGreeting()}, {getFirstName()}! 👋
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Revisa tus proyectos, tareas o solicitudes de hoy
        </p>
      </div>
      
      {/* Espacio vacío - sin botones */}
      <div></div>
    </div>
  );
};

export default Navbar;