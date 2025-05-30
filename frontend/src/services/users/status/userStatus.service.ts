// ===================================================================
// frontend/src/services/users/status/userStatus.service.ts - 🔧 CORREGIDO
// ===================================================================
import apiClient, { handleApiError } from '../../api';
import { UserPresence } from '../types/user.types';

class UserStatusService {
  /**
   * 🟢 Actualiza el estado online del usuario
   */
  async updateOnlineStatus(isOnline: boolean): Promise<{success: boolean}> {
    try {
      console.log(`🟢 Actualizando estado online: ${isOnline}`);
      
      const response = await apiClient.patch('/users/profile/online-status', {
        is_online: isOnline
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando estado online:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 💓 Envía heartbeat para mantener usuario activo
   */
  async sendHeartbeat(): Promise<{success: boolean}> {
    try {
      const response = await apiClient.post('/users/presence/heartbeat');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Error enviando heartbeat:', error);
      return { success: false };
    }
  }

  /**
   * 📊 Obtiene estado de presencia de un usuario
   */
  async getUserPresence(userId: number): Promise<UserPresence> {
    try {
      const response = await apiClient.get(`/users/${userId}/presence`);
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Error obteniendo presencia del usuario ${userId}:`, error);
      return { isOnline: false, lastSeen: null, status: 'offline' };
    }
  }

  /**
   * 👥 Obtiene todos los usuarios online
   */
  async getOnlineUsers(): Promise<Array<{
    id: number;
    name: string;
    status: string;
    lastSeen: string;
  }>> {
    try {
      console.log('👥 Obteniendo usuarios online...');
      
      const response = await apiClient.get('/users/online');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo usuarios online:', error);
      return [];
    }
  }

  /**
   * ⏰ Inicia monitoring automático de presencia
   */
  startPresenceMonitoring(intervalMs: number = 30000): () => void {
    console.log(`⏰ Iniciando monitoring de presencia cada ${intervalMs}ms`);
    
    const interval = setInterval(() => {
      this.sendHeartbeat().catch(error => {
        console.warn('⚠️ Heartbeat falló:', error);
      });
    }, intervalMs);
    
    // Enviar heartbeat inicial
    this.sendHeartbeat();
    
    // Retornar función para detener el monitoring
    return () => {
      console.log('⏰ Deteniendo monitoring de presencia');
      clearInterval(interval);
      this.updateOnlineStatus(false).catch(() => {});
    };
  }

  /**
   * 🔄 Actualiza estado cuando la ventana pierde/gana foco
   */
  setupVisibilityTracking(): () => void {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log(`👁️ Visibilidad cambiada: ${isVisible ? 'visible' : 'hidden'}`);
      
      this.updateOnlineStatus(isVisible).catch(error => {
        console.warn('⚠️ Error actualizando estado por visibilidad:', error);
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Retornar función cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  /**
   * 👥 Obtiene usuarios online formateados para RightSidebar
   */
  async getOnlineUsersFormatted(): Promise<Array<{
    id: number;
    fullName: string;
    email: string;
    profileImage?: string;
    isOnline: boolean;
    lastSeen: string;
    onlineStatus: 'available' | 'busy' | 'away';
  }>> {
    try {
      console.log('👥 Obteniendo usuarios online formateados...');
      
      // Usar tu endpoint existente
      const onlineUsers = await this.getOnlineUsers();
      
      // Formatear para el componente
      return onlineUsers.map(user => ({
        id: user.id,
        fullName: user.name,
        email: '',
        profileImage: undefined,
        isOnline: true,
        lastSeen: user.lastSeen,
        onlineStatus: 'available' as const
      }));
      
    } catch (error) {
      console.warn('⚠️ Error obteniendo usuarios online formateados:', error);
      return [];
    }
  }
}

export default new UserStatusService();