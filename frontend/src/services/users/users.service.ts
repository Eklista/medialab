// ===================================================================
// frontend/src/services/users/users.service.ts - 🎯 SERVICIO PRINCIPAL CORREGIDO
// ===================================================================

import { UserCreateRequest } from './types/requests.types';
import userProfileService from './profile/userProfile.service';
import userEditService from './edit/userEdit.service';
import userListService from './list/userList.service';
import userStatusService from './status/userStatus.service';
import userImageService from './images/userImage.service';
import userBatchService from './batch/userBatch.service';
import userCacheService from './cache/userCache.service';

/**
 * 🎯 SERVICIO PRINCIPAL DE USUARIOS
 * Orquesta los servicios modulares y mantiene compatibilidad
 */
class UserService {
  // ===== DELEGACIÓN A SERVICIOS MODULARES =====
  
  // 👤 Perfil
  get profile() { return userProfileService; }
  
  // ✏️ Edición  
  get edit() { return userEditService; }
  
  // 📋 Listas
  get list() { return userListService; }
  
  // 🟢 Estado/Presencia
  get status() { return userStatusService; }
  
  // 🖼️ Imágenes
  get images() { return userImageService; }

  // 🚀 Operaciones en lote
  get batch() { return userBatchService; }
  
  // 💾 Cache
  get cache() { return userCacheService; }

  // ===== MÉTODOS DE COMPATIBILIDAD (mantienen API existente) =====

  /**
   * @deprecated Usar userService.list.getUsers()
   */
  async getUsers() {
    console.warn('⚠️ getUsers() está deprecated. Usa userService.list.getUsers()');
    return this.list.getUsers();
  }

  /**
   * @deprecated Usar userService.profile.getProfileById()
   */
  async getUserById(userId: number) {
    console.warn('⚠️ getUserById() está deprecated. Usa userService.profile.getProfileById()');
    return this.profile.getProfileById(userId);
  }

  /**
   * @deprecated Usar userService.profile.getCurrentProfile()
   */
  async getCurrentUser() {
    console.warn('⚠️ getCurrentUser() está deprecated. Usa userService.profile.getCurrentProfile()');
    return this.profile.getCurrentProfile();
  }

  /**
   * @deprecated Usar userService.edit.updateUser()
   */
  async updateUser(userId: number, data: any) {
    console.warn('⚠️ updateUser() está deprecated. Usa userService.edit.updateUser()');
    return this.edit.updateUser(userId, data);
  }

  /**
   * @deprecated Usar userService.edit.updateCurrentProfile()
   */
  async updateCurrentUser(data: any) {
    console.warn('⚠️ updateCurrentUser() está deprecated. Usa userService.edit.updateCurrentProfile()');
    return this.edit.updateCurrentProfile(data);
  }

  /**
   * @deprecated Usar userService.edit.deleteUser()
   */
  async deleteUser(userId: number) {
    console.warn('⚠️ deleteUser() está deprecated. Usa userService.edit.deleteUser()');
    return this.edit.deleteUser(userId);
  }

  /**
   * @deprecated Usar userService.edit.assignRole()
   */
  async assignRole(userId: number, roleId: string, areaId: string) {
    console.warn('⚠️ assignRole() está deprecated. Usa userService.edit.assignRole()');
    return this.edit.assignRole(userId, roleId, areaId);
  }

  // ===== NUEVOS MÉTODOS OPTIMIZADOS =====

  /**
   * 🚀 Inicialización rápida con datos esenciales
   */
  async quickStart(_userId?: number) {
    console.log('🚀 UserService Quick Start...');
    
    const data = await this.batch.loadEssentialData();
    
    // Auto-configurar cache y presencia
    this.cache.warmup(data);
    this.status.startPresenceMonitoring();
    
    return data;
  }

  /**
   * 🎯 Obtener perfil con cache inteligente
   */
  async getCurrentUserEnhanced(enhanced = true) {
    const cacheKey = `current_user_${enhanced ? 'enhanced' : 'basic'}`;
    
    return this.cache.getOrLoad(cacheKey, async () => {
      return enhanced 
        ? this.profile.getCurrentProfileEnhanced()
        : this.profile.getCurrentProfile();
    });
  }

  /**
   * 📋 Obtiene usuarios con formato específico
   */
  async getUsersFormatted(options = {}) {
    return this.list.getUsersFormatted(options);
  }

  /**
   * 👥 Obtiene usuarios activos para menú
   */
  async getActiveUsersForMenu(limit = 50) {
    return this.list.getActiveUsers(limit);
  }

  /**
   * 🆕 Crea un nuevo usuario
   */
  async createUser(userData: UserCreateRequest) {
    return this.edit.createUser(userData);
  }

  /**
   * 📤 Sube imagen de usuario
   */
  async uploadImage(file: File, type: 'profile' | 'banner') {
    return this.images.uploadImage(file, type);
  }

  // ===== MÉTODOS DE CONVENIENCIA =====

  /**
   * 🔍 Búsqueda rápida de usuarios
   */
  async searchUsers(query: string, filters?: any) {
    return this.profile.searchUsers(query, filters);
  }

  /**
   * 📊 Obtiene estadísticas completas
   */
  async getAllStats() {
    const [userStats, profileStats] = await Promise.all([
      this.list.getUserStats(),
      this.profile.getProfileStats().catch(() => null)
    ]);
    
    return {
      users: userStats,
      profile: profileStats
    };
  }

  /**
   * ⚡ Configuración rápida de monitoreo de presencia
   */
  startPresenceTracking(intervalMs = 30000) {
    const stopHeartbeat = this.status.startPresenceMonitoring(intervalMs);
    const stopVisibility = this.status.setupVisibilityTracking();
    
    // Retornar función para detener todo el tracking
    return () => {
      stopHeartbeat();
      stopVisibility();
    };
  }

  /**
   * 🎨 Obtiene URL de avatar con fallback
   */
  getAvatarUrl(user: any, size = 80) {
    if (user.profileImage || user.profile_image) {
      return this.images.getImageUrl(user.profileImage || user.profile_image);
    }
    
    const initials = user.initials || this.getInitials(user);
    return this.images.generateAvatarUrl(initials, size);
  }

  /**
   * 🔧 Utilidades de desarrollo
   */
  get dev() {
    return {
      clearCache: () => this.cache.clear(),
      debugInfo: () => ({
        cache: this.cache.getStats(),
        modules: {
          profile: !!userProfileService,
          edit: !!userEditService,
          list: !!userListService,
          status: !!userStatusService,
          images: !!userImageService,
          batch: !!userBatchService,
          cache: !!userCacheService
        }
      }),
      healthCheck: () => this.batch.healthCheck()
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  private getInitials(user: any): string {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }
}

export default new UserService();