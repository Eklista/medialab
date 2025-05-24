import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/auth.types';
import { authService } from '../../../services';

// Mantener todas tus interfaces existentes
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
  profile_image?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
  lastActivity: number;
  permissions: string[];
  isLoggingOut: boolean; // ← NUEVO: flag para controlar logout
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
  verifyCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (password: string, confirmPassword: string, code: string, email: string) => Promise<void>;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  checkAuthStatus: () => Promise<void>;
}

// Estado inicial actualizado
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLocked: false,
  lastActivity: Date.now(),
  permissions: [],
  isLoggingOut: false // ← NUEVO
};

// Tipos de acciones actualizados
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User, permissions: string[] } }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT_START' } // ← NUEVO
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User, permissions: string[] } }
  | { type: 'LOCK_SESSION' }
  | { type: 'UNLOCK_SESSION' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'UPDATE_PERMISSIONS'; payload: string[] };

// Función para verificar si una ruta es pública
const isPublicRoute = (path: string) => {
  const publicRoutes = ['/', '/ml-admin/login', '/password-recovery', '/request'];
  return publicRoutes.some(route => path === route || path.startsWith(`${route}/`));
};

// Reducer actualizado
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null, isLoggingOut: false };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: true, 
        user: action.payload.user,
        permissions: action.payload.permissions,
        error: null,
        lastActivity: Date.now(),
        isLoggingOut: false
      };
    case 'LOGIN_FAIL':
      return { ...state, isLoading: false, error: action.payload, isLoggingOut: false };
    case 'LOGOUT_START': // ← NUEVO
      return { ...state, isLoggingOut: true, error: null };
    case 'LOGOUT':
      return { 
        ...initialState, 
        isLoggingOut: false // ← Asegurar que se resetee
      };
    case 'RESTORE_SESSION':
      const isLocked = localStorage.getItem('sessionLocked') === 'true';
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isLocked: isLocked,
        lastActivity: isLocked ? 0 : Date.now(),
        isLoggingOut: false
      };
    case 'LOCK_SESSION':
      localStorage.setItem('sessionLocked', 'true');
      return { ...state, isLocked: true };
    case 'UNLOCK_SESSION':
      localStorage.setItem('sessionLocked', 'false');
      return { ...state, isLocked: false, lastActivity: Date.now() };
    case 'UPDATE_ACTIVITY':
      return state.isLocked || state.isLoggingOut ? state : { ...state, lastActivity: Date.now() };
    case 'UPDATE_PERMISSIONS':
      return { ...state, permissions: action.payload };
    default:
      return state;
  }
};

// Crear el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para procesar y normalizar los datos del usuario
const processUserData = (userData: any): { user: User, permissions: string[] } => {
  let firstName = '';
  let lastName = '';
  
  if (userData.firstName || userData.first_name) {
    firstName = userData.firstName || userData.first_name;
  }
  
  if (userData.lastName || userData.last_name) {
    lastName = userData.lastName || userData.last_name;
  }
  
  if ((!firstName || !lastName) && userData.name) {
    const nameParts = userData.name.split(' ');
    if (!firstName) firstName = nameParts[0] || '';
    if (!lastName) lastName = nameParts.slice(1).join(' ') || '';
  }
  
  if (!firstName && userData.email) {
    firstName = userData.email.split('@')[0];
  }
  
  const role = Array.isArray(userData.roles) && userData.roles.includes('ADMIN') 
    ? UserRole.ADMIN 
    : UserRole.USER;
  
  const permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
  
  const user: User = {
    id: String(userData.id || ''),
    email: userData.email || '',
    firstName,
    lastName,
    role,
    profileImage: userData.profileImage || userData.profile_image,
    permissions
  };
  
  if (role === UserRole.ADMIN) {
    const adminImplicitPermissions = [
      'user_view', 'user_create', 'user_edit', 'user_delete',
      'profile_edit',
      'service_view', 'service_create', 'service_edit', 'service_delete',
      'area_view', 'area_create', 'area_edit', 'area_delete',
      'department_view', 'department_create', 'department_edit', 'department_delete',
      'department_type_view', 'department_type_create', 'department_type_edit', 'department_type_delete',
      'template_view', 'template_create', 'template_edit', 'template_delete',
      'role_view', 'role_create', 'role_edit', 'role_delete',
      'request_view', 'request_create', 'request_edit', 'request_approve', 'request_reject', 'request_cancel'
    ];
    
    for (const perm of adminImplicitPermissions) {
      if (!permissions.includes(perm)) {
        permissions.push(perm);
      }
    }
  } else {
    if (!permissions.includes('profile_edit')) {
      permissions.push('profile_edit');
    }
  }
  
  return { user, permissions };
};

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Método para verificar autenticación usando cookies
  const checkAuthStatus = async () => {
    // Si estamos en proceso de logout, no verificar autenticación
    if (state.isLoggingOut) {
      return;
    }

    try {
      const isAuth = await authService.checkAuthStatus();
      
      if (isAuth) {
        const userData = await authService.getCurrentUser();
        let userPermissions: string[] = [];
        
        try {
          userPermissions = await authService.getUserPermissions();
        } catch (permError) {
          console.warn('Error al obtener permisos:', permError);
        }
        
        const userDataWithPermissions = {
          ...userData,
          permissions: userPermissions
        };
        
        const { user, permissions } = processUserData(userDataWithPermissions);
        
        dispatch({ 
          type: 'RESTORE_SESSION', 
          payload: { user, permissions } 
        });
      } else {
        // Si no está autenticado y no estamos haciendo logout, limpiar estado
        if (!state.isLoggingOut) {
          dispatch({ type: 'LOGOUT' });
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      // Solo limpiar estado si no estamos haciendo logout
      if (!state.isLoggingOut) {
        dispatch({ type: 'LOGOUT' });
      }
    }
  };

  // Restaurar sesión al cargar el componente SOLO UNA VEZ
  useEffect(() => {
    // Solo verificar si no estamos en proceso de logout y no estamos ya autenticados
    if (!state.isLoggingOut && !state.isAuthenticated && !state.isLoading) {
      checkAuthStatus();
    }
  }, []); // ← Solo ejecutar una vez al montar

  // Detectar actividad del usuario
  useEffect(() => {
    // No detectar actividad si estamos haciendo logout
    if (state.isLoggingOut) return;

    const handleActivity = () => {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Verificar inactividad cada minuto
    const inactivityCheckInterval = setInterval(() => {
      const inactivityPeriod = 15 * 60 * 1000; // 15 minutos
      
      if (
        state.isAuthenticated && 
        !state.isLocked && 
        !state.isLoggingOut &&
        Date.now() - state.lastActivity > inactivityPeriod
      ) {
        lockSession();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(inactivityCheckInterval);
    };
  }, [state.isAuthenticated, state.isLocked, state.lastActivity, state.isLoggingOut]);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const userData = await authService.login(credentials);
      let userPermissions: string[] = [];
      
      try {
        userPermissions = await authService.getUserPermissions();
      } catch (permError) {
        console.warn('Error al obtener permisos:', permError);
      }
      
      const userDataWithPermissions = {
        ...userData,
        permissions: userPermissions
      };
      
      const { user, permissions } = processUserData(userDataWithPermissions);
      
      localStorage.setItem('sessionLocked', 'false');
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, permissions } 
      });
    } catch (error: any) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error.message || 'Credenciales incorrectas' 
      });
      throw error;
    }
  };

  // Función para cerrar sesión MEJORADA
  const logout = () => {
    // Marcar que estamos haciendo logout
    dispatch({ type: 'LOGOUT_START' });
    
    // Limpiar datos locales inmediatamente
    localStorage.removeItem('sessionLocked');
    
    // Llamar al servicio de logout (que maneja cookies y redirección)
    authService.logout();
    
    // Limpiar estado local
    dispatch({ type: 'LOGOUT' });
  };

  // Resto de funciones permanecen igual
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      await authService.forgotPassword(email);
      dispatch({ type: 'LOGIN_FAIL', payload: '' });
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Error al enviar email' 
      });
      throw error;
    }
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const result = await authService.verifyCode(email, code);
      dispatch({ type: 'LOGIN_FAIL', payload: '' });
      return result.valid;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Código inválido o expirado' 
      });
      throw error;
    }
  };

  const resetPassword = async (password: string, confirmPassword: string, code: string, email: string): Promise<void> => {
    if (password !== confirmPassword) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: 'Las contraseñas no coinciden' 
      });
      throw new Error('Las contraseñas no coinciden');
    }
    
    try {
      dispatch({ type: 'LOGIN_START' });
      await authService.resetPassword(password, confirmPassword, code, email);
      dispatch({ type: 'LOGIN_FAIL', payload: '' });
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Error al restablecer la contraseña'
      });
      throw error;
    }
  };

  const lockSession = () => {
    const currentPath = window.location.pathname;
    
    if (!isPublicRoute(currentPath)) {
      dispatch({ type: 'LOCK_SESSION' });
    }
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
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error.message || 'Contraseña incorrecta' 
      });
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    return state.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    return permissions.some(perm => state.permissions.includes(perm));
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};