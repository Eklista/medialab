// src/features/auth/pages/LoginPage.tsx

import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import LockScreen from '../components/LockScreen';
import { useEffect } from 'react';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const LoginPage: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener la ruta a la que redirigir después del login
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';
  
  // Efecto para actualizar la redirección después de iniciar sesión
  useEffect(() => {
    if (state.isAuthenticated && !state.isLocked) {
      // Obtener la última ruta visitada o usar la ruta en el state
      const lastPath = localStorage.getItem('lastPath');
      navigate(lastPath || from, { replace: true });
    }
  }, [state.isAuthenticated, state.isLocked, navigate, from]);
  
  // Si el usuario ya está autenticado, redirigir a la página principal
  if (state.isAuthenticated && !state.isLocked) {
    return <Navigate to={from} replace />;
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Ingresa tus credenciales para acceder al sistema"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;