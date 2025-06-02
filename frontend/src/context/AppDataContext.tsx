// frontend/src/context/AppDataContext.tsx - 🔧 CORREGIDO CON NUEVA ARQUITECTURA
// ✅ Imports actualizados para la nueva estructura modular de usuarios

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { authService } from '../services';
import { User as AuthServiceUser } from '../services/auth/auth.service';
import { PermissionCategory } from '../services/security/permissions.service';
import systemDataService from '../services/system/systemData.service';
import webSocketService from '../services/websocket/websocket.service';

// 🆕 IMPORT DEL ONLINE USERS SERVICE
import { onlineUsersService } from '../services/users/onlineUsers.service';

// 🔧 IMPORTS CORREGIDOS - usando la nueva estructura modular
import { UserFormatted } from '../services/users/types/user.types';
import { Role, Area } from '../types/system.types';

// 🔧 TIPOS IMPORTADOS DIRECTAMENTE (mientras verificamos system.types.ts)
type SystemDataType = 'roles' | 'areas' | 'users' | 'permissions';

interface SystemDataResponse {
  roles: Role[];
  areas: Area[];
  users: UserFormatted[];
  permissionCategories: PermissionCategory[];
  timestamp: number;
  loadTime: number;
}

// ===== INTERFACES ACTUALIZADAS =====
interface AppData {
  // Usuario y auth
  user: AuthServiceUser | null;
  isAuthenticated: boolean;
  permissions: string[];
  
  // 🔧 CORREGIDO: Usar UserFormatted en lugar de UserServiceUser
  roles: Role[];
  areas: Area[];
  permissionCategories: PermissionCategory[];
  users: UserFormatted[]; // ✅ Cambiado de UserServiceUser
  
  // Estados de carga optimizados
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Control de cache mejorado
  lastRefresh: number;
  cacheValidUntil: number;
  systemDataStats: any;
  
  // Estados de WebSocket MEJORADOS
  websocket: {
    isConnected: boolean;
    connectionState: string;
    lastUpdate: number | null;
    connectionAttempts: number;
    lastError: string | null;
  };
  
  // Métodos
  refreshUser: () => Promise<void>;
  refreshSystemData: (selective?: SystemDataType[]) => Promise<void>;
  refreshAll: () => Promise<void>;
  invalidateCache: () => void;
  ensureSystemData: (requiredData: SystemDataType[]) => Promise<void>;
  getSystemDataStats: () => any;
  
  // Métodos de WebSocket
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  debugWebSocket: () => void;
  
  // 🆕 AGREGAR ESTE MÉTODO A LA INTERFAZ
  getOnlineUsersInfo: () => {
    performanceInfo: any;
    serviceInfo: any;
    isRedisAvailable: boolean;
  };
}

const AppDataContext = createContext<AppData | null>(null);
export { AppDataContext };

// ===== CONSTANTES =====
const CACHE_DURATION = 10 * 60 * 1000;
const USER_CACHE_DURATION = 5 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000;
const WS_CONNECTION_DELAY = 2000;
const WS_MAX_CONNECTION_ATTEMPTS = 3;
const WS_RETRY_DELAY = 5000;

// ===== PROVIDER =====
interface AppDataProviderProps {
  children: React.ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const [state, setState] = useState<Omit<AppData, 'refreshUser' | 'refreshSystemData' | 'refreshAll' | 'invalidateCache' | 'ensureSystemData' | 'getSystemDataStats' | 'connectWebSocket' | 'disconnectWebSocket' | 'debugWebSocket' | 'getOnlineUsersInfo'>>({
    user: null,
    isAuthenticated: false,
    permissions: [],
    roles: [],
    areas: [],
    permissionCategories: [],
    users: [], // ✅ Ahora es UserFormatted[]
    isLoading: true,
    isInitialized: false,
    error: null,
    lastRefresh: 0,
    cacheValidUntil: 0,
    systemDataStats: null,
    websocket: {
      isConnected: false,
      connectionState: 'disconnected',
      lastUpdate: null,
      connectionAttempts: 0,
      lastError: null
    }
  });

  // Refs para control de concurrencia
  const retryCountRef = useRef(0);
  const userCacheRef = useRef(0);
  const isLoadingRef = useRef(false);
  const wsConnectionTimeoutRef = useRef<number | null>(null);
  const wsReconnectTimeoutRef = useRef<number | null>(null);
  const wsConnectionAttemptsRef = useRef(0);

  // ===== CACHE HELPERS =====
  const isCacheValid = useCallback((type: 'user' | 'system' = 'system') => {
    const now = Date.now();
    if (type === 'user') {
      return now < userCacheRef.current;
    }
    const stats = systemDataService.getStats();
    return stats.hasCached && !stats.isExpired;
  }, []);

  const updateCacheTimestamp = useCallback((type: 'user' | 'system' | 'both' = 'both') => {
    const now = Date.now();
    if (type === 'user' || type === 'both') {
      userCacheRef.current = now + USER_CACHE_DURATION;
    }
    if (type === 'system' || type === 'both') {
      setState(prev => ({
        ...prev,
        lastRefresh: now,
        cacheValidUntil: now + CACHE_DURATION,
        systemDataStats: systemDataService.getStats()
      }));
    }
  }, []);

  const invalidateCache = useCallback(() => {
    userCacheRef.current = 0;
    systemDataService.clearCache();
    setState(prev => ({
      ...prev,
      cacheValidUntil: 0,
      lastRefresh: 0,
      systemDataStats: systemDataService.getStats()
    }));
    console.log('🧹 Cache invalidado completamente');
  }, []);

  // ===== WEBSOCKET HANDLERS =====
  
  const handleWebSocketUserUpdate = useCallback((userData: any) => {
    console.log('📨 WebSocket: Usuario actualizado', userData);
    
    setState(prev => {
      if (prev.user && prev.user.id === userData.id) {
        return {
          ...prev,
          user: { ...prev.user, ...userData },
          websocket: {
            ...prev.websocket,
            lastUpdate: Date.now()
          }
        };
      }
      
      // 🔧 CORREGIDO: Manejar UserFormatted correctamente
      const updatedUsers = prev.users.map(user => 
        user.id === userData.id ? { ...user, ...userData } : user
      );
      
      return {
        ...prev,
        users: updatedUsers,
        websocket: {
          ...prev.websocket,
          lastUpdate: Date.now()
        }
      };
    });
  }, []);
  
  const handleWebSocketSystemDataUpdate = useCallback((updateData: { type: string; data: any }) => {
    console.log('📨 WebSocket: Datos del sistema actualizados', updateData.type);
    
    setState(prev => {
      const newState = { ...prev };
      
      switch (updateData.type) {
        case 'role':
          if (updateData.data.action === 'created' || updateData.data.action === 'updated') {
            const existingIndex = newState.roles.findIndex(r => r.id === updateData.data.role.id);
            if (existingIndex >= 0) {
              newState.roles[existingIndex] = updateData.data.role;
            } else {
              newState.roles.push(updateData.data.role);
            }
          } else if (updateData.data.action === 'deleted') {
            newState.roles = newState.roles.filter(r => r.id !== updateData.data.roleId);
          }
          break;
          
        case 'area':
          if (updateData.data.action === 'created' || updateData.data.action === 'updated') {
            const existingIndex = newState.areas.findIndex(a => a.id === updateData.data.area.id);
            if (existingIndex >= 0) {
              newState.areas[existingIndex] = updateData.data.area;
            } else {
              newState.areas.push(updateData.data.area);
            }
          } else if (updateData.data.action === 'deleted') {
            newState.areas = newState.areas.filter(a => a.id !== updateData.data.areaId);
          }
          break;
          
        case 'user':
          if (updateData.data.action === 'created' || updateData.data.action === 'updated') {
            const existingIndex = newState.users.findIndex(u => u.id === updateData.data.user.id);
            if (existingIndex >= 0) {
              newState.users[existingIndex] = updateData.data.user;
            } else {
              newState.users.push(updateData.data.user);
            }
          } else if (updateData.data.action === 'deleted') {
            newState.users = newState.users.filter(u => u.id !== updateData.data.userId);
          }
          break;
      }
      
      return {
        ...newState,
        websocket: {
          ...prev.websocket,
          lastUpdate: Date.now()
        }
      };
    });
    
    systemDataService.clearCache();
  }, []);
  
  const handleWebSocketNotification = useCallback((notification: any) => {
    console.log('🔔 WebSocket: Notificación recibida', notification);
    
    if (notification.type === 'system_maintenance') {
      setState(prev => ({
        ...prev,
        error: `Mantenimiento del sistema: ${notification.message}`
      }));
    }
  }, []);

  const handleWebSocketConnected = useCallback(() => {
    console.log('✅ WebSocket conectado - actualizando estado');
    setState(prev => ({
      ...prev,
      websocket: {
        ...prev.websocket,
        isConnected: true,
        connectionState: 'connected',
        lastError: null,
        connectionAttempts: wsConnectionAttemptsRef.current
      }
    }));
    
    wsConnectionAttemptsRef.current = 0;
  }, []);

  const handleWebSocketDisconnected = useCallback((data: any) => {
    console.log('❌ WebSocket desconectado:', data);
    setState(prev => ({
      ...prev,
      websocket: {
        ...prev.websocket,
        isConnected: false,
        connectionState: 'disconnected',
        lastError: data.reason || 'Desconectado'
      }
    }));
  }, []);

  const handleWebSocketError = useCallback((data: any) => {
    console.error('💥 WebSocket error:', data);
    setState(prev => ({
      ...prev,
      websocket: {
        ...prev.websocket,
        isConnected: false,
        connectionState: 'error',
        lastError: data.error?.message || 'Error de conexión'
      }
    }));
  }, []);

  // ===== DATA LOADING METHODS =====
  
  const loadUserData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('user') && state.user && state.isAuthenticated) {
      console.log('📦 Usando datos de usuario desde cache');
      return;
    }

    try {
      console.log('🔄 Cargando datos de usuario...');
      const startTime = Date.now();

      const [user, userPermissions] = await Promise.all([
        authService.getCurrentUser().catch(() => null),
        authService.getUserPermissions().catch(() => [])
      ]);

      const endTime = Date.now();
      console.log(`✅ Datos de usuario cargados en ${endTime - startTime}ms`);

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

  const loadSystemData = useCallback(async (selective?: SystemDataType[], forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('system') && state.roles.length > 0) {
      console.log('📦 Usando datos del sistema desde cache');
      return;
    }

    try {
      console.log('🔄 Cargando datos del sistema...');
      const startTime = Date.now();

      let systemData: SystemDataResponse | undefined;
      if (selective && selective.length > 0) {
        const selectiveData = await systemDataService.loadSelectiveData(selective, { forceRefresh });
        
        setState(prev => ({
          ...prev,
          ...(selectiveData.roles && { roles: selectiveData.roles }),
          ...(selectiveData.areas && { areas: selectiveData.areas }),
          ...(selectiveData.users && { users: selectiveData.users }),
          ...(selectiveData.permissionCategories && { permissionCategories: selectiveData.permissionCategories }),
          error: null,
          systemDataStats: systemDataService.getStats()
        }));
      } else {
        systemData = await systemDataService.loadAllSystemData({ forceRefresh });

        const endTime = Date.now();
        console.log(`✅ Datos del sistema cargados en ${endTime - startTime}ms`);

        setState(prev => ({
          ...prev,
          roles: systemData!.roles,
          areas: systemData!.areas,
          permissionCategories: systemData!.permissionCategories,
          users: systemData!.users,
          error: null,
          systemDataStats: systemDataService.getStats()
        }));
      }

      updateCacheTimestamp('system');
      
    } catch (error) {
      console.error('💥 Error cargando datos del sistema:', error);
      setState(prev => ({
        ...prev,
        error: `Error cargando datos del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        systemDataStats: systemDataService.getStats()
      }));
    }
  }, [isCacheValid, state.roles.length, updateCacheTimestamp]);

  const ensureSystemData = useCallback(async (requiredData: SystemDataType[]) => {
    console.log(`🔍 Verificando disponibilidad de: ${requiredData.join(', ')}`);
    
    const missingData: SystemDataType[] = [];
    
    if (requiredData.includes('roles') && state.roles.length === 0) missingData.push('roles');
    if (requiredData.includes('areas') && state.areas.length === 0) missingData.push('areas');
    if (requiredData.includes('users') && state.users.length === 0) missingData.push('users');
    if (requiredData.includes('permissions') && state.permissionCategories.length === 0) missingData.push('permissions');
    
    if (missingData.length > 0) {
      console.log(`📥 Cargando datos faltantes: ${missingData.join(', ')}`);
      await loadSystemData(missingData);
    } else {
      console.log('✅ Todos los datos requeridos están disponibles');
    }
  }, [state.roles.length, state.areas.length, state.users.length, state.permissionCategories.length, loadSystemData]);

  const loadInitialData = useCallback(async (isRetry = false) => {
    if (isLoadingRef.current && !isRetry) {
      console.log('🔒 Carga ya en progreso, omitiendo...');
      return;
    }

    isLoadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🚀 Iniciando carga inicial optimizada...');
      const startTime = Date.now();

      const isAuth = await authService.checkAuthStatus();
      
      if (isAuth) {
        await loadUserData(true);
        
        const currentPath = window.location.pathname;
        const needsSystemData = currentPath.includes('/dashboard') && 
                               !currentPath.includes('/dashboard/settings');
        
        if (needsSystemData) {
          console.log('📊 Ruta requiere datos del sistema...');
          await systemDataService.smartRefresh();
          
          const systemData = await systemDataService.loadAllSystemData();
          setState(prev => ({
            ...prev,
            roles: systemData.roles,
            areas: systemData.areas,
            permissionCategories: systemData.permissionCategories,
            users: systemData.users,
            systemDataStats: systemDataService.getStats()
          }));
        }
      } else {
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
        isInitialized: true,
        systemDataStats: systemDataService.getStats()
      }));

      retryCountRef.current = 0;
      
    } catch (error) {
      console.error('💥 Error en carga inicial:', error);
      
      retryCountRef.current++;
      
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Reintentando... (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
        setTimeout(() => loadInitialData(true), RETRY_DELAY);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: `Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          systemDataStats: systemDataService.getStats()
        }));
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [loadUserData]);

  // ===== WEBSOCKET CONNECTION MANAGEMENT =====
  
  const connectWebSocket = useCallback(async () => {
    try {
      if (!state.isAuthenticated || !state.user) {
        console.log('🔌 No se puede conectar WebSocket: usuario no autenticado');
        return;
      }
      
      wsConnectionAttemptsRef.current++;
      
      console.log(`🔌 Conectando WebSocket... (intento ${wsConnectionAttemptsRef.current})`);
      
      setState(prev => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          connectionState: 'connecting',
          connectionAttempts: wsConnectionAttemptsRef.current
        }
      }));
      
      webSocketService.on('connected', handleWebSocketConnected);
      webSocketService.on('disconnected', handleWebSocketDisconnected);
      webSocketService.on('error', handleWebSocketError);
      webSocketService.onUserUpdate(handleWebSocketUserUpdate);
      webSocketService.onSystemDataUpdate(handleWebSocketSystemDataUpdate);
      webSocketService.onNotification(handleWebSocketNotification);
      
      const userId = parseInt(String(state.user.id), 10);
      if (isNaN(userId)) {
        console.error('❌ User ID no es un número válido:', state.user.id);
        setState(prev => ({
          ...prev,
          websocket: {
            ...prev.websocket,
            connectionState: 'error',
            lastError: 'User ID inválido'
          }
        }));
        return;
      }
      
      await webSocketService.connect(userId);
      console.log('✅ WebSocket conectado');
      
    } catch (error) {
      console.error('💥 Error conectando WebSocket:', error);
      setState(prev => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          isConnected: false,
          connectionState: 'error',
          lastError: error instanceof Error ? error.message : 'Error desconocido'
        }
      }));
      
      if (wsConnectionAttemptsRef.current < WS_MAX_CONNECTION_ATTEMPTS) {
        console.log(`🔄 Reintentando conexión WebSocket en ${WS_RETRY_DELAY/1000}s...`);
        wsReconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, WS_RETRY_DELAY);
      } else {
        console.error(`❌ Máximo número de intentos de conexión WebSocket alcanzado (${WS_MAX_CONNECTION_ATTEMPTS})`);
      }
    }
  }, [state.isAuthenticated, state.user, handleWebSocketConnected, handleWebSocketDisconnected, handleWebSocketError, handleWebSocketUserUpdate, handleWebSocketSystemDataUpdate, handleWebSocketNotification]);

  const disconnectWebSocket = useCallback(() => {
    console.log('🔌 Desconectando WebSocket...');
    
    if (wsConnectionTimeoutRef.current) {
      clearTimeout(wsConnectionTimeoutRef.current);
      wsConnectionTimeoutRef.current = null;
    }
    
    if (wsReconnectTimeoutRef.current) {
      clearTimeout(wsReconnectTimeoutRef.current);
      wsReconnectTimeoutRef.current = null;
    }
    
    webSocketService.off('connected');
    webSocketService.off('disconnected');
    webSocketService.off('error');
    webSocketService.off('user_updated');
    webSocketService.off('system_data_updated');
    webSocketService.off('notification');
    
    webSocketService.disconnect();
    
    wsConnectionAttemptsRef.current = 0;
    
    setState(prev => ({
      ...prev,
      websocket: {
        isConnected: false,
        connectionState: 'disconnected',
        lastUpdate: null,
        connectionAttempts: 0,
        lastError: null
      }
    }));
  }, []);

  const debugWebSocket = useCallback(() => {
    console.log('🔍 === WEBSOCKET DEBUG INFO ===');
    console.log('Estado del contexto:', state.websocket);
    console.log('Intentos de conexión:', wsConnectionAttemptsRef.current);
    console.log('Info del servicio:', webSocketService.getDebugInfo());
    webSocketService.debugCookies();
    console.log('===============================');
  }, [state.websocket]);

  // ===== EFECTOS =====
  
  useEffect(() => {
     const handleAuthLogin = () => {
      console.log('🔔 Auth login event received');
      loadUserData(true);
     onlineUsersService.onAuthLogin();
  };

    const handleAuthLogout = () => {
      console.log('🔔 Auth logout event received');
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        permissions: [],
      }));
      userCacheRef.current = 0;
      disconnectWebSocket();
      
      // 🆕 LIMPIAR ESTADO ONLINE
      onlineUsersService.onAuthLogout();
    };

    const handleRefreshUser = () => {
      console.log('🔔 Refresh user event received');
      loadUserData(true);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:refresh-user', handleRefreshUser);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:refresh-user', handleRefreshUser);
    };
  }, [loadUserData, disconnectWebSocket]);

  const getOnlineUsersInfo = useCallback(() => {
    return {
      performanceInfo: onlineUsersService.getPerformanceInfo(),
      serviceInfo: onlineUsersService.getServiceInfo(),
      isRedisAvailable: onlineUsersService.getPerformanceInfo().redisAvailable
    };
  }, []);

  useEffect(() => {
    if (!state.isInitialized && !isLoadingRef.current) {
      loadInitialData();
    }
  }, [state.isInitialized, loadInitialData]);

  useEffect(() => {
    if (state.isAuthenticated && state.isInitialized && !state.websocket.isConnected) {
      wsConnectionTimeoutRef.current = window.setTimeout(() => {
        console.log('⏰ Iniciando conexión WebSocket después del delay');
        connectWebSocket();
      }, WS_CONNECTION_DELAY);
      
      return () => {
        if (wsConnectionTimeoutRef.current) {
          clearTimeout(wsConnectionTimeoutRef.current);
          wsConnectionTimeoutRef.current = null;
        }
      };
    } else if (!state.isAuthenticated && state.websocket.isConnected) {
      disconnectWebSocket();
    }
  }, [state.isAuthenticated, state.isInitialized, state.websocket.isConnected, connectWebSocket, disconnectWebSocket]);
  
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
    };
  }, [disconnectWebSocket]);

  // ===== REFRESH METHODS =====
  
  const refreshUser = useCallback(async () => {
    console.log('🔄 Refresh específico de usuario...');
    await loadUserData(true);
  }, [loadUserData]);

  const refreshSystemData = useCallback(async (selective?: SystemDataType[]) => {
    console.log('🔄 Refresh de datos del sistema...');
    await loadSystemData(selective, true);
  }, [loadSystemData]);

  const refreshAll = useCallback(async () => {
    console.log('🔄 Refresh completo de todos los datos...');
    invalidateCache();
    retryCountRef.current = 0;
    await loadInitialData();
  }, [invalidateCache, loadInitialData]);

  const getSystemDataStats = useCallback(() => {
    return {
      context: {
        rolesCount: state.roles.length,
        areasCount: state.areas.length,
        usersCount: state.users.length,
        categoriesCount: state.permissionCategories.length,
        lastRefresh: state.lastRefresh,
        cacheValidUntil: state.cacheValidUntil
      },
      service: systemDataService.getStats()
    };
  }, [state.roles.length, state.areas.length, state.users.length, state.permissionCategories.length, state.lastRefresh, state.cacheValidUntil]);

  const contextValue: AppData = {
    ...state,
    refreshUser,
    refreshSystemData,
    refreshAll,
    invalidateCache,
    ensureSystemData,
    getSystemDataStats,
    connectWebSocket,
    disconnectWebSocket,
    debugWebSocket,
    
    // 🆕 NUEVA FUNCIONALIDAD
    getOnlineUsersInfo
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

// ===== HOOKS =====
export const useAppData = () => {
  const context = useContext(AppDataContext);
  
  if (!context) {
    throw new Error('useAppData debe usarse dentro de AppDataProvider');
  }
  
  return context;
};

export const useAuth = () => {
  const { user, isAuthenticated, permissions, refreshUser } = useAppData();
  return { user, isAuthenticated, permissions, refreshUser };
};

export const useWebSocketDebugHook = () => {
  const { websocket, debugWebSocket } = useAppData();
  
  const getDebugInfo = useCallback(() => {
    return {
      context: websocket,
      service: webSocketService.getDebugInfo()
    };
  }, [websocket]);
  
  const sendTestMessage = useCallback(() => {
    webSocketService.sendTestMessage();
  }, []);
  
  const forceReconnect = useCallback(() => {
    webSocketService.forceReconnect();
  }, []);
  
  return {
    debugInfo: getDebugInfo(),
    sendTestMessage,
    forceReconnect,
    debugWebSocket,
    isConnected: websocket.isConnected,
    connectionState: websocket.connectionState,
    lastError: websocket.lastError,
    connectionAttempts: websocket.connectionAttempts
  };
};

export const useEnsuredSystemData = (requiredData: SystemDataType[]) => {
  const { 
    roles, areas, users, permissionCategories, 
    ensureSystemData, isLoading, isInitialized,
    refreshSystemData, getSystemDataStats
  } = useAppData();
  
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    if (isInitialized && !isLoading) {
      setLocalLoading(true);
      ensureSystemData(requiredData)
        .finally(() => setLocalLoading(false));
    }
  }, [isInitialized, isLoading, requiredData, ensureSystemData]);
  
  const filteredData = {
    ...(requiredData.includes('roles') && { roles }),
    ...(requiredData.includes('areas') && { areas }),
    ...(requiredData.includes('users') && { users }),
    ...(requiredData.includes('permissions') && { permissionCategories })
  };
  
  return {
    ...filteredData,
    isLoading: isLoading || localLoading,
    refresh: () => refreshSystemData(requiredData),
    stats: getSystemDataStats()
  };
};

export const useSystemDataStats = () => {
  const { getSystemDataStats } = useAppData();
  return getSystemDataStats();
};

export const useWebSocketStatus = () => {
  const { websocket, connectWebSocket, disconnectWebSocket, debugWebSocket } = useAppData();
  
  return {
    ...websocket,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    debug: debugWebSocket,
    isOnline: websocket.isConnected && websocket.connectionState === 'connected'
  };
};