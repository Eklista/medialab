// src/features/auth/components/ProtectedRoute.tsx - UPDATED VERSION
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../../../context/AppDataContext';
import LockScreen from './LockScreen';

const ProtectedRoute: React.FC = () => {
  const { state: authState, checkAuthStatus } = useAuth();
  const { isLoading, isInitialized } = useAppData();
  const location = useLocation();
  
  // 🆕 Verificar sesión solo cuando es necesario y coordinado
  useEffect(() => {
    // Solo verificar si:
    // 1. No estamos autenticados
    // 2. Ambos contextos están inicializados
    // 3. No estamos en proceso de logout
    // 4. No estamos ya cargando
    if (!authState.isAuthenticated && 
        authState.hasInitialized && 
        isInitialized &&
        !authState.isLoggingOut && 
        !isLoading &&
        !authState.isCheckingAuth) {
      
      console.log('🔍 ProtectedRoute: Verificando autenticación...');
      checkAuthStatus();
    }
  }, [
    location.pathname, 
    authState.isAuthenticated, 
    authState.hasInitialized, 
    authState.isLoggingOut,
    authState.isCheckingAuth,
    isLoading,
    isInitialized,
    checkAuthStatus
  ]);
  
  // Guardar la última ruta visitada cuando el usuario está autenticado
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLocked) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, authState.isAuthenticated, authState.isLocked]);
  
  // 🆕 IMPROVED: Loading states más específicos y coordinados
  if (!isInitialized || !authState.hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Inicializando aplicación...
          </p>
        </div>
      </div>
    );
  }

  // Si estamos verificando autenticación, mostrar loading
  if (authState.isCheckingAuth || (isLoading && !authState.isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }
  
  // 🆕 IMPROVED: Mejor manejo de logout en progreso
  if (authState.isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Cerrando sesión...
          </p>
        </div>
      </div>
    );
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (authState.isAuthenticated && authState.isLocked) {
    return <LockScreen />;
  }
  
  // Si no está autenticado después de inicializar ambos contextos, redirigir al login
  if (!authState.isAuthenticated && authState.hasInitialized && isInitialized) {
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