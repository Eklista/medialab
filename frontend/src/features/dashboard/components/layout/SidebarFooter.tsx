// src/features/dashboard/components/layout/SidebarFooter.tsx - UI mejorada con soporte para modo colapsado
import React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { UserIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

interface SidebarFooterProps {
  collapsed?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed = false }) => {
  const { lockSession, state } = useAuth();
  const navigate = useNavigate();
 
  const handleLock = () => {
    console.log("Botón de bloqueo presionado en SidebarFooter/Navbar");
    localStorage.setItem('lastPathBeforeLock', window.location.pathname);
    console.log("Ruta guardada:", window.location.pathname);
    lockSession();
  };
  
  // Navegación a perfil de usuario
  const handleNavigateToProfile = () => {
    // Navegar a la página de perfil del usuario actual
    if (state.user && state.user.id) {
      navigate(`/dashboard/users/${state.user.id}`);
    }
  };
 
  return (
    <div className={`p-3 border-t border-white/10 ${collapsed ? 'px-2' : ''}`}>
      {!collapsed ? (
        <>
          {/* Mi perfil */}
          <button
            onClick={handleNavigateToProfile}
            className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 text-white/70 hover:text-white group mb-1"
          >
            <UserIcon className="h-5 w-5 text-white/60 group-hover:text-white/80 mr-3" />
            <span className="font-medium text-sm">Mi Perfil</span>
          </button>
          
          {/* Bloquear sesión */}
          <button
            onClick={handleLock}
            className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 text-white/70 hover:text-white group"
          >
            <LockClosedIcon className="h-5 w-5 text-white/60 group-hover:text-white/80 mr-3" />
            <span className="font-medium text-sm">Bloquear Sesión</span>
          </button>
         
          {/* Copyright */}
          <div className="mt-4 text-xs text-white/40 text-center">
            <p className="font-medium">MediaLab Dashboard</p>
            <p>© {new Date().getFullYear()} Univ. Galileo</p>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {/* Mi perfil colapsado */}
          <button
            onClick={handleNavigateToProfile}
            className="flex items-center justify-center w-full p-3 rounded-lg hover:bg-white/5 transition-all duration-200 text-white/70 hover:text-white"
            title="Mi Perfil"
          >
            <UserIcon className="h-5 w-5" />
          </button>
          
          {/* Bloquear sesión colapsado */}
          <button
            onClick={handleLock}
            className="flex items-center justify-center w-full p-3 rounded-lg hover:bg-white/5 transition-all duration-200 text-white/70 hover:text-white"
            title="Bloquear Sesión"
          >
            <LockClosedIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;