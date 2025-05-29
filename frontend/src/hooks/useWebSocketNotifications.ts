// frontend/src/hooks/useWebSocketNotifications.ts
// 🔔 Hook personalizado para manejar notificaciones WebSocket

import { useEffect, useState, useCallback } from 'react';
import webSocketService from '../services/websocket/websocket.service';
import { useWebSocketStatus } from '../context/AppDataContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'admin' | 'system';
  timestamp: number;
  read: boolean;
}

export const useWebSocketNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsStatus = useWebSocketStatus();
  
  const addNotification = useCallback((notificationData: any) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      title: notificationData.title || 'Nueva notificación',
      message: notificationData.message || '',
      type: notificationData.notification_type || notificationData.type || 'info',
      timestamp: Date.now(),
      read: false
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Máximo 50 notificaciones
    setUnreadCount(prev => prev + 1);
    
    // Mostrar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // Ajusta la ruta según tu favicon
        tag: notification.id
      });
    }
    
    console.log('🔔 Nueva notificación:', notification);
  }, []);
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);
  
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);
  
  // Configurar listener de WebSocket
  useEffect(() => {
    if (wsStatus.isConnected) {
      webSocketService.onNotification(addNotification);
      
      return () => {
        webSocketService.off('notification');
      };
    }
  }, [wsStatus.isConnected, addNotification]);
  
  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permisos de notificación:', permission);
      });
    }
  }, []);
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
    isWebSocketConnected: wsStatus.isConnected
  };
};

// Hook para manejar actualizaciones de datos en tiempo real
export const useWebSocketDataUpdates = () => {
  const [lastUpdate, setLastUpdate] = useState<{
    type: string;
    timestamp: number;
    data: any;
  } | null>(null);
  
  const wsStatus = useWebSocketStatus();
  
  const handleUserUpdate = useCallback((userData: any) => {
    setLastUpdate({
      type: 'user_updated',
      timestamp: Date.now(),
      data: userData
    });
    
    console.log('📨 Usuario actualizado via WebSocket:', userData);
  }, []);
  
  const handleSystemDataUpdate = useCallback((updateData: any) => {
    setLastUpdate({
      type: 'system_data_updated',
      timestamp: Date.now(),
      data: updateData
    });
    
    console.log('📨 Datos del sistema actualizados via WebSocket:', updateData);
  }, []);
  
  useEffect(() => {
    if (wsStatus.isConnected) {
      webSocketService.onUserUpdate(handleUserUpdate);
      webSocketService.onSystemDataUpdate(handleSystemDataUpdate);
      
      return () => {
        webSocketService.off('user_updated');
        webSocketService.off('system_data_updated');
      };
    }
  }, [wsStatus.isConnected, handleUserUpdate, handleSystemDataUpdate]);
  
  return {
    lastUpdate,
    isWebSocketConnected: wsStatus.isConnected,
    clearLastUpdate: () => setLastUpdate(null)
  };
};

// Hook simple para estado de conexión WebSocket
export const useWebSocketConnection = () => {
  const wsStatus = useWebSocketStatus();
  const [connectionHistory, setConnectionHistory] = useState<{
    timestamp: number;
    state: string;
    connected: boolean;
  }[]>([]);
  
  useEffect(() => {
    setConnectionHistory(prev => [
      ...prev.slice(-9), // Mantener últimos 10 estados
      {
        timestamp: Date.now(),
        state: wsStatus.connectionState,
        connected: wsStatus.isConnected
      }
    ]);
  }, [wsStatus.connectionState, wsStatus.isConnected]);
  
  const getConnectionQuality = () => {
    if (!wsStatus.isConnected) return 'disconnected';
    
    const recentHistory = connectionHistory.slice(-5);
    const disconnections = recentHistory.filter(h => !h.connected).length;
    
    if (disconnections === 0) return 'excellent';
    if (disconnections <= 1) return 'good';
    if (disconnections <= 2) return 'fair';
    return 'poor';
  };
  
  return {
    ...wsStatus,
    connectionHistory,
    connectionQuality: getConnectionQuality(),
    reconnect: webSocketService.forceReconnect.bind(webSocketService),
    sendTest: webSocketService.sendTestMessage.bind(webSocketService)
  };
};