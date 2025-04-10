// src/features/auth/components/ProtectedRoute.tsx

import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LockScreen from './LockScreen';

const ProtectedRoute: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();
  
  // Añadir logs para depuración
  useEffect(() => {
    console.log('ProtectedRoute rendered at', location.pathname);
    console.log('Auth state:', { 
      isAuthenticated: state.isAuthenticated,
      isLocked: state.isLocked,
      user: state.user ? `${state.user.firstName} (${state.user.email})` : 'none'
    });
  }, [location.pathname, state]);
  
  // Si el usuario no está autenticado, redirigir a la página de login
  if (!state.isAuthenticated || !state.user) {
    console.log('No autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isLocked) {
    console.log('Sesión bloqueada, mostrando LockScreen');
    return <LockScreen />;
  }
  
  // Usuario autenticado y sesión desbloqueada, mostrar el contenido protegido
  console.log('Autenticado, mostrando contenido protegido');
  return <Outlet />;
};

export default ProtectedRoute;