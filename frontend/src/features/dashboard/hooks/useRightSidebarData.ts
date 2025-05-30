// frontend/src/features/dashboard/hooks/useRightSidebarData.ts

import { useState, useEffect } from 'react';
import { TaskItem, NotificationItem, OnlineUser } from '../components/rightSidebar';

interface RightSidebarData {
  tasks: TaskItem[];
  notifications: NotificationItem[];
  onlineUsers: OnlineUser[];
  isLoading: boolean;
  error: string | null;
}

export const useRightSidebarData = () => {
  const [data, setData] = useState<RightSidebarData>({
    tasks: [],
    notifications: [],
    onlineUsers: [],
    isLoading: true,
    error: null
  });

  // Función para cargar tareas
  const loadTasks = async (): Promise<TaskItem[]> => {
    // Aquí harías la llamada a tu API
    // Por ahora retornamos datos de muestra
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { 
            id: "task-1", 
            title: "Revisar guión para programa semanal", 
            dueDate: "2025-05-26", 
            status: "Pendiente", 
            priority: "Alta" 
          },
          { 
            id: "task-2", 
            title: "Preparar equipos para transmisión", 
            dueDate: "2025-05-27", 
            status: "En progreso", 
            priority: "Media" 
          },
          { 
            id: "task-3", 
            title: "Editar podcast episodio #45", 
            dueDate: "2025-05-28", 
            status: "Pendiente", 
            priority: "Media" 
          }
        ]);
      }, 1000);
    });
  };

  // Función para cargar notificaciones
  const loadNotifications = async (): Promise<NotificationItem[]> => {
    // Aquí harías la llamada a tu API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "notif-1",
            user: { name: "Carlos Ramírez" },
            action: "completó la transmisión en vivo de",
            target: "Conferencia de Bienvenida",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: "success"
          },
          {
            id: "notif-2",
            user: { name: "María Fernández" },
            action: "actualizó el estado del proyecto",
            target: "Video institucional",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            type: "info"
          }
        ]);
      }, 1200);
    });
  };

  // Función para cargar usuarios online
  const loadOnlineUsers = async (): Promise<OnlineUser[]> => {
    // Aquí harías la llamada a tu API o WebSocket
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            firstName: "Carlos",
            lastName: "Ramírez",
            email: "carlos.ramirez@medialab.com",
            profileImage: "/avatars/carlos.jpg",
            lastSeen: new Date().toISOString(),
            isOnline: true,
            status: "available"
          },
          {
            id: 2,
            firstName: "María",
            lastName: "Fernández",
            email: "maria.fernandez@medialab.com",
            profileImage: "/avatars/maria.jpg",
            lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            isOnline: true,
            status: "busy"
          },
          {
            id: 3,
            firstName: "Juan",
            lastName: "López",
            email: "juan.lopez@medialab.com",
            lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            isOnline: true,
            status: "available"
          }
        ]);
      }, 800);
    });
  };

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const [tasks, notifications, onlineUsers] = await Promise.all([
          loadTasks(),
          loadNotifications(),
          loadOnlineUsers()
        ]);

        setData({
          tasks,
          notifications,
          onlineUsers,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    };

    loadAllData();
  }, []);

  // Función para refrescar datos específicos
  const refresh = {
    tasks: async () => {
      const tasks = await loadTasks();
      setData(prev => ({ ...prev, tasks }));
    },
    notifications: async () => {
      const notifications = await loadNotifications();
      setData(prev => ({ ...prev, notifications }));
    },
    onlineUsers: async () => {
      const onlineUsers = await loadOnlineUsers();
      setData(prev => ({ ...prev, onlineUsers }));
    },
    all: async () => {
      const [tasks, notifications, onlineUsers] = await Promise.all([
        loadTasks(),
        loadNotifications(),
        loadOnlineUsers()
      ]);
      setData(prev => ({ ...prev, tasks, notifications, onlineUsers }));
    }
  };

  // Función para agregar nueva notificación (útil para WebSocket)
  const addNotification = (notification: NotificationItem) => {
    setData(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications]
    }));
  };

  // Función para actualizar estado de usuario online
  const updateUserStatus = (userId: number, updates: Partial<OnlineUser>) => {
    setData(prev => ({
      ...prev,
      onlineUsers: prev.onlineUsers.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      )
    }));
  };

  return {
    ...data,
    refresh,
    addNotification,
    updateUserStatus
  };
};