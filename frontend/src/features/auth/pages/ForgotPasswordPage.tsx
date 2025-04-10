// src/features/auth/pages/ForgotPasswordPage.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { useAuth } from '../hooks/useAuth';
import LockScreen from '../components/LockScreen';

const ForgotPasswordPage: React.FC = () => {
  const { state } = useAuth();
  
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
      title="Recuperar Contraseña"
      subtitle="Enviaremos instrucciones a tu correo electrónico"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;