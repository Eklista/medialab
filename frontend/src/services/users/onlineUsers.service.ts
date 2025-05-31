// frontend/src/services/users/onlineUsers.service.ts - NUEVO SERVICIO

import apiClient from '../api';

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
  timestamp: string;
  error?: string;
}

export interface HeartbeatResponse {
  success: boolean;
  timestamp: string;
  status: string;
  userId: number;
  message: string;
  error?: string;
}

class OnlineUsersService {
  /**
   * 👥 Obtiene usuarios online
   */
  async getOnlineUsers(): Promise<OnlineUsersResponse> {
    try {
      console.log('🔄 Obteniendo usuarios online...');
      
      const response = await apiClient.get('/users/online');
      
      console.log('✅ Usuarios online obtenidos:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('💥 Error obteniendo usuarios online:', error);
      
      // Fallback con datos vacíos
      return {
        users: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 💓 Envía heartbeat para mantener usuario activo
   */
  async sendHeartbeat(): Promise<HeartbeatResponse> {
    try {
      const response = await apiClient.post('/users/heartbeat');
      return response.data;
      
    } catch (error) {
      console.error('💥 Error enviando heartbeat:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        status: 'error',
        userId: 0,
        message: 'Error en heartbeat',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🔄 Actualiza estado online manualmente
   */
  async updateOnlineStatus(isOnline: boolean, status: string = 'online'): Promise<any> {
    try {
      const response = await apiClient.patch('/users/online-status', {
        isOnline,
        status
      });
      
      return response.data;
      
    } catch (error) {
      console.error('💥 Error actualizando estado online:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtiene usuarios activos para menú/sidebar
   */
  async getActiveUsersForMenu(limit: number = 20): Promise<OnlineUser[]> {
    try {
      const response = await apiClient.get(`/users/active-menu?limit=${limit}`);
      return response.data;
      
    } catch (error) {
      console.error('💥 Error obteniendo usuarios activos para menú:', error);
      return [];
    }
  }

  /**
   * 🔄 Auto-heartbeat con intervalo
   */
  startHeartbeat(intervalMs: number = 60000): () => void {
    console.log('💓 Iniciando heartbeat automático cada', intervalMs/1000, 'segundos');
    
    // Enviar heartbeat inicial
    this.sendHeartbeat();
    
    // Configurar intervalo
    const interval = setInterval(() => {
      this.sendHeartbeat().then(response => {
        if (!response.success) {
          console.warn('⚠️ Heartbeat falló:', response.error);
        }
      });
    }, intervalMs);
    
    // Retornar función para detener
    return () => {
      console.log('🛑 Deteniendo heartbeat automático');
      clearInterval(interval);
    };
  }

  /**
   * 📊 Estadísticas de usuarios online
   */
  async getOnlineStats(): Promise<{
    totalOnline: number;
    totalAway: number;
    totalActive: number;
    lastUpdate: string;
  }> {
    try {
      const data = await this.getOnlineUsers();
      
      const stats = {
        totalOnline: data.users.filter(u => u.status === 'online').length,
        totalAway: data.users.filter(u => u.status === 'away').length,
        totalActive: data.users.filter(u => u.isOnline).length,
        lastUpdate: data.timestamp
      };
      
      return stats;
      
    } catch (error) {
      console.error('💥 Error obteniendo estadísticas online:', error);
      return {
        totalOnline: 0,
        totalAway: 0,
        totalActive: 0,
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

// Exportar instancia singleton
export const onlineUsersService = new OnlineUsersService();
export default onlineUsersService;