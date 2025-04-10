// src/features/auth/context/AuthContext.tsx

import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/auth.types';

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

// Usuarios de prueba
const mockUsers = [
  {
    id: '1',
    email: 'pablo@prueba.com',
    password: 'Admin123',
    firstName: 'Pablo',
    lastName: 'Lacán',
    role: UserRole.ADMIN
  },
  {
    id: '2',
    email: 'kohler@prueba.com',
    password: 'User123',
    firstName: 'Christian',
    lastName: 'Kohler',
    role: UserRole.USER
  }
];

// Crear el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sesión del localStorage al cargar el componente
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        dispatch({ type: 'RESTORE_SESSION', payload: userData });
        
        console.log('Sesión restaurada:', userData);
      } catch (error) {
        console.error('Error al restaurar la sesión:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(user => user.email === credentials.email);
        
        if (user && user.password === credentials.password) {
          const { password, ...safeUser } = user;
          
          // Guardar en localStorage
          localStorage.setItem('auth_user', JSON.stringify(safeUser));
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: safeUser });
          resolve();
        } else {
          dispatch({ 
            type: 'LOGIN_FAIL', 
            payload: 'Credenciales incorrectas' 
          });
          reject(new Error('Credenciales incorrectas'));
        }
      }, 1000);
    });
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('auth_user');
    dispatch({ type: 'LOGOUT' });
  };

  // Funciones simplificadas
  const forgotPassword = async (_email: string): Promise<void> => {
    // En una implementación real, aquí verificaríamos si el email existe
    // y enviaríamos un correo de recuperación
    return Promise.resolve();
  };

  const resetPassword = async (_password: string, _confirmPassword: string): Promise<void> => {
    // En una implementación real, aquí verificaríamos que las contraseñas coinciden
    // y actualizaríamos la contraseña en la base de datos
    return Promise.resolve();
  };

  const lockSession = () => {
    dispatch({ type: 'LOCK_SESSION' });
  };

  const unlockSession = async (_password: string): Promise<void> => {
    // En una implementación real, aquí verificaríamos si la contraseña es correcta
    // para el usuario actual antes de desbloquear
    dispatch({ type: 'UNLOCK_SESSION' });
    return Promise.resolve();
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