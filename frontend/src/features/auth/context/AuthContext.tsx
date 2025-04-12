// src/features/auth/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/auth.types';
import { authService } from '../../../services';

// Definiciones de tipos
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string, confirmPassword: string) => Promise<void>;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<void>;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLocked: false
};

// Tipos de acciones
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: User }
  | { type: 'LOCK_SESSION' }
  | { type: 'UNLOCK_SESSION' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: true, 
        user: action.payload,
        error: null 
      };
    case 'LOGIN_FAIL':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    case 'RESTORE_SESSION':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload
      };
    case 'LOCK_SESSION':
      return { ...state, isLocked: true };
    case 'UNLOCK_SESSION':
      return { ...state, isLocked: false };
    default:
      return state;
  }
};

// Crear el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sesión del localStorage al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          
          // Convertir de datos de API a formato interno
          const user: User = {
            id: userData.id.toString(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.roles.includes('ADMIN') ? UserRole.ADMIN : UserRole.USER
          };
          
          dispatch({ type: 'RESTORE_SESSION', payload: user });
          console.log('Sesión restaurada:', user);
        } catch (error) {
          console.error('Error al restaurar la sesión:', error);
          authService.logout();
        }
      }
    };
    
    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const userData = await authService.login(credentials);
      
      // Convertir de datos de API a formato interno
      const user: User = {
        id: userData.id.toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.roles.includes('ADMIN') ? UserRole.ADMIN : UserRole.USER
      };
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error.message || 'Credenciales incorrectas' 
      });
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Funciones para recuperación de contraseña
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (password: string, confirmPassword: string): Promise<void> => {
    // En una implementación real, el token vendría de la URL
    const token = window.location.pathname.split('/').pop() || '';
    
    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
    
    try {
      await authService.resetPassword(token, password);
    } catch (error) {
      throw error;
    }
  };

  // Funciones para bloqueo de sesión
  const lockSession = () => {
    dispatch({ type: 'LOCK_SESSION' });
  };

  const unlockSession = async (password: string): Promise<void> => {
    try {
      const isValid = await authService.verifyPassword(password);
      if (isValid) {
        dispatch({ type: 'UNLOCK_SESSION' });
      } else {
        throw new Error('Contraseña incorrecta');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al verificar la contraseña');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        forgotPassword,
        resetPassword,
        lockSession,
        unlockSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};