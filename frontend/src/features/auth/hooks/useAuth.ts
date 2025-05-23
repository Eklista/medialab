// frontend/src/features/auth/hooks/useAuth.ts
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
    hasAnyPermission,
    checkAuthStatus
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
    hasPermission,
    hasAnyPermission,
    checkAuthStatus, // NUEVO: Exponer checkAuthStatus
    
    // NUEVO: Aliases para compatibilidad con el código que me enviaste
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading
  };
};