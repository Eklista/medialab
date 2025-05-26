import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/auth.types';
import { authService } from '../../../services';
import { setLoggingOut } from '../../../services/api';

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
  isLoggingOut: boolean;
  // 🔥 MEJORADO: Más específico que preventAutoCheck
  lastLogoutTime: number | null;
  hasInitialized: boolean; // Para saber si ya hicimos la verificación inicial
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
  refreshCurrentUser: () => Promise<void>;
}

// 🔥 Estado inicial mejorado
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isLocked: false,
  lastActivity: Date.now(),
  permissions: [],
  isLoggingOut: false,
  lastLogoutTime: null,
  hasInitialized: false
};

// 🔥 Acciones actualizadas
type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User, permissions: string[] } }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT_START' }
  | { type: 'LOGOUT_COMPLETE' }
  | { type: 'RESTORE_SESSION'; payload: { user: User, permissions: string[] } }
  | { type: 'LOCK_SESSION' }
  | { type: 'UNLOCK_SESSION' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'UPDATE_PERMISSIONS'; payload: string[] }
  | { type: 'INIT_COMPLETE' };

// 🔥 Función mejorada para verificar rutas
const getRouteType = (path: string) => {
  // Rutas completamente públicas
  const publicRoutes = ['/', '/request'];
  if (publicRoutes.includes(path)) return 'public';
  
  // Rutas de autenticación
  const authRoutes = ['/ml-admin/login', '/password-recovery'];
  if (authRoutes.some(route => path.startsWith(route))) return 'auth';
  
  // Rutas protegidas
  const protectedRoutes = ['/dashboard', '/ml-admin'];
  if (protectedRoutes.some(route => path.startsWith(route))) return 'protected';
  
  return 'unknown';
};

// 🔥 Reducer mejorado
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isLoading: true, hasInitialized: false };
      
    case 'INIT_COMPLETE':
      return { ...state, isLoading: false, hasInitialized: true };
      
    case 'LOGIN_START':
      return { 
        ...state, 
        isLoading: true, 
        error: null, 
        isLoggingOut: false, 
        lastLogoutTime: null 
      };
      
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: true, 
        user: action.payload.user,
        permissions: action.payload.permissions,
        error: null,
        lastActivity: Date.now(),
        isLoggingOut: false,
        lastLogoutTime: null,
        hasInitialized: true
      };
      
    case 'LOGIN_FAIL':
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload, 
        isLoggingOut: false,
        hasInitialized: true
      };
      
    case 'LOGOUT_START':
      return { ...state, isLoggingOut: true, error: null };
      
    case 'LOGOUT_COMPLETE':
      return { 
        ...initialState,
        lastLogoutTime: Date.now(),
        hasInitialized: true // Mantener que ya inicializamos
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
        isLoggingOut: false,
        isLoading: false,
        hasInitialized: true
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
    profileImage: userData.profile_image || userData.profileImage,
    profile_image: userData.profile_image || userData.profileImage,
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

  const refreshCurrentUser = async () => {
    if (!state.isAuthenticated || !state.user) {
      console.warn('⚠️ No hay usuario autenticado para refrescar');
      return;
    }

    try {
      console.log('🔄 Refrescando datos del usuario actual...');
      const userData = await authService.getCurrentUser();
      let userPermissions: string[] = [];
      
      try {
        userPermissions = await authService.getUserPermissions();
      } catch (permError) {
        console.warn('⚠️ Error al obtener permisos:', permError);
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
      
      console.log('✅ Datos del usuario refrescados exitosamente');
    } catch (error) {
      console.error('💥 Error al refrescar usuario:', error);
    }
  };

  // 🔥 NUEVA función para verificar si debemos hacer auto-check
  const shouldPerformAutoCheck = (): boolean => {
    const currentPath = window.location.pathname;
    const routeType = getRouteType(currentPath);
    
    // No verificar si estamos haciendo logout
    if (state.isLoggingOut) {
      console.log('🔒 Verificación omitida: logout en progreso');
      return false;
    }
    
    // No verificar si acabamos de hacer logout hace menos de 5 segundos
    if (state.lastLogoutTime && (Date.now() - state.lastLogoutTime) < 5000) {
      console.log('🔒 Verificación omitida: logout reciente');
      return false;
    }
    
    // Solo verificar en rutas protegidas
    if (routeType !== 'protected') {
      console.log(`🔒 Verificación omitida: ruta ${routeType} (${currentPath})`);
      return false;
    }
    
    // Ya estamos autenticados? Solo verificar si no hemos inicializado
    if (state.isAuthenticated && state.hasInitialized) {
      console.log('✅ Verificación omitida: ya autenticado e inicializado');
      return false;
    }
    
    console.log(`✅ Verificación necesaria: ruta ${routeType} (${currentPath})`);
    return true;
  };

  // 🔥 Método mejorado para verificar autenticación
  const checkAuthStatus = async () => {
    if (!shouldPerformAutoCheck()) {
      return;
    }

    try {
      console.log('🔍 Verificando estado de autenticación...');
      dispatch({ type: 'INIT_START' });
      
      const isAuth = await authService.checkAuthStatus();
      
      if (isAuth) {
        console.log('✅ Usuario autenticado, obteniendo datos...');
        const userData = await authService.getCurrentUser();
        let userPermissions: string[] = [];
        
        try {
          userPermissions = await authService.getUserPermissions();
        } catch (permError) {
          console.warn('⚠️ Error al obtener permisos:', permError);
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
        console.log('❌ Usuario no autenticado');
        dispatch({ type: 'INIT_COMPLETE' });
      }
    } catch (error) {
      console.error('💥 Error al verificar autenticación:', error);
      dispatch({ type: 'INIT_COMPLETE' });
    }
  };

  // 🔥 EFECTO PRINCIPAL MEJORADO
  useEffect(() => {
    const currentPath = window.location.pathname;
    const routeType = getRouteType(currentPath);
    
    console.log('🚀 AuthProvider mounted:', {
      path: currentPath,
      routeType,
      isAuthenticated: state.isAuthenticated,
      hasInitialized: state.hasInitialized,
      isLoggingOut: state.isLoggingOut,
      lastLogoutTime: state.lastLogoutTime
    });

    // Verificar automáticamente solo si es necesario
    if (shouldPerformAutoCheck()) {
      console.log('🔄 Iniciando verificación de autenticación...');
      checkAuthStatus();
    } else {
      // Si no necesitamos verificar, marcar como inicializado
      if (!state.hasInitialized) {
        dispatch({ type: 'INIT_COMPLETE' });
      }
    }
  }, []); // Solo ejecutar una vez al montar

  // 🔥 NUEVO: Efecto para limpiar lastLogoutTime después de un tiempo
  useEffect(() => {
    if (state.lastLogoutTime) {
      const timer = setTimeout(() => {
        // Si después de 30 segundos aún no hay autenticación, permitir verificaciones futuras
        if (!state.isAuthenticated) {
          console.log('🔄 Limpiando lastLogoutTime para permitir verificaciones futuras');
          dispatch({ type: 'LOGOUT_COMPLETE' }); // Esto limpiará lastLogoutTime
        }
      }, 30000); // 30 segundos

      return () => clearTimeout(timer);
    }
  }, [state.lastLogoutTime, state.isAuthenticated]);

  // Detectar actividad del usuario (sin cambios)
  useEffect(() => {
    if (state.isLoggingOut) return;

    const handleActivity = () => {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

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

  // Función para iniciar sesión (sin cambios)
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

  // 🔥 FUNCIÓN DE LOGOUT MEJORADA
  const logout = () => {
    console.log('🚪 Iniciando proceso de logout...');
    
    dispatch({ type: 'LOGOUT_START' });
    setLoggingOut(true);
    
    // Limpiar datos locales inmediatamente
    localStorage.removeItem('sessionLocked');
    localStorage.removeItem('lastPath');
    localStorage.removeItem('userId');
    
    // Limpiar cookies del lado del cliente
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    
    // Llamar al servicio de logout
    authService.logout().finally(() => {
      console.log('🧹 Completando logout...');
      dispatch({ type: 'LOGOUT_COMPLETE' });
      setLoggingOut(false);
      
      // Forzar redirección después de un pequeño delay
      setTimeout(() => {
        window.location.href = '/ml-admin/login';
      }, 100);
    });
  };

  // Resto de funciones sin cambios...
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
    const routeType = getRouteType(currentPath);
    
    if (routeType === 'protected') {
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
        checkAuthStatus,
        refreshCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};