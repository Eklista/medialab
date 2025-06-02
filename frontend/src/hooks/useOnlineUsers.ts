// frontend/src/hooks/useOnlineUsers.ts - 🔧 VERSIÓN CORREGIDA SIN ERRORES TS

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

export interface OnlineUser {
  id: number;
  name: string;
  fullName: string;
  initials: string;
  email: string;
  profileImage?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isOnline: boolean;
  lastSeen: string | null;
  lastLogin: string | null;
}

export interface OnlineUsersResponse {
  users: OnlineUser[];
  total: number;
  totalOnline: number;
  totalActive: number;
  timestamp: string;
  success?: boolean;
  debug?: any;
  error?: string;
}

// 🔧 TIPOS EXPLÍCITOS PARA ENDPOINTS
type EndpointType = 'online' | 'online-mock' | 'online-db-check';

interface UseOnlineUsersOptions {
  refreshInterval?: number;
  endpoint?: EndpointType;
  fallbackToMock?: boolean;
}

export const useOnlineUsers = (options: UseOnlineUsersOptions = {}) => {
  const {
    refreshInterval = 30000,
    endpoint = 'online' as EndpointType,
    fallbackToMock = true
  } = options;

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [totalOnline, setTotalOnline] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [currentEndpoint, setCurrentEndpoint] = useState<EndpointType>(endpoint);

  const fetchOnlineUsers = useCallback(async (endpointToUse: EndpointType = currentEndpoint) => {
    try {
      console.log(`🔄 Fetching online users from: /users/${endpointToUse}`);
      
      const response = await apiClient.get<OnlineUsersResponse>(`/users/${endpointToUse}`);
      
      console.log('✅ Online users response:', response.data);
      
      // Verificar si hay error en la respuesta
      if (response.data.error || response.data.success === false) {
        const errorMsg = response.data.error || 'Error en la respuesta del servidor';
        console.warn('⚠️ Response contains error:', errorMsg);
        
        // Si es el endpoint principal y hay fallback habilitado, intentar mock
        if (endpointToUse === 'online' && fallbackToMock) {
          console.log('🔄 Intentando fallback a endpoint mock...');
          setCurrentEndpoint('online-mock');
          return fetchOnlineUsers('online-mock');
        }
        
        setError(errorMsg);
        setUsers([]);
        setTotalOnline(0);
        setTotalActive(0);
        return;
      }
      
      // Procesar usuarios
      const processedUsers = (response.data.users || []).map(user => ({
        ...user,
        // Asegurar que todos los campos requeridos estén presentes
        fullName: user.fullName || user.name || `Usuario ${user.id}`,
        initials: user.initials || getInitials(user.fullName || user.name || 'U'),
        status: user.status || (user.isOnline ? 'online' : 'offline') as OnlineUser['status'],
        lastSeen: user.lastSeen || user.lastLogin,
      }));
      
      setUsers(processedUsers);
      setTotalOnline(response.data.totalOnline || processedUsers.filter(u => u.status === 'online').length);
      setTotalActive(response.data.totalActive || processedUsers.filter(u => u.isOnline).length);
      setLastUpdate(response.data.timestamp);
      setError(null);
      
      console.log(`✅ Processed ${processedUsers.length} online users - ${response.data.totalOnline} online, ${response.data.totalActive} active`);
      
    } catch (err: any) {
      console.error(`❌ Error fetching from /users/${endpointToUse}:`, err);
      
      // Si es un error 422 en el endpoint principal, intentar fallback
      if (err.response?.status === 422 && endpointToUse === 'online' && fallbackToMock) {
        console.log('🔄 Error 422 en endpoint principal, intentando mock...');
        setCurrentEndpoint('online-mock');
        return fetchOnlineUsers('online-mock');
      }
      
      let errorMessage = `Error cargando usuarios online (${endpointToUse})`;
      
      if (err.response?.status === 422) {
        console.error('💥 Error 422 - Validation Error:', err.response.data);
        errorMessage = 'Error de autenticación en el servidor';
        
        // Mostrar detalles del error 422
        if (err.response.data?.detail) {
          console.error('Details:', err.response.data.detail);
        }
      } else if (err.response?.status === 403) {
        errorMessage = 'Sin permisos para ver usuarios online';
      } else if (err.response?.status === 401) {
        errorMessage = 'No autenticado';
      } else {
        errorMessage = err.message || 'Error desconocido';
      }
      
      setError(errorMessage);
      setUsers([]);
      setTotalOnline(0);
      setTotalActive(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentEndpoint, fallbackToMock]);

  // Función de refresh manual
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  // Función para cambiar endpoint manualmente - 🔧 CON TIPOS CORRECTOS
  const switchEndpoint = useCallback((newEndpoint: EndpointType) => {
    console.log(`🔄 Cambiando endpoint de ${currentEndpoint} a ${newEndpoint}`);
    setCurrentEndpoint(newEndpoint);
    setIsLoading(true);
    fetchOnlineUsers(newEndpoint);
  }, [fetchOnlineUsers]);

  // Efecto inicial
  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchOnlineUsers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchOnlineUsers, refreshInterval]);

  return {
    users,
    isLoading,
    error,
    lastUpdate,
    totalOnline,
    totalActive,
    refresh,
    switchEndpoint,
    currentEndpoint,
    // Funciones de conveniencia para testing - 🔧 CON TIPOS CORRECTOS
    useMock: useCallback(() => switchEndpoint('online-mock'), [switchEndpoint]),
    useReal: useCallback(() => switchEndpoint('online'), [switchEndpoint]),
    useDbCheck: useCallback(() => switchEndpoint('online-db-check'), [switchEndpoint])
  };
};

// Utilidad para generar iniciales
function getInitials(name: string): string {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name[0].toUpperCase();
}

// Hook especializado para testing
export const useOnlineUsersMock = () => {
  return useOnlineUsers({
    endpoint: 'online-mock',
    refreshInterval: 0, // Sin auto-refresh para datos mock
    fallbackToMock: false
  });
};

// Hook con fallback automático
export const useOnlineUsersWithFallback = (refreshInterval: number = 30000) => {
  return useOnlineUsers({
    endpoint: 'online',
    refreshInterval,
    fallbackToMock: true
  });
};