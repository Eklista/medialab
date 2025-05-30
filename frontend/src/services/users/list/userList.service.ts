// ===================================================================
// frontend/src/services/users/list/userList.service.ts - 🔧 CORREGIDO
// ===================================================================
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
   * 🎨 Obtiene usuarios con formato específico
   */
  async getUsersFormatted(options: UserListOptions = {}): Promise<UserFormatted[]> {
    try {
      console.log(`🎨 Obteniendo usuarios formateados (${options.formatType})...`);
      
      const params = new URLSearchParams({
        skip: (options.skip || 0).toString(),
        limit: (options.limit || 100).toString(),
        format_type: options.formatType || 'with_roles'
      });
      
      const response = await apiClient.get<UserFormatted[]>(`/users/formatted?${params}`);
      return response.data.map(user => userTransforms.normalizeFormattedUser(user));
    } catch (error) {
      console.warn('⚠️ Endpoint formateado no disponible, usando fallback...');
      
      // Fallback a la lista básica
      const basicUsers = await this.getUsers(options);
      return basicUsers.map(user => userTransforms.enhanceUserData(user));
    }
  }

  /**
   * 👥 Obtiene usuarios activos para menú
   */
  async getActiveUsers(limit: number = 50): Promise<UserFormatted[]> {
    try {
      console.log('👥 Obteniendo usuarios activos...');
      
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await apiClient.get<UserFormatted[]>(`/users/active-menu?${params}`);
      
      return response.data.map(user => userTransforms.normalizeFormattedUser(user));
    } catch (error) {
      console.warn('⚠️ Endpoint de usuarios activos no disponible, usando fallback...');
      
      // Fallback: filtrar usuarios activos de la lista general
      const allUsers = await this.getUsersFormatted({ 
        formatType: 'active_menu',
        limit: limit * 2 // Obtener más para filtrar
      });
      
      return allUsers
        .filter(user => user.isActive)
        .slice(0, limit);
    }
  }

  /**
   * 🔍 Obtiene usuarios por rol
   */
  async getUsersByRole(roleName: string): Promise<UserProfile[]> {
    try {
      console.log(`🔍 Obteniendo usuarios con rol: ${roleName}...`);
      
      const allUsers = await this.getUsersFormatted({ formatType: 'with_roles' });
      return allUsers.filter(user => 
        user.roles?.includes(roleName) || user.roleDisplay?.includes(roleName)
      );
    } catch (error) {
      console.error(`❌ Error obteniendo usuarios por rol ${roleName}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🏢 Obtiene usuarios por área
   */
  async getUsersByArea(areaName: string): Promise<UserProfile[]> {
    try {
      console.log(`🏢 Obteniendo usuarios del área: ${areaName}...`);
      
      const allUsers = await this.getUsersFormatted({ formatType: 'with_roles' });
      return allUsers.filter(user => 
        user.areas?.some(area => area.name === areaName) ||
        user.areaDisplay?.includes(areaName)
      );
    } catch (error) {
      console.error(`❌ Error obteniendo usuarios por área ${areaName}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 📊 Obtiene estadísticas de usuarios
   */
  async getUserStats(): Promise<UserStats> {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios...');
      
      const users = await this.getUsersFormatted({ formatType: 'complete', limit: 1000 });
      
      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        online: users.filter(u => u.status === 'online').length,
        byRole: {},
        byArea: {}
      };
      
      // Agrupar por roles
      users.forEach(user => {
        user.roles?.forEach(role => {
          stats.byRole[role] = (stats.byRole[role] || 0) + 1;
        });
        
        user.areas?.forEach(area => {
          stats.byArea[area.name] = (stats.byArea[area.name] || 0) + 1;
        });
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new UserListService();
