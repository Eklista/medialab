// frontend/src/context/AppDataContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { authService, userService, permissionsService } from '../services';
import { User as UserServiceUser, Role, Area } from '../services/users/users.service';
import { User as AuthServiceUser } from '../services/auth/auth.service';
import { PermissionCategory } from '../services/security/permissions.service';

// ===== INTERFACES =====
interface AppData {
  // Usuario y auth
  user: AuthServiceUser | null;
  isAuthenticated: boolean;
  permissions: string[];
  
  // Datos del sistema (una sola carga con cache inteligente)
  roles: Role[];
  areas: Area[];
  permissionCategories: PermissionCategory[];
  users: UserServiceUser[];
  
  // Estados de carga optimizados
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // 🆕 NUEVO: Control de cache
  lastRefresh: number;
  cacheValidUntil: number;
  
  // Métodos de refresh selectivos y optimizados
  refreshUser: () => Promise<void>;
  refreshSystemData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  invalidateCache: () => void;
}

const AppDataContext = createContext<AppData | null>(null);
export { AppDataContext };

// ===== CONSTANTS =====
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para datos del sistema
const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para datos de usuario
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000;

// ===== PROVIDER =====
interface AppDataProviderProps {
  children: React.ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const [state, setState] = useState<Omit<AppData, 'refreshUser' | 'refreshSystemData' | 'refreshAll' | 'invalidateCache'>>({
    user: null,
    isAuthenticated: false,
    permissions: [],
    roles: [],
    areas: [],
    permissionCategories: [],
    users: [],
    isLoading: true,
    isInitialized: false,
    error: null,
    lastRefresh: 0,
    cacheValidUntil: 0
  });

  // Refs para control de concurrencia
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const userCacheRef = useRef(0);
  const systemCacheRef = useRef(0);

  // ===== CACHE HELPERS =====
  const isCacheValid = useCallback((type: 'user' | 'system' = 'system') => {
    const now = Date.now();
    if (type === 'user') {
      return now < userCacheRef.current;
    }
    return now < systemCacheRef.current;
  }, []);

  const updateCacheTimestamp = useCallback((type: 'user' | 'system' | 'both' = 'both') => {
    const now = Date.now();
    if (type === 'user' || type === 'both') {
      userCacheRef.current = now + USER_CACHE_DURATION;
    }
    if (type === 'system' || type === 'both') {
      systemCacheRef.current = now + CACHE_DURATION;
      setState(prev => ({
        ...prev,
        lastRefresh: now,
        cacheValidUntil: now + CACHE_DURATION
      }));
    }
  }, []);

  const invalidateCache = useCallback(() => {
    userCacheRef.current = 0;
    systemCacheRef.current = 0;
    setState(prev => ({
      ...prev,
      cacheValidUntil: 0,
      lastRefresh: 0
    }));
    console.log('🧹 Cache invalidado');
  }, []);

  // ===== 🆕 OPTIMIZED DATA LOADING =====
  
  /**
   * Carga SOLO datos de usuario (optimizada con cache)
   */
  const loadUserData = useCallback(async (forceRefresh = false) => {
    // Verificar cache de usuario
    if (!forceRefresh && isCacheValid('user') && state.user && state.isAuthenticated) {
      console.log('📦 Usando datos de usuario desde cache');
      return;
    }

    try {
      console.log('🔄 Cargando datos de usuario...');
      const startTime = Date.now();

      // Carga paralela optimizada de datos de usuario
      const [user, userPermissions] = await Promise.all([
        authService.getCurrentUser().catch(() => null),
        authService.getUserPermissions().catch(() => [])
      ]);

      const endTime = Date.now();
      console.log(`✅ Datos de usuario cargados en ${endTime - startTime}ms`, {
        user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
        permissions: userPermissions.length
      });

      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        permissions: userPermissions,
        error: null
      }));

      updateCacheTimestamp('user');
      
    } catch (error) {
      console.error('💥 Error cargando datos de usuario:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        permissions: [],
        error: `Error cargando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  }, [isCacheValid, state.user, state.isAuthenticated, updateCacheTimestamp]);

  /**
   * Carga SOLO datos del sistema (optimizada con cache)
   */
  const loadSystemData = useCallback(async (forceRefresh = false) => {
    // Verificar cache del sistema
    if (!forceRefresh && isCacheValid('system') && state.roles.length > 0) {
      console.log('📦 Usando datos del sistema desde cache');
      return;
    }

    try {
      console.log('🔄 Cargando datos del sistema...');
      const startTime = Date.now();

      // Carga paralela de datos del sistema
      const [roles, areas, permissionCategories, allUsers] = await Promise.all([
        userService.getRoles().catch(() => []),
        userService.getAreas().catch(() => []),
        permissionsService.getPermissionsByCategories().catch(() => []),
        userService.getUsers().catch(() => [])
      ]);

      const endTime = Date.now();
      console.log(`✅ Datos del sistema cargados en ${endTime - startTime}ms:`, {
        roles: roles.length,
        areas: areas.length,
        categories: permissionCategories.length,
        users: allUsers.length
      });

      setState(prev => ({
        ...prev,
        roles,
        areas,
        permissionCategories,
        users: allUsers,
        error: null
      }));

      updateCacheTimestamp('system');
      
    } catch (error) {
      console.error('💥 Error cargando datos del sistema:', error);
      setState(prev => ({
        ...prev,
        error: `Error cargando datos del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  }, [isCacheValid, state.roles.length, updateCacheTimestamp]);

  /**
   * 🆕 CARGA INICIAL INTELIGENTE - Solo lo necesario según la ruta
   */
  const loadInitialData = useCallback(async (isRetry = false) => {
    // Prevenir múltiples cargas simultáneas
    if (loadingRef.current && !isRetry) {
      console.log('🔒 Carga ya en progreso, omitiendo...');
      return;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🚀 Iniciando carga inicial optimizada...');
      const startTime = Date.now();

      // PASO 1: Verificar autenticación (prioritario)
      const isAuth = await authService.checkAuthStatus();
      
      if (isAuth) {
        // PASO 2: Cargar datos de usuario (crítico)
        await loadUserData(true);
        
        // PASO 3: Determinar si necesitamos datos del sistema
        const currentPath = window.location.pathname;
        const needsSystemData = currentPath.includes('/dashboard') && 
                               !currentPath.includes('/dashboard/settings');
        
        if (needsSystemData) {
          console.log('📊 Ruta requiere datos del sistema, cargando...');
          await loadSystemData(true);
        } else {
          console.log('🚀 Ruta no requiere datos del sistema, omitiendo carga');
        }
      } else {
        console.log('❌ Usuario no autenticado');
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          permissions: []
        }));
      }

      const endTime = Date.now();
      console.log(`✅ Carga inicial completada en ${endTime - startTime}ms`);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true
      }));

      retryCountRef.current = 0;
      
    } catch (error) {
      console.error('💥 Error en carga inicial:', error);
      
      retryCountRef.current++;
      
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Reintentando carga... (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
        setTimeout(() => loadInitialData(true), RETRY_DELAY);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: `Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`
        }));
      }
    } finally {
      loadingRef.current = false;
    }
  }, [loadUserData, loadSystemData]);

  // ===== 🆕 REFRESH METHODS OPTIMIZADOS =====
  
  const refreshUser = useCallback(async () => {
    console.log('🔄 Refresh específico de usuario...');
    await loadUserData(true);
  }, [loadUserData]);

  const refreshSystemData = useCallback(async () => {
    console.log('🔄 Refresh específico de datos del sistema...');
    await loadSystemData(true);
  }, [loadSystemData]);

  const refreshAll = useCallback(async () => {
    console.log('🔄 Refresh completo de todos los datos...');
    invalidateCache();
    retryCountRef.current = 0;
    await loadInitialData();
  }, [invalidateCache, loadInitialData]);

  // ===== 🆕 LISTENERS PARA COORDINAR CON AuthContext =====
  useEffect(() => {
    const handleAuthLogin = (_event: CustomEvent) => {
      console.log('🔔 Auth login event received, refreshing user data');
      loadUserData(true);
    };

    const handleAuthLogout = () => {
      console.log('🔔 Auth logout event received, clearing data');
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        permissions: [],
        // Mantener datos del sistema para evitar recargas innecesarias
      }));
      userCacheRef.current = 0; // Solo invalidar cache de usuario
    };

    const handleRefreshUser = () => {
      console.log('🔔 Refresh user event received');
      loadUserData(true);
    };

    window.addEventListener('auth:login', handleAuthLogin as EventListener);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:refresh-user', handleRefreshUser);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:refresh-user', handleRefreshUser);
    };
  }, [loadUserData]);

  // ===== CARGA INICIAL AL MONTAR =====
  useEffect(() => {
    if (!state.isInitialized && !loadingRef.current) {
      loadInitialData();
    }
  }, [state.isInitialized, loadInitialData]);

  // ===== 🆕 LAZY LOADING PARA DATOS DEL SISTEMA =====
  useEffect(() => {
    // Si el usuario navega a una ruta que requiere datos del sistema
    // y no los tenemos, cargarlos
    const currentPath = window.location.pathname;
    const needsSystemData = currentPath.includes('/dashboard') && 
                           !currentPath.includes('/dashboard/settings');
    
    if (needsSystemData && 
        state.isAuthenticated && 
        state.isInitialized && 
        state.roles.length === 0 && 
        !isCacheValid('system')) {
      console.log('🔄 Lazy loading system data...');
      loadSystemData();
    }
  }, [window.location.pathname, state.isAuthenticated, state.isInitialized, state.roles.length, isCacheValid, loadSystemData]);

  // Crear valor del contexto
  const contextValue: AppData = {
    ...state,
    refreshUser,
    refreshSystemData,
    refreshAll,
    invalidateCache
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

// ===== HOOKS OPTIMIZADOS =====
export const useAppData = () => {
  const context = useContext(AppDataContext);
  
  if (!context) {
    throw new Error('useAppData debe usarse dentro de AppDataProvider');
  }
  
  return context;
};

// ===== HOOKS ESPECÍFICOS CON LAZY LOADING =====
export const useAuth = () => {
  const { user, isAuthenticated, permissions, refreshUser } = useAppData();
  return { user, isAuthenticated, permissions, refreshUser };
};

export const useRoles = () => {
  const { roles, refreshSystemData, isLoading } = useAppData();
  
  // 🆕 Trigger lazy loading si no hay datos
  useEffect(() => {
    if (roles.length === 0 && !isLoading) {
      console.log('🔄 useRoles: Triggering lazy load');
      refreshSystemData();
    }
  }, [roles.length, isLoading, refreshSystemData]);
  
  return { roles, refresh: refreshSystemData };
};

export const useAreas = () => {
  const { areas, refreshSystemData, isLoading } = useAppData();
  
  // 🆕 Trigger lazy loading si no hay datos
  useEffect(() => {
    if (areas.length === 0 && !isLoading) {
      console.log('🔄 useAreas: Triggering lazy load');
      refreshSystemData();
    }
  }, [areas.length, isLoading, refreshSystemData]);
  
  return { areas };
};

export const useUsers = () => {
  const { users, refreshSystemData, isLoading } = useAppData();
  
  // 🆕 Trigger lazy loading si no hay datos
  useEffect(() => {
    if (users.length === 0 && !isLoading) {
      console.log('🔄 useUsers: Triggering lazy load');
      refreshSystemData();
    }
  }, [users.length, isLoading, refreshSystemData]);
  
  return { users, refresh: refreshSystemData };
};

export const usePermissionCategories = () => {
  const { permissionCategories } = useAppData();
  return { categories: permissionCategories };
};