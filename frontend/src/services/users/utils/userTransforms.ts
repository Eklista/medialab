// ===================================================================
// frontend/src/services/users/utils/userTransforms.ts - 🔧 CORREGIDO
// ===================================================================
import { UserProfile, UserFormatted } from '../types/user.types';
import { UserUpdateRequest } from '../types/requests.types';

class UserTransforms {
  /**
   * 🔄 Normaliza usuario desde API
   */
  normalizeUser(apiUser: any): UserProfile {
    return {
      id: apiUser.id,
      email: apiUser.email || '',
      username: apiUser.username || '',
      firstName: apiUser.firstName || apiUser.first_name || '',
      lastName: apiUser.lastName || apiUser.last_name || '',
      profileImage: apiUser.profileImage || apiUser.profile_image || null,
      bannerImage: apiUser.bannerImage || apiUser.banner_image || null,
      isActive: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active || false),
      lastLogin: apiUser.lastLogin || apiUser.last_login || null,
      phone: apiUser.phone || '',
      birth_date: apiUser.birth_date || apiUser.birthDate || null,
      joinDate: apiUser.joinDate || apiUser.join_date
    };
  }

  /**
   * 🎨 Normaliza usuario formateado desde API
   */
  normalizeFormattedUser(apiUser: any): UserFormatted {
    const baseUser = this.normalizeUser(apiUser);
    
    return {
      ...baseUser,
      fullName: apiUser.full_name || this.getFullName(baseUser),
      initials: apiUser.initials || this.getInitials(baseUser),
      roles: apiUser.roles || [],
      areas: apiUser.areas || [],
      permissions: apiUser.permissions || [],
      roleDisplay: apiUser.role_display || apiUser.roleDisplay,
      areaDisplay: apiUser.area_display || apiUser.areaDisplay,
      status: apiUser.status as 'online' | 'away' | 'offline' | 'inactive' | undefined,
      statusIcon: apiUser.status_icon,
      statusColor: apiUser.status_color,
      isOnline: apiUser.isOnline || apiUser.is_online,
      stats: apiUser.stats,
      display: apiUser.display
    };
  }

  /**
   * ⬆️ Mejora datos básicos de usuario
   */
  enhanceUserData(user: UserProfile): UserFormatted {
    return {
      ...user,
      fullName: this.getFullName(user),
      initials: this.getInitials(user),
      roles: [],
      areas: [],
      permissions: [],
      status: user.isActive ? 'offline' : 'inactive' // 🔧 Cast correcto
    };
  }

  /**
   * 📤 Convierte a formato de API para actualización
   */
  toApiUpdateFormat(data: UserUpdateRequest): any {
    const apiData: any = {};
    
    if (data.email !== undefined) apiData.email = data.email;
    if (data.username !== undefined) apiData.username = data.username;
    if (data.firstName !== undefined) apiData.first_name = data.firstName;
    if (data.lastName !== undefined) apiData.last_name = data.lastName;
    if (data.phone !== undefined) apiData.phone = data.phone;
    if (data.birthDate !== undefined) apiData.birth_date = data.birthDate;
    if (data.profileImage !== undefined) apiData.profile_image = data.profileImage;
    if (data.bannerImage !== undefined) apiData.banner_image = data.bannerImage;
    if (data.isActive !== undefined) apiData.is_active = data.isActive;
    
    return apiData;
  }

  /**
   * 📝 Obtiene nombre completo
   */
  private getFullName(user: UserProfile): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.email.split('@')[0] || 'Usuario';
  }

  /**
   * 🎯 Obtiene iniciales
   */
  private getInitials(user: UserProfile): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  }
}

export const userTransforms = new UserTransforms();
