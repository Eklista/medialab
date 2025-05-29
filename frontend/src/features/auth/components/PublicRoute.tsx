// src/features/auth/components/PublicRoute.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../../../context/AppDataContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { state: authState } = useAuth();
  const { isInitialized } = useAppData();

  // 🆕 Mientras se inicializa, mostrar loading mínimo
  if (!isInitialized || !authState.hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // 🆕 Si está en proceso de logout, mostrar loading
  if (authState.isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cerrando sesión...</p>
        </div>
      </div>
    );
  }

  // 🆕 Siempre permitir acceso a rutas públicas
  // (sin redirecciones automáticas molestas)
  return <>{children}</>;
};