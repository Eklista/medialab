// frontend/src/features/auth/components/AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LockScreen from './LockScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean; // Nuevo: permite controlar si requiere autenticación
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <Navigate to="/ml-admin/login" replace />,
  requireAuth = true
}) => {
  const { state, checkAuthStatus } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const performAuthCheck = async () => {
      try {
        setHasChecked(false);
        
        // Solo verificar si requerimos autenticación y no estamos ya autenticados
        if (requireAuth && !state.isAuthenticated && !state.isLoggingOut) {
          console.log('🔍 AuthGuard: Verificando autenticación...');
          await checkAuthStatus();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setHasChecked(true);
      }
    };

    // Solo verificar si aún no hemos inicializado o si es necesario
    if ((requireAuth && !state.hasInitialized) || 
        (requireAuth && !state.isAuthenticated && !state.isLoggingOut)) {
      performAuthCheck();
    } else {
      setHasChecked(true);
    }
  }, [checkAuthStatus, state.isAuthenticated, state.hasInitialized, requireAuth]);

  // 🔥 MEJORADO: Manejo de estados de carga más específico
  if (requireAuth && (state.isLoading || !state.hasInitialized || !hasChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.isLoading ? 'Verificando sesión...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no requiere autenticación, mostrar el contenido directamente
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }

  // Si no está autenticado, mostrar fallback (por defecto redirige al login)
  if (!state.isAuthenticated) {
    return <>{fallback}</>;
  }

  // Si está autenticado y no bloqueado, mostrar el contenido
  return <>{children}</>;
};