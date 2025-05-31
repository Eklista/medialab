// frontend/src/features/dashboard/hooks/useOnlineUsers.ts - NUEVO HOOK DEDICADO

import { useState, useEffect, useRef, useCallback } from 'react';
import { onlineUsersService, OnlineUser } from '../services/users/onlineUsers.service';
import { useWebSocketStatus } from '../context/AppDataContext';

interface UseOnlineUsersReturn {
  users: OnlineUser[];
  isLoading: boolean;
  error: string | null;
  totalOnline: number;
  totalActive: number;
  lastUpdate: string | null;
  refresh: () => Promise<void>;
  startAutoRefresh: (interval?: number) => void;
  stopAutoRefresh: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

export const useOnlineUsers = (
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseOnlineUsersReturn => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  const refreshTimerRef = useRef<number | null>(null);
  const heartbeatStopperRef = useRef<(() => void) | null>(null);
  const wsStatus = useWebSocketStatus();
  
  // Función para cargar usuarios online
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Cargando usuarios online...');
      const response = await onlineUsersService.getOnlineUsers();
      
      if (response.error) {
        setError(response.error);
        console.error('❌ Error en respuesta:', response.error);
      } else {
        setUsers(response.users);
        setLastUpdate(response.timestamp);
        console.log(`✅ ${response.users.length} usuarios online cargados`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('💥 Error cargando usuarios online:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para refrescar datos
  const refresh = useCallback(async () => {
    console.log('🔄 Refresh manual de usuarios online');
    await loadUsers();
  }, [loadUsers]);

  // Auto-refresh
  const startAutoRefresh = useCallback((interval: number = refreshInterval) => {
    console.log(`⏰ Iniciando auto-refresh cada ${interval/1000}s`);
    
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = window.setInterval(() => {
      loadUsers();
    }, interval);
  }, [loadUsers, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    console.log('🛑 Deteniendo auto-refresh');
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Heartbeat
  const startHeartbeat = useCallback(() => {
    console.log('💓 Iniciando heartbeat automático');
    if (heartbeatStopperRef.current) {
      heartbeatStopperRef.current();
    }
    heartbeatStopperRef.current = onlineUsersService.startHeartbeat(60000); // Cada minuto
  }, []);

  const stopHeartbeat = useCallback(() => {
    console.log('🛑 Deteniendo heartbeat');
    if (heartbeatStopperRef.current) {
      heartbeatStopperRef.current();
      heartbeatStopperRef.current = null;
    }
  }, []);

  // Efecto principal - cargar datos iniciales
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  // Efecto para heartbeat
  useEffect(() => {
    startHeartbeat();
    
    return () => {
      stopHeartbeat();
    };
  }, [startHeartbeat, stopHeartbeat]);

  // WebSocket updates
  useEffect(() => {
    if (wsStatus.isConnected) {
      console.log('🔌 WebSocket conectado - usuarios online recibirán updates automáticos');
      
      // TODO: Implementar listeners específicos para WebSocket cuando sea necesario
      // Por ahora, el AppDataContext ya maneja esto globalmente
      // 
      // Ejemplo de implementación futura:
      // webSocketService.onUserUpdate(handleUserUpdate);
      // return () => webSocketService.off('user_updated');
    }
  }, [wsStatus.isConnected]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      stopHeartbeat();
    };
  }, [stopAutoRefresh, stopHeartbeat]);

  // Estadísticas calculadas
  const totalOnline = users.filter(u => u.status === 'online').length;
  const totalActive = users.filter(u => u.isOnline).length;

  return {
    users,
    isLoading,
    error,
    totalOnline,
    totalActive,
    lastUpdate,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    startHeartbeat,
    stopHeartbeat
  };
};

// Hook simplificado para mostrar solo la lista
export const useOnlineUsersList = () => {
  const { users, isLoading, error } = useOnlineUsers(true, 30000);
  
  return {
    users,
    isLoading,
    error,
    count: users.length
  };
};

// Hook para estadísticas rápidas
export const useOnlineUsersStats = () => {
  const { totalOnline, totalActive, lastUpdate } = useOnlineUsers(true, 60000);
  
  return {
    totalOnline,
    totalActive,
    lastUpdate
  };
};