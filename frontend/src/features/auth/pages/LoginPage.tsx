// src/features/auth/pages/LoginPage.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import LockScreen from '../components/LockScreen';

const LoginPage: React.FC = () => {
  const { state } = useAuth();
  
  // Si el usuario ya está autenticado, redirigir a la página principal
  if (state.isAuthenticated && !state.isLocked) {
    return <Navigate to="/dashboard" replace />;
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