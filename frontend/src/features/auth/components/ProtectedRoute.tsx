// src/features/auth/components/ProtectedRoute.tsx

import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LockScreen from './LockScreen';

const ProtectedRoute: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();
  
  // Guardar la última ruta visitada cuando el usuario está autenticado
  useEffect(() => {
    if (state.isAuthenticated && !state.isLocked) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, state.isAuthenticated, state.isLocked]);
  
  // Si el usuario no está autenticado, redirigir a la página de login
  if (!state.isAuthenticated || !state.user) {
    const lastPath = localStorage.getItem('lastPath');
    return <Navigate to="/ml-admin/login" replace state={{ from: lastPath ? { pathname: lastPath } : location }} />;
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isLocked) {
    return <LockScreen />;
  }
  
  // Usuario autenticado y sesión desbloqueada, mostrar el contenido protegido
  return <Outlet />;
};

export default ProtectedRoute;