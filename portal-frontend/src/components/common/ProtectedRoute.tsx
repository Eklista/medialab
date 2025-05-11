import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();

  if (!state.isAuthenticated) {
    // Redirigir a la página de login, pero guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario está autenticado, renderizar los hijos (rutas anidadas)
  return <Outlet />;
};

export default ProtectedRoute;