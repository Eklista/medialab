// src/features/auth/pages/PasswordRecoveryPage.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordRecoveryForm from '../components/PasswordRecoveryForm';
import { useAuth } from '../hooks/useAuth';
import LockScreen from '../components/LockScreen';

const PasswordRecoveryPage: React.FC = () => {
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
      title="Recuperar Contraseña"
      subtitle="Sistema de recuperación segura"
    >
      <PasswordRecoveryForm />
    </AuthLayout>
  );
};

export default PasswordRecoveryPage;