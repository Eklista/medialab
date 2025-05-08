import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  const { 
    state, 
    login, 
    logout, 
    forgotPassword, 
    verifyCode, 
    resetPassword, 
    lockSession, 
    unlockSession,
    hasPermission,
    hasAnyPermission
  } = context;
  
  return {
    state,
    login,
    logout,
    forgotPassword,
    verifyCode,
    resetPassword,
    lockSession,
    unlockSession,
    hasPermission, // Añadir función de verificación de permiso
    hasAnyPermission // Añadir función de verificación de múltiples permisos
  };
};