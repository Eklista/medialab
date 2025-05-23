// frontend/src/features/auth/components/AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LockScreen from './LockScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <Navigate to="/ml-admin/login" replace /> 
}) => {
  const { state, checkAuthStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const performAuthCheck = async () => {
      try {
        setIsChecking(true);
        // Verificar autenticación usando cookies
        await checkAuthStatus();
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Solo verificar si no estamos ya autenticados
    if (!state.isAuthenticated) {
      performAuthCheck();
    } else {
      setIsChecking(false);
    }
  }, [checkAuthStatus, state.isAuthenticated]);

  // Mostrar loading mientras verifica
  if (isChecking || state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
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