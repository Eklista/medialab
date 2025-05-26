// src/features/auth/components/ProtectedRoute.tsx

import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LockScreen from './LockScreen';

const ProtectedRoute: React.FC = () => {
  const { state, checkAuthStatus } = useAuth();
  const location = useLocation();
  
  // 🔥 MEJORADO: Verificar sesión solo cuando es necesario
  useEffect(() => {
    // Solo verificar si:
    // 1. No estamos autenticados
    // 2. No estamos cargando 
    // 3. Ya hemos inicializado
    // 4. No estamos haciendo logout
    if (!state.isAuthenticated && 
        !state.isLoading && 
        state.hasInitialized && 
        !state.isLoggingOut) {
      
      console.log('🔍 ProtectedRoute: Verificando autenticación...');
      checkAuthStatus();
    }
  }, [location.pathname, state.isAuthenticated, state.isLoading, state.hasInitialized]);
  
  // Guardar la última ruta visitada cuando el usuario está autenticado
  useEffect(() => {
    if (state.isAuthenticated && !state.isLocked) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, state.isAuthenticated, state.isLocked]);
  
  // 🔥 NUEVO: Mostrar loading mientras inicializa o verifica
  if (state.isLoading || !state.hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.isLoading ? 'Verificando sesión...' : 'Inicializando...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  // Si no está autenticado después de inicializar, redirigir al login
  if (!state.isAuthenticated && state.hasInitialized) {
    const lastPath = localStorage.getItem('lastPath');
    return (
      <Navigate 
        to="/ml-admin/login" 
        replace 
        state={{ from: lastPath ? { pathname: lastPath } : location }} 
      />
    );
  }
  
  // Usuario autenticado y sesión desbloqueada, mostrar el contenido protegido
  return <Outlet />;
};

export default ProtectedRoute;