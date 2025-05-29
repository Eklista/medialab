// frontend/src/features/auth/context/AuthContext.tsx - OPTIMIZED VERSION
import React, { createContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { UserRole } from '../types/auth.types';
import { authService } from '../../../services';
import { setLoggingOut } from '../../../services/api';

// ===== INTERFACES (sin cambios) =====
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
  lastLogoutTime: number | null;
  hasInitialized: boolean;
  // 🆕 NUEVO: Control de requests
  lastAuthCheck: number;
  isCheckingAuth: boolean;
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

// ===== CONSTANTS =====
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos entre verificaciones automáticas
const LOGOUT_COOLDOWN = 10 * 1000; // 10 segundos después de logout

// Estado inicial actualizado
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
  hasInitialized: false,
  lastAuthCheck: 0,
  isCheckingAuth: false
};

// ===== ACTIONS ACTUALIZADAS =====
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
  | { type: 'INIT_COMPLETE' }
  | { type: 'AUTH_CHECK_START' }
  | { type: 'AUTH_CHECK_COMPLETE' };

// ===== HELPER FUNCTIONS =====
const getRouteType = (path: string) => {
  const publicRoutes = ['/', '/request'];
  if (publicRoutes.includes(path)) return 'public';
  
  const authRoutes = ['/ml-admin/login', '/password-recovery'];
  if (authRoutes.some(route => path.startsWith(route))) return 'auth';
  
  const protectedRoutes = ['/dashboard', '/ml-admin'];
  if (protectedRoutes.some(route => path.startsWith(route))) return 'protected';
  
  return 'unknown';
};

// ===== REDUCER OPTIMIZADO =====
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isLoading: true, hasInitialized: false };
      
    case 'INIT_COMPLETE':
      return { ...state, isLoading: false, hasInitialized: true };
      
    case 'AUTH_CHECK_START':
      return { ...state, isCheckingAuth: true, lastAuthCheck: Date.now() };
      
    case 'AUTH_CHECK_COMPLETE':
      return { ...state, isCheckingAuth: false };
      
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
      
    case 'LOGOUT_COMPLETE': {
      return { 
        ...initialState,
        lastLogoutTime: Date.now(),
        hasInitialized: true
      };
    }
      
    case 'RESTORE_SESSION': {
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
    }
      
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

// ===== PROVIDER OPTIMIZADO =====
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ===== 🆕 VERIFICACIÓN OPTIMIZADA DE AUTENTICACIÓN =====
  const shouldPerformAuthCheck = useCallback((): boolean => {
    const currentPath = window.location.pathname;
    const routeType = getRouteType(currentPath);
    
    // No verificar si estamos en proceso de verificación
    if (state.isCheckingAuth) {
      console.log('🔒 Verificación omitida: ya verificando');
      return false;
    }
    
    // No verificar si acabamos de hacer logout
    if (state.lastLogoutTime && (Date.now() - state.lastLogoutTime) < LOGOUT_COOLDOWN) {
      console.log('🔒 Verificación omitida: logout reciente');
      return false;
    }
    
    // No verificar si acabamos de verificar recientemente
    if (state.lastAuthCheck && (Date.now() - state.lastAuthCheck) < AUTH_CHECK_INTERVAL) {
      console.log('🔒 Verificación omitida: verificación reciente');
      return false;
    }
    
    // Solo verificar en rutas protegidas o si no estamos inicializados
    if (routeType !== 'protected' && state.hasInitialized && state.isAuthenticated) {
      console.log(`🔒 Verificación omitida: ruta ${routeType} y ya autenticado`);
      return false;
    }
    
    console.log(`✅ Verificación necesaria: ruta ${routeType}`);
    return true;
  }, [state.isCheckingAuth, state.lastLogoutTime, state.lastAuthCheck, state.hasInitialized, state.isAuthenticated]);

  const checkAuthStatus = useCallback(async () => {
    if (!shouldPerformAuthCheck()) {
      return;
    }

    try {
      console.log('🔍 Verificando estado de autenticación...');
      dispatch({ type: 'AUTH_CHECK_START' });
      
      const isAuth = await authService.checkAuthStatus();
      
      if (isAuth && !state.isAuthenticated) {
        console.log('✅ Usuario autenticado, pero no sincronizado. Nota: Los datos de usuario se cargarán desde AppDataContext');
        // 🆕 NO cargar datos aquí, dejar que AppDataContext lo haga
        // Solo marcar como autenticado para evitar redirects
        dispatch({ 
          type: 'RESTORE_SESSION', 
          payload: { 
            user: state.user || { 
              id: '', email: '', firstName: '', lastName: '', role: UserRole.USER 
            }, 
            permissions: [] 
          } 
        });
      } else if (!isAuth && state.isAuthenticated) {
        console.log('❌ Usuario no autenticado, limpiando estado');
        dispatch({ type: 'LOGOUT_COMPLETE' });
      }
      
    } catch (error) {
      console.error('💥 Error al verificar autenticación:', error);
    } finally {
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
      if (!state.hasInitialized) {
        dispatch({ type: 'INIT_COMPLETE' });
      }
    }
  }, [shouldPerformAuthCheck, state.isAuthenticated, state.user, state.hasInitialized]);

  const refreshCurrentUser = useCallback(async () => {
    if (!state.isAuthenticated || !state.user) {
      console.warn('⚠️ No hay usuario autenticado para refrescar');
      return;
    }

    try {
      console.log('🔄 Refrescando datos del usuario actual...');
      // 🆕 Enviar evento para que AppDataContext maneje la actualización
      window.dispatchEvent(new CustomEvent('auth:refresh-user'));
    } catch (error) {
      console.error('💥 Error al refrescar usuario:', error);
    }
  }, [state.isAuthenticated, state.user]);

  // ===== EFECTO PRINCIPAL OPTIMIZADO =====
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

    // Solo verificar si es absolutamente necesario
    if (shouldPerformAuthCheck()) {
      console.log('🔄 Iniciando verificación de autenticación...');
      checkAuthStatus();
    } else if (!state.hasInitialized) {
      dispatch({ type: 'INIT_COMPLETE' });
    }
  }, []); // Solo ejecutar una vez al montar

  // ===== CLEANUP AUTOMÁTICO =====
  useEffect(() => {
    if (state.lastLogoutTime) {
      const timer = setTimeout(() => {
        if (!state.isAuthenticated) {
          console.log('🔄 Limpiando lastLogoutTime');
          dispatch({ type: 'LOGOUT_COMPLETE' });
        }
      }, LOGOUT_COOLDOWN);

      return () => clearTimeout(timer);
    }
  }, [state.lastLogoutTime, state.isAuthenticated]);

  // ===== ACTIVITY DETECTION (optimizado) =====
  useEffect(() => {
    if (state.isLoggingOut || !state.isAuthenticated) return;

    const handleActivity = () => {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    };

    // Throttle activity events
    let activityTimeout: number;
    const throttledActivity = () => {
      if (activityTimeout) return;
      activityTimeout = window.setTimeout(() => {
        handleActivity();
        activityTimeout = 0;
      }, 1000); // Throttle a 1 segundo
    };

    window.addEventListener('mousemove', throttledActivity);
    window.addEventListener('keypress', throttledActivity);
    window.addEventListener('click', throttledActivity);

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
    }, 60000); // Check cada minuto

    return () => {
      window.removeEventListener('mousemove', throttledActivity);
      window.removeEventListener('keypress', throttledActivity);
      window.removeEventListener('click', throttledActivity);
      clearInterval(inactivityCheckInterval);
      if (activityTimeout) window.clearTimeout(activityTimeout);
    };
  }, [state.isAuthenticated, state.isLocked, state.lastActivity, state.isLoggingOut]);

  // ===== LOGIN OPTIMIZADO =====
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('🔐 Iniciando login...');
      const userData = await authService.login(credentials);
      
      // 🆕 Obtener permisos de forma optimizada
      let userPermissions: string[] = [];
      try {
        userPermissions = await authService.getUserPermissions();
      } catch (permError) {
        console.warn('⚠️ Error al obtener permisos:', permError);
      }
      
      const processedUserData = processUserData({
        ...userData,
        permissions: userPermissions
      });
      
      localStorage.setItem('sessionLocked', 'false');
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: processedUserData
      });

      // 🆕 Notificar a AppDataContext (coordinación mejorada)
      window.dispatchEvent(new CustomEvent('auth:login', { 
        detail: processedUserData
      }));
      
      console.log('✅ Login exitoso');
      
    } catch (error: any) {
      console.error('💥 Error en login:', error);
      dispatch({ 
        type: 'LOGIN_FAIL', 
        payload: error.message || 'Credenciales incorrectas' 
      });
      throw error;
    }
  }, []);

  // ===== LOGOUT OPTIMIZADO =====
  const logout = useCallback(() => {
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
    
    // 🆕 Notificar a AppDataContext (coordinación mejorada)
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
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
  }, []);

  // ===== RESTO DE MÉTODOS (optimizados pero sin cambios funcionales) =====
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
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
  }, []);

  const verifyCode = useCallback(async (email: string, code: string): Promise<boolean> => {
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
  }, []);

  const resetPassword = useCallback(async (password: string, confirmPassword: string, code: string, email: string): Promise<void> => {
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
  }, []);

  const lockSession = useCallback(() => {
    const currentPath = window.location.pathname;
    const routeType = getRouteType(currentPath);
    
    if (routeType === 'protected') {
      console.log('🔒 Bloqueando sesión');
      dispatch({ type: 'LOCK_SESSION' });
    }
  }, []);

  const unlockSession = useCallback(async (password: string): Promise<void> => {
    try {
      console.log('🔓 Desbloqueando sesión');
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
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    return state.permissions.includes(permission);
  }, [state.user?.role, state.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    return permissions.some(perm => state.permissions.includes(perm));
  }, [state.user?.role, state.permissions]);

  // ===== CONTEXT VALUE =====
  const contextValue: AuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== HELPER FUNCTION =====
function processUserData(userData: any): { user: User, permissions: string[] } {
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
}