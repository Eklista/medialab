import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Comprobar si hay una sesión guardada al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setState({
          isAuthenticated: true,
          user
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Función simple para simular login
  const login = async (email: string) => {
    // Para pruebas, simplemente se acepta cualquier combo de email/password
    const user = {
      id: '1',
      name: 'Usuario Colaborador',
      email
    };
    
    // Guardar en localStorage
    localStorage.setItem('token', 'fake-token-12345');
    localStorage.setItem('user', JSON.stringify(user));
    
    setState({
      isAuthenticated: true,
      user
    });
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setState({
      isAuthenticated: false,
      user: null
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};