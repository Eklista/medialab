// src/features/auth/pages/ResetPasswordPage.tsx

import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import ResetPasswordForm from '../components/ResetPasswordForm';
import { useAuth } from '../hooks/useAuth';
import LockScreen from '../components/LockScreen';

const ResetPasswordPage: React.FC = () => {
  const { state } = useAuth();
  const { token } = useParams<{ token?: string }>();
  
  // Verificar si hay un token en la URL
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Si el usuario ya está autenticado, redirigir a la página principal
  if (state.isAuthenticated && !state.isLocked) {
    return <Navigate to="/" replace />;
  }
  
  // Si la sesión está bloqueada, mostrar la pantalla de bloqueo
  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }
  
  return (
    <AuthLayout
      title="Restablecer Contraseña"
      subtitle="Crea una nueva contraseña segura"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;