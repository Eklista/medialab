// frontend/src/utils/userTypeHelpers.ts - 🎯 SIMPLIFICADO SIN REDUNDANCIAS
import { User as AuthServiceUser } from '../services/auth/auth.service';
import { 
  UserProfile, 
  UserFormatted, 
  UserWithRoles 
} from '../services/users/types/user.types';

// ===== TIPOS UNIFICADOS =====
export type AnyUser = AuthServiceUser | UserProfile | UserFormatted | UserWithRoles | null;

// ===== TYPE GUARDS (ÚNICOS Y NECESARIOS) =====

/**
 * 🔍 Verifica si es un usuario de AuthService (roles como objetos)
 */
export const isAuthServiceUser = (user: AnyUser): user is AuthServiceUser => {
  if (!user) return false;
  return 'roles' in user && 
         Array.isArray(user.roles) && 
         user.roles.length > 0 && 
         typeof user.roles[0] === 'object' && 
         'name' in user.roles[0];
};

/**
 * 🔍 Verifica si es un usuario con roles como strings
 */
export const isUserWithStringRoles = (user: AnyUser): user is UserWithRoles | UserFormatted => {
  if (!user) return false;
  return 'roles' in user && 
         Array.isArray(user.roles) && 
         (user.roles.length === 0 || typeof user.roles[0] === 'string');
};

// ===== FUNCIONES CORE (SIN REDUNDANCIAS) =====

/**
 * 👥 Verifica si un usuario tiene un rol específico
 * ⭐ FUNCIÓN PRINCIPAL - Maneja la diferencia entre AuthService y UserService
 */
export const userHasRole = (user: AnyUser, roleName: string): boolean => {
  if (!user || !('roles' in user) || !user.roles) return false;

  // AuthServiceUser: roles = [{id: 1, name: 'ADMIN'}]
  if (isAuthServiceUser(user)) {
    return user.roles.some(role => role.name === roleName);
  }

  // UserService: roles = ['ADMIN']
  if (isUserWithStringRoles(user)) {
    return user.roles.includes(roleName);
  }

  return false;
};

/**
 * 📋 Obtiene nombres de roles unificados
 * ⭐ FUNCIÓN PRINCIPAL - Normaliza roles de diferentes fuentes
 */
export const getUserRoleNames = (user: AnyUser): string[] => {
  if (!user || !('roles' in user) || !user.roles) return [];

  // AuthServiceUser
  if (isAuthServiceUser(user)) {
    return user.roles.map(role => role.name);
  }

  // UserService - puede ser string[] o array mixto
  if (isUserWithStringRoles(user)) {
    return user.roles.map(role => 
      typeof role === 'string' ? role : (role as any)?.name || ''
    ).filter(Boolean);
  }

  return [];
};

/**
 * 👑 Verifica si un usuario es admin
 * ⭐ FUNCIÓN DE CONVENIENCIA - Muy usada en toda la app
 */
export const isAdmin = (user: AnyUser): boolean => {
  return userHasRole(user, 'ADMIN') || userHasRole(user, 'admin');
};

/**
 * 🔒 Verifica si un usuario es super admin
 * ⭐ FUNCIÓN DE CONVENIENCIA - Para permisos especiales
 */
export const isSuperAdmin = (user: AnyUser): boolean => {
  return userHasRole(user, 'SUPER_ADMIN') || userHasRole(user, 'super_admin');
};

/**
 * 🔄 Convierte AuthServiceUser a formato compatible con UserService
 * ⭐ FUNCIÓN DE MIGRACIÓN - Para componentes que esperan UserFormatted
 */
export const normalizeAuthUser = (authUser: AuthServiceUser): UserFormatted => {
  const firstName = authUser.firstName || authUser.first_name || '';
  const lastName = authUser.lastName || authUser.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || authUser.email || 'Usuario';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : authUser.email.charAt(0).toUpperCase();

  return {
    id: authUser.id,
    email: authUser.email,
    username: authUser.username,
    firstName,
    lastName,
    fullName,
    initials,
    isActive: authUser.isActive,
    roles: authUser.roles.map(role => role.name), // ⭐ CONVERSIÓN PRINCIPAL
    profileImage: authUser.profileImage,
    bannerImage: authUser.bannerImage,
    phone: authUser.phone,
    birth_date: authUser.birthDate,
    joinDate: authUser.joinDate,
    lastLogin: authUser.lastLogin,
    isOnline: authUser.isOnline,
    status: 'offline' as const // Default seguro
  };
};

/**
 * 🎯 Verifica si necesita conversión de AuthService
 * ⭐ FUNCIÓN DE UTILIDAD - Para saber cuándo convertir
 */
export const needsNormalization = (user: AnyUser): user is AuthServiceUser => {
  return isAuthServiceUser(user);
};

/**
 * 🔀 Auto-normaliza cualquier usuario a UserFormatted si es necesario
 * ⭐ FUNCIÓN INTELIGENTE - Convierte solo si es necesario
 */
export const ensureUserFormatted = (user: AnyUser): UserFormatted | null => {
  if (!user) return null;
  
  // Si ya es UserFormatted, devolverlo tal como está
  if ('fullName' in user && 'initials' in user) {
    return user as UserFormatted;
  }
  
  // Si es AuthServiceUser, convertirlo
  if (isAuthServiceUser(user)) {
    return normalizeAuthUser(user);
  }
  
  // Para otros tipos, no intentar convertir (puede causar problemas)
  console.warn('Cannot normalize user type:', typeof user);
  return null;
};

// ===== FUNCIONES DE CONVENIENCIA ESPECÍFICAS =====

/**
 * 🏷️ Obtiene display de roles para mostrar en UI
 * ⭐ FUNCIÓN DE UI - Para badges y etiquetas
 */
export const getRoleDisplayText = (user: AnyUser): string => {
  const roles = getUserRoleNames(user);
  
  if (roles.length === 0) return 'Sin rol';
  if (roles.length === 1) return roles[0];
  if (roles.length <= 3) return roles.join(', ');
  
  return `${roles.slice(0, 2).join(', ')} +${roles.length - 2} más`;
};

/**
 * 🔍 Verifica múltiples roles (ANY)
 * ⭐ FUNCIÓN DE PERMISOS - Para verificaciones complejas
 */
export const userHasAnyRole = (user: AnyUser, roleNames: string[]): boolean => {
  return roleNames.some(roleName => userHasRole(user, roleName));
};

/**
 * 🔒 Verifica múltiples roles (ALL)
 * ⭐ FUNCIÓN DE PERMISOS - Para verificaciones estrictas
 */
export const userHasAllRoles = (user: AnyUser, roleNames: string[]): boolean => {
  return roleNames.every(roleName => userHasRole(user, roleName));
};

// ===== INFORMACIÓN DEL HELPER =====
export const USER_HELPER_INFO = {
  version: '2.0.0',
  description: 'Helper simplificado sin redundancias - solo funciones esenciales',
  primaryPurpose: 'Compatibilidad entre AuthService y UserService',
  functions: {
    core: [
      'userHasRole - Verifica roles en ambos formatos',
      'getUserRoleNames - Normaliza roles a string[]',
      'normalizeAuthUser - Convierte AuthUser a UserFormatted'
    ],
    convenience: [
      'isAdmin, isSuperAdmin - Verificaciones comunes',
      'getRoleDisplayText - Para UI',
      'userHasAnyRole, userHasAllRoles - Permisos complejos'
    ],
    utility: [
      'ensureUserFormatted - Auto-conversión inteligente',
      'needsNormalization - Detecta cuándo convertir'
    ]
  },
  redundanciesRemoved: [
    'getFullName - Ya en UserFormatted.fullName',
    'getUserInitials - Ya en UserFormatted.initials', 
    'getUserAvatarUrl - Manejado por userImageService',
    'isUserOnline - Ya en UserWithStatus',
    'getUserStatus - Ya en UserWithStatus'
  ],
  lastUpdated: '2025-05-29'
} as const;