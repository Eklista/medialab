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
  profileImage?: string;
  profile_image?: string;
  permissions?: string[]; // Añadir campo para permisos
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
  lastActivity: number;
  permissions: string[]; // Añadir permisos en el estado
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
  hasPermission: (permission: string) => boolean; // Función para verificar permisos
  hasAnyPermission: (permissions: string[]) => boolean; // Función para verificar múltiples permisos
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLocked: false,
  lastActivity: Date.now(),
  permissions: [] // Inicialmente no hay permisos
};

// Tipos de acciones
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User, permissions: string[] } }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User, permissions: string[] } }
  | { type: 'LOCK_SESSION' }
  | { type: 'UNLOCK_SESSION' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'UPDATE_PERMISSIONS'; payload: string[] };

// Función para verificar si una ruta es pública
const isPublicRoute = (path: string) => {
  const publicRoutes = ['/', '/login', '/password-recovery', '/request'];
  const isPublic = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`));
  console.log("Verificando si es ruta pública:", path, "Resultado:", isPublic);
  return isPublic;
};

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
        user: action.payload.user,
        permissions: action.payload.permissions,
        error: null,
        lastActivity: Date.now() 
      };
    case 'LOGIN_FAIL':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    case 'RESTORE_SESSION':
      // Restaurar también el estado de bloqueo desde localStorage
      const isLocked = localStorage.getItem('sessionLocked') === 'true';
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isLocked: isLocked,
        lastActivity: isLocked ? 0 : Date.now() // Si está bloqueado, no actualizar lastActivity
      };
    case 'LOCK_SESSION':
      // Guardar el estado de bloqueo en localStorage
      localStorage.setItem('sessionLocked', 'true');
      return { ...state, isLocked: true };
    case 'UNLOCK_SESSION':
      // Actualizar el estado de bloqueo en localStorage
      localStorage.setItem('sessionLocked', 'false');
      return { ...state, isLocked: false, lastActivity: Date.now() };
    case 'UPDATE_ACTIVITY':
      // Solo actualizar si la sesión no está bloqueada
      return state.isLocked ? state : { ...state, lastActivity: Date.now() };
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
  // Extraer nombre y apellido de forma más robusta
  let firstName = '';
  let lastName = '';
  
  // Si hay campos firstName/lastName directamente, usarlos
  if (userData.firstName || userData.first_name) {
    firstName = userData.firstName || userData.first_name;
  }
  
  if (userData.lastName || userData.last_name) {
    lastName = userData.lastName || userData.last_name;
  }
  
  // Si no hay firstName/lastName pero hay name, dividirlo
  if ((!firstName || !lastName) && userData.name) {
    const nameParts = userData.name.split(' ');
    if (!firstName) firstName = nameParts[0] || '';
    if (!lastName) lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Si aún no hay firstName/lastName, intentar extraer del email
  if (!firstName && userData.email) {
    firstName = userData.email.split('@')[0];
  }
  
  // Asegurar que role esté correctamente asignado
  const role = Array.isArray(userData.roles) && userData.roles.includes('ADMIN') 
    ? UserRole.ADMIN 
    : UserRole.USER;
  
  // Extraer permisos o usar array vacío
  const permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
  
  // Construir y devolver el objeto User normalizado
  const user: User = {
    id: String(userData.id || ''),
    email: userData.email || '',
    firstName,
    lastName,
    role,
    profileImage: userData.profileImage || userData.profile_image,
    permissions // Añadir permisos al objeto usuario también
  };
  
  // Añadir permisos implícitos basados en roles
  if (role === UserRole.ADMIN) {
    // Si es admin, asegurarse de que tenga todos los permisos básicos
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
    
    // Añadir los permisos que no estén ya incluidos
    for (const perm of adminImplicitPermissions) {
      if (!permissions.includes(perm)) {
        permissions.push(perm);
      }
    }
  } else {
    // Para usuarios normales, añadir permiso profile_edit si no lo tienen
    if (!permissions.includes('profile_edit')) {
      permissions.push('profile_edit');
    }
  }
  
  return { user, permissions };
};

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sesión del localStorage al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          
          // Intentar obtener permisos del usuario
          let userPermissions: string[] = [];
          try {
            userPermissions = await authService.getUserPermissions();
          } catch (permError) {
            console.warn('Error al obtener permisos del usuario:', permError);
          }
          
          // Agregar permisos al objeto userData antes de procesarlo
          const userDataWithPermissions = {
            ...userData,
            permissions: userPermissions
          };
          
          // Procesar datos del usuario
          const { user, permissions } = processUserData(userDataWithPermissions);
          
          dispatch({ 
            type: 'RESTORE_SESSION', 
            payload: { user, permissions } 
          });
        } catch (error) {
          console.error('Error al restaurar la sesión:', error);
          authService.logout();
        }
      }
    };
    
    checkAuth();
  }, []);

  // Detectar actividad del usuario para actualizar lastActivity
  useEffect(() => {
    const handleActivity = () => {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    };

    // Eventos para detectar actividad del usuario
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Verificar inactividad cada minuto
    const inactivityCheckInterval = setInterval(() => {
      const inactivityPeriod = 15 * 60 * 1000; // 15 minutos en milisegundos
      
      if (
        state.isAuthenticated && 
        !state.isLocked && 
        Date.now() - state.lastActivity > inactivityPeriod
      ) {
        lockSession();
      }
    }, 60000); // Verificar cada minuto

    return () => {
      // Limpiar eventos al desmontar
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(inactivityCheckInterval);
    };
  }, [state.isAuthenticated, state.isLocked, state.lastActivity]);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const userData = await authService.login(credentials);
      
      // Intentar obtener permisos del usuario
      let userPermissions: string[] = [];
      try {
        userPermissions = await authService.getUserPermissions();
      } catch (permError) {
        console.warn('Error al obtener permisos del usuario:', permError);
      }
      
      // Agregar permisos al objeto userData antes de procesarlo
      const userDataWithPermissions = {
        ...userData,
        permissions: userPermissions
      };
      
      // Procesar datos del usuario
      const { user, permissions } = processUserData(userDataWithPermissions);
      
      // Al iniciar sesión, asegurarse de que no esté bloqueada
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

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    localStorage.removeItem('sessionLocked');
    dispatch({ type: 'LOGOUT' });
  };

  // Funciones para recuperación de contraseña
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' }); // Usar el estado de carga global
      await authService.forgotPassword(email);
      dispatch({ type: 'LOGIN_FAIL', payload: '' }); // Limpiar error y detener carga
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Error al enviar email' 
      });
      throw error;
    }
  };

  // Función para verificar código
  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' }); // Usar el estado de carga global
      const result = await authService.verifyCode(email, code);
      dispatch({ type: 'LOGIN_FAIL', payload: '' }); // Limpiar error y detener carga
      return result.valid;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Código inválido o expirado' 
      });
      throw error;
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (password: string, confirmPassword: string, code: string, email: string): Promise<void> => {
    if (password !== confirmPassword) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: 'Las contraseñas no coinciden' 
      });
      throw new Error('Las contraseñas no coinciden');
    }
    
    try {
      dispatch({ type: 'LOGIN_START' }); // Usar el estado de carga global
      await authService.resetPassword(password, confirmPassword, code, email);
      dispatch({ type: 'LOGIN_FAIL', payload: '' }); // Limpiar error y detener carga
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error instanceof Error ? error.message : 'Error al restablecer la contraseña'
      });
      throw error;
    }
  };

  // Funciones para bloqueo de sesión
  const lockSession = () => {
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    console.log("lockSession llamado, ruta actual:", currentPath);
    console.log("¿Es ruta pública?", isPublicRoute(currentPath));
    
    // Solo bloqueamos si estamos en una ruta protegida
    if (!isPublicRoute(currentPath)) {
      console.log("Procediendo a bloquear sesión");
      dispatch({ type: 'LOCK_SESSION' });
    } else {
      console.log("No se bloquea la sesión porque estamos en una ruta pública");
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

  // Funciones para verificar permisos
  const hasPermission = (permission: string): boolean => {
    // Si el usuario es ADMIN, tiene todos los permisos
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    
    // Verificar si el permiso está en el array de permisos
    return state.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    // Si el usuario es ADMIN, tiene todos los permisos
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    
    // Verificar si al menos uno de los permisos está en el array
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
        hasAnyPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};