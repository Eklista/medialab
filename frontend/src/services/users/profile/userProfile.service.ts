
// ===================================================================
// frontend/src/services/users/profile/userProfile.service.ts - 🔧 CORREGIDO
// ===================================================================
import apiClient, { handleApiError } from '../../api';
import { UserProfile, UserFormatted } from '../types/user.types';
import { userTransforms } from '../utils/userTransforms';

class UserProfileService {
  /**
   * 👤 Obtiene el perfil del usuario actual
   */
  async getCurrentProfile(): Promise<UserProfile> {
    try {
      console.log('👤 Obteniendo perfil actual...');
      const response = await apiClient.get<UserProfile>('/users/me');
      return userTransforms.normalizeUser(response.data);
    } catch (error) {
      console.error('❌ Error obteniendo perfil actual:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🎯 Obtiene el perfil completo optimizado para frontend
   */
  async getCurrentProfileEnhanced(): Promise<UserFormatted> {
    try {
      console.log('🎯 Obteniendo perfil enhanced...');
      const response = await apiClient.get<UserFormatted>('/users/me/enhanced');
      return userTransforms.normalizeFormattedUser(response.data);
    } catch (error) {
      console.warn('⚠️ Endpoint enhanced no disponible, usando fallback...');
      
      // Fallback al endpoint regular
      const basicProfile = await this.getCurrentProfile();
      return userTransforms.enhanceUserData(basicProfile);
    }
  }

  /**
   * 👤 Obtiene perfil de usuario por ID
   */
  async getProfileById(userId: number): Promise<UserProfile> {
    try {
      console.log(`👤 Obteniendo perfil del usuario ${userId}...`);
      const response = await apiClient.get<UserProfile>(`/users/${userId}`);
      return userTransforms.normalizeUser(response.data);
    } catch (error) {
      console.error(`❌ Error obteniendo perfil ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 📊 Obtiene estadísticas del perfil
   */
  async getProfileStats(userId?: number): Promise<any> {
    try {
      const endpoint = userId ? `/users/${userId}/stats` : '/users/me/stats';
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Estadísticas no disponibles');
      return null;
    }
  }

  /**
   * 🔍 Busca usuarios por criterios
   */
  async searchUsers(query: string, filters?: {
    role?: string;
    area?: string;
    isActive?: boolean;
  }): Promise<UserProfile[]> {
    try {
      const params = new URLSearchParams({ q: query });
      
      if (filters?.role) params.append('role', filters.role);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());
      
      const response = await apiClient.get<UserProfile[]>(`/users/search?${params}`);
      return response.data.map(user => userTransforms.normalizeUser(user));
    } catch (error) {
      console.error('❌ Error en búsqueda de usuarios:', error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new UserProfileService();
