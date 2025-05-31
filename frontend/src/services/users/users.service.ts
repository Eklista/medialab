// frontend/src/services/users/users.service.ts - 🔄 INTEGRACIÓN CON ROLES Y ÁREAS

import { UserCreateRequest } from './types/requests.types';
import userProfileService from './profile/userProfile.service';
import userEditService from './edit/userEdit.service';
import userListService from './list/userList.service';
import userStatusService from './status/userStatus.service';
import userImageService from './images/userImage.service';
import userBatchService from './batch/userBatch.service';
import userCacheService from './cache/userCache.service';

// 🆕 IMPORTAR SERVICIOS DE ROLES Y ÁREAS
import rolesService from '../security/roles.service';
import areasService from '../organization/areas.service';

/**
 * 🎯 SERVICIO PRINCIPAL DE USUARIOS CON INTEGRACIÓN DE ROLES Y ÁREAS
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

  // 🆕 DELEGACIÓN A SERVICIOS DE ROLES Y ÁREAS
  get roles() { return rolesService; }
  get areas() { return areasService; }

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

  // ===== 🆕 MÉTODOS INTEGRADOS CON ROLES Y ÁREAS =====

  /**
   * 📋 Obtiene roles para formularios
   */
  async getRoles() {
    return this.roles.getRoles();
  }

  /**
   * 🔍 Obtiene rol con permisos
   */
  async getRoleWithPermissions(roleId: number) {
    return this.roles.getRoleById(roleId, true);
  }

  /**
   * ➕ Crea nuevo rol
   */
  async createRole(roleData: any) {
    return this.roles.createRole(roleData);
  }

  /**
   * ✏️ Actualiza rol
   */
  async updateRole(roleId: number, roleData: any) {
    return this.roles.updateRole(roleId, roleData);
  }

  /**
   * 🗑️ Elimina rol
   */
  async deleteRole(roleId: number) {
    return this.roles.deleteRole(roleId);
  }

  /**
   * 🏢 Obtiene áreas para formularios
   */
  async getAreas() {
    return this.areas.getAreas();
  }

  /**
   * 🔍 Obtiene área por ID
   */
  async getAreaById(areaId: number) {
    return this.areas.getAreaById(areaId);
  }

  /**
   * ➕ Crea nueva área
   */
  async createArea(areaData: any) {
    return this.areas.createArea(areaData);
  }

  /**
   * ✏️ Actualiza área
   */
  async updateArea(areaId: number, areaData: any) {
    return this.areas.updateArea(areaId, areaData);
  }

  /**
   * 🗑️ Elimina área
   */
  async deleteArea(areaId: number) {
    return this.areas.deleteArea(areaId);
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

  // ===== 🆕 MÉTODOS COMBINADOS PARA FORMULARIOS =====

  /**
   * 🎯 Carga datos completos para gestión de usuarios
   * Incluye usuarios, roles y áreas en una sola operación
   */
  async loadManagementData() {
    console.log('🎯 Cargando datos completos para gestión...');
    
    try {
      const [users, roles, areas, userStats] = await Promise.allSettled([
        this.list.getUsersFormatted({ limit: 100, formatType: 'complete' }),
        this.roles.getRoles(),
        this.areas.getAreas(),
        this.list.getUserStats()
      ]);

      return {
        users: users.status === 'fulfilled' ? users.value : [],
        roles: roles.status === 'fulfilled' ? roles.value : [],
        areas: areas.status === 'fulfilled' ? areas.value : [],
        stats: userStats.status === 'fulfilled' ? userStats.value : null,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error cargando datos de gestión:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtiene estadísticas combinadas
   */
  async getCombinedStats() {
    try {
      const [userStats, roleStats, areaStats] = await Promise.allSettled([
        this.list.getUserStats(),
        this.roles.getRoleStats(),
        this.areas.getAreaStats()
      ]);

      return {
        users: userStats.status === 'fulfilled' ? userStats.value : null,
        roles: roleStats.status === 'fulfilled' ? roleStats.value : null,
        areas: areaStats.status === 'fulfilled' ? areaStats.value : null,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas combinadas:', error);
      return { users: null, roles: null, areas: null, timestamp: Date.now() };
    }
  }

  /**
   * 🔍 Búsqueda avanzada que incluye roles y áreas
   */
  async advancedSearch(options: {
    query?: string;
    role?: string;
    area?: string;
    isActive?: boolean;
    limit?: number;
  }) {
    return this.batch.advancedSearch(options);
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
    return this.getCombinedStats();
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
   * 🔄 Refresca todos los datos relacionados
   */
  async refreshAll() {
    console.log('🔄 Refrescando todos los datos del sistema...');
    
    await Promise.all([
      this.roles.refresh(),
      this.areas.refresh()
    ]);
    
    this.cache.clear();
    
    console.log('✅ Todos los datos refrescados');
  }

  /**
   * 🔧 Utilidades de desarrollo mejoradas
   */
  get dev() {
    return {
      clearCache: () => {
        this.cache.clear();
        this.roles.clearCache();
        this.areas.clearCache();
      },
      debugInfo: () => ({
        cache: this.cache.getStats(),
        roles: this.roles.getCacheStats(),
        areas: this.areas.getCacheStats(),
        modules: {
          profile: !!userProfileService,
          edit: !!userEditService,
          list: !!userListService,
          status: !!userStatusService,
          images: !!userImageService,
          batch: !!userBatchService,
          cache: !!userCacheService,
          roles: !!rolesService,
          areas: !!areasService
        }
      }),
      healthCheck: async () => {
        const baseHealth = await this.batch.healthCheck();
        
        // Agregar health check de roles y áreas
        const rolesHealth = await this.roles.getRoles({ limit: 1 })
          .then(() => ({ status: 'OK', service: 'roles' }))
          .catch(error => ({ status: 'ERROR', service: 'roles', error: error.message }));
          
        const areasHealth = await this.areas.getAreas({ limit: 1 })
          .then(() => ({ status: 'OK', service: 'areas' }))
          .catch(error => ({ status: 'ERROR', service: 'areas', error: error.message }));

        return {
          ...baseHealth,
          checks: {
            ...baseHealth.checks,
            roles: rolesHealth.status === 'OK',
            areas: areasHealth.status === 'OK'
          },
          details: {
            ...baseHealth.details,
            roles: rolesHealth,
            areas: areasHealth
          }
        };
      }
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