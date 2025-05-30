// frontend/src/services/users/list/userList.service.ts
import apiClient, { handleApiError } from '../../api';
import { UserProfile, UserFormatted, UserListOptions, UserStats } from '../types/user.types';
import { userTransforms } from '../utils/userTransforms';

class UserListService {
  /**
   * 📋 Obtiene lista básica de usuarios
   */
  async getUsers(options: UserListOptions = {}): Promise<UserProfile[]> {
    try {
      console.log('📋 Obteniendo lista de usuarios...');
      
      const params = new URLSearchParams();
      if (options.skip) params.append('skip', options.skip.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      
      const response = await apiClient.get<UserProfile[]>(`/users/?${params}`);
      return response.data.map(user => userTransforms.normalizeUser(user));
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🎨 Obtiene usuarios con formato específico - VERSIÓN TEMPORAL
   */
  async getUsersFormatted(options: UserListOptions = {}): Promise<UserFormatted[]> {
    try {
      console.log('🚫 TEMPORAL: Usando solo endpoint básico para evitar 422...');
      
      // 🚫 NO USAR /users/formatted porque da 422
      // 🎯 USAR SOLO EL ENDPOINT QUE FUNCIONA
      const basicUsers = await this.getUsers(options);
      
      // 🔧 TRANSFORMACIÓN ESTABLE Y PREDECIBLE
      return basicUsers.map(user => this.createStableFormattedUser(user));
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios formateados:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔧 NUEVA: Crea UserFormatted de forma estable sin loops
   */
  private createStableFormattedUser(user: UserProfile): UserFormatted {
    const fullName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || user.email.split('@')[0] || 'Usuario';
    
    const initials = user.firstName && user.lastName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : user.email.charAt(0).toUpperCase();

    return {
      // Copiar todas las propiedades del usuario base
      ...user,
      
      // Añadir propiedades de UserFormatted
      fullName,
      initials,
      roles: [], // Temporal hasta que el backend tenga /users/formatted
      areas: [],
      permissions: [],
      roleDisplay: 'Sin rol',
      areaDisplay: 'Sin área',
      status: user.isActive ? 'offline' : 'inactive' as const,
      
      // Valores por defecto seguros
      isOnline: false,
      stats: undefined,
      display: undefined
    };
  }

  /**
   * 👥 Obtiene usuarios activos para menú - VERSIÓN SIMPLIFICADA
   */
  async getActiveUsers(limit: number = 50): Promise<UserFormatted[]> {
    try {
      console.log('👥 Obteniendo usuarios activos (simplificado)...');
      
      // 🚫 NO USAR /users/active-menu porque probablemente tampoco existe
      // 🎯 FILTRAR DESDE LA LISTA BÁSICA
      const allUsers = await this.getUsersFormatted({ 
        limit: limit * 2 // Obtener más para filtrar activos
      });
      
      return allUsers
        .filter(user => user.isActive) // Solo usuarios activos
        .slice(0, limit); // Limitar resultado
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios activos:', error);
      return []; // Return empty array en lugar de lanzar error
    }
  }

  /**
   * 🔍 Obtiene usuarios por rol - VERSIÓN SIMPLIFICADA
   */
  async getUsersByRole(roleName: string): Promise<UserProfile[]> {
    try {
      console.log(`🔍 Obteniendo usuarios con rol: ${roleName} (simplificado)...`);
      
      // 🚫 SIN ROLES POR AHORA - hasta que se arregle el backend
      console.warn('⚠️ Función getUsersByRole temporalmente deshabilitada - backend no soporta roles');
      return [];
      
    } catch (error) {
      console.error(`❌ Error obteniendo usuarios por rol ${roleName}:`, error);
      return [];
    }
  }

  /**
   * 🏢 Obtiene usuarios por área - VERSIÓN SIMPLIFICADA
   */
  async getUsersByArea(areaName: string): Promise<UserProfile[]> {
    try {
      console.log(`🏢 Obteniendo usuarios del área: ${areaName} (simplificado)...`);
      
      // 🚫 SIN ÁREAS POR AHORA - hasta que se arregle el backend
      console.warn('⚠️ Función getUsersByArea temporalmente deshabilitada - backend no soporta áreas');
      return [];
      
    } catch (error) {
      console.error(`❌ Error obteniendo usuarios por área ${areaName}:`, error);
      return [];
    }
  }

  /**
   * 📊 Obtiene estadísticas de usuarios - VERSIÓN SIMPLIFICADA
   */
  async getUserStats(): Promise<UserStats> {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios (simplificado)...');
      
      const users = await this.getUsers({ limit: 1000 });
      
      // 🔧 ESTADÍSTICAS BÁSICAS SIN ROLES/ÁREAS
      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        online: 0, // No tenemos info de online users por ahora
        byRole: {}, // Vacío hasta que se arregle el backend
        byArea: {} // Vacío hasta que se arregle el backend
      };
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      
      // 🔧 FALLBACK: Estadísticas vacías
      return {
        total: 0,
        active: 0,
        online: 0,
        byRole: {},
        byArea: {}
      };
    }
  }
}

export default new UserListService();