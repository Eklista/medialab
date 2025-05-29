// src/features/dashboard/components/layout/Navbar.tsx
import React from 'react';
import { useCurrentUser, getTimeBasedGreeting } from '../../utils/userUtils';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { user: currentUser } = useCurrentUser();
 
  // Función para obtener el primer nombre de manera segura
  const getFirstName = () => {
    if (!currentUser) return 'Usuario';
    
    // Priorizar firstName, luego extraer de email si no existe
    if (currentUser.firstName) {
      return currentUser.firstName;
    }
    
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    
    return 'Usuario';
  };
 
  return (
    <div className={`px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white ${className || ''}`}>
      {/* Saludo y mensaje de bienvenida */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-main)] mb-1">
          {getTimeBasedGreeting()}, {getFirstName()}! 👋
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Revisa tus proyectos, tareas o solicitudes de hoy
        </p>
      </div>
    </div>
  );
};

export default Navbar;