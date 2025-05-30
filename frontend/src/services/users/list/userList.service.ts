// frontend/src/services/users/list/userList.service.ts - 🔧 CORREGIDO
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
   * 🎨 Obtiene usuarios con formato específico - VERSIÓN CORREGIDA
   */
  async getUsersFormatted(options: UserListOptions = {}): Promise<UserFormatted[]> {
    try {
      console.log('🎨 Obteniendo usuarios formateados...');
      
      // 🎯 PRIMERO: Intentar endpoint optimizado
      try {
        const params = new URLSearchParams();
        if (options.skip) params.append('skip', options.skip.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.formatType) params.append('format_type', options.formatType);
        
        const response = await apiClient.get<UserFormatted[]>(`/users/formatted?${params}`);
        
        // 🔧 CORREGIR STATUS DE USUARIOS
        return response.data.map(user => ({
          ...user,
          fullName: user.fullName || this.createFullName(user),
          initials: user.initials || this.createInitials(user),
          // 🔧 FIX: Lógica de status corregida
          status: this.determineUserStatus(user),
          roles: user.roles || [],
          areas: user.areas || [],
          roleDisplay: user.roleDisplay || 'Sin rol',
          areaDisplay: user.areaDisplay || 'Sin área'
        }));
        
      } catch (formattedError) {
        console.warn('⚠️ Endpoint /users/formatted falló, usando fallback...');
        
        // 🔄 FALLBACK: Usar endpoint básico y transformar
        const basicUsers = await this.getUsers(options);
        return basicUsers.map(user => this.createStableFormattedUser(user));
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios formateados:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔧 NUEVA: Determina el status correcto del usuario
   */
  private determineUserStatus(user: any): 'online' | 'away' | 'offline' | 'inactive' {
    // Si no está activo, es inactive
    if (!user.isActive && !user.is_active) {
      return 'inactive';
    }
    
    // Si está online, es online
    if (user.isOnline || user.is_online) {
      return 'online';
    }
    
    // Si está activo pero no online, verificar last_login
    if (user.lastLogin || user.last_login) {
      const lastLoginDate = new Date(user.lastLogin || user.last_login);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60);
      
      // Si se conectó hace menos de 5 minutos, away
      if (diffMinutes < 5) {
        return 'away';
      }
    }
    
    // Por defecto, offline (pero activo)
    return 'offline';
  }

  /**
   * 🔧 NUEVA: Crea nombre completo de forma robusta
   */
  private createFullName(user: any): string {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return firstName || lastName || user.email?.split('@')[0] || 'Usuario';
  }

  /**
   * 🔧 NUEVA: Crea iniciales de forma robusta
   */
  private createInitials(user: any): string {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    return user.email?.charAt(0)?.toUpperCase() || 'U';
  }

  /**
   * 🔧 CORREGIDA: Crea UserFormatted de forma estable
   */
  private createStableFormattedUser(user: UserProfile): UserFormatted {
    const fullName = this.createFullName(user);
    const initials = this.createInitials(user);
    const status = this.determineUserStatus(user);

    return {
      // Copiar todas las propiedades del usuario base
      ...user,
      
      // Añadir propiedades de UserFormatted
      fullName,
      initials,
      roles: [], // ⭐ SOLO STRINGS - Temporal hasta que el backend tenga roles
      areas: [],
      permissions: [],
      roleDisplay: 'Sin rol',
      areaDisplay: 'Sin área',
      status, // 🔧 FIX: Status corregido
      
      // Valores por defecto seguros
      isOnline: status === 'online',
      stats: undefined,
      display: undefined
    };
  }

  /**
   * 👥 Obtiene usuarios activos para menú - VERSIÓN CORREGIDA
   */
  async getActiveUsers(limit: number = 50): Promise<UserFormatted[]> {
    try {
      console.log('👥 Obteniendo usuarios activos...');
      
      // 🎯 INTENTAR endpoint específico primero
      try {
        const response = await apiClient.get<UserFormatted[]>(`/users/active-menu?limit=${limit}`);
        return response.data.map(user => ({
          ...user,
          fullName: user.fullName || this.createFullName(user),
          initials: user.initials || this.createInitials(user),
          status: this.determineUserStatus(user)
        }));
        
      } catch (activeError) {
        console.warn('⚠️ Endpoint /users/active-menu falló, usando filtrado...');
        
        // 🔄 FALLBACK: Filtrar desde la lista general
        const allUsers = await this.getUsersFormatted({ 
          limit: Math.max(limit * 2, 100) // Obtener más para filtrar
        });
        
        return allUsers
          .filter(user => user.isActive) // Solo usuarios activos
          .slice(0, limit); // Limitar resultado
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios activos:', error);
      return []; // Return empty array en lugar de lanzar error
    }
  }

  /**
   * 📊 Obtiene estadísticas de usuarios - VERSIÓN CORREGIDA
   */
  async getUserStats(): Promise<UserStats> {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios...');
      
      const users = await this.getUsers({ limit: 1000 });
      
      // 🔧 ESTADÍSTICAS CORRECTAS
      const activeUsers = users.filter(u => u.isActive);
      const onlineUsers = users.filter(u => {
        const status = this.determineUserStatus(u);
        return status === 'online' || status === 'away';
      });
      
      const stats: UserStats = {
        total: users.length,
        active: activeUsers.length,
        online: onlineUsers.length,
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

  /**
   * 🔍 Obtiene usuarios por rol - FUNCIÓN PLACEHOLDER
   */
  async getUsersByRole(roleName: string): Promise<UserProfile[]> {
    console.warn(`⚠️ getUsersByRole('${roleName}') no implementado - backend no soporta roles aún`);
    return [];
  }

  /**
   * 🏢 Obtiene usuarios por área - FUNCIÓN PLACEHOLDER
   */
  async getUsersByArea(areaName: string): Promise<UserProfile[]> {
    console.warn(`⚠️ getUsersByArea('${areaName}') no implementado - backend no soporta áreas aún`);
    return [];
  }
}

export default new UserListService();