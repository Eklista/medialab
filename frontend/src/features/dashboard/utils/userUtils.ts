// src/features/dashboard/utils/userUtils.ts - EXTENDED VERSION
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppData } from '../../../context/AppDataContext';

// 🚀 INTERFAZ EXTENDIDA PARA DASHBOARD
export interface DashboardUser {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage?: string;
  bannerImage?: string; // 🆕 AGREGADO
  role?: string;
  isActive?: boolean;
  initials: string;
  
  // 🆕 CAMPOS ADICIONALES PARA SETTINGS
  phone?: string;
  birth_date?: string | null;
  username?: string;
  joinDate?: string;
  lastLogin?: string;
  
  // 🆕 CAMPOS DE COMPATIBILIDAD
  profile_image?: string;
  banner_image?: string;
}

/**
 * Hook personalizado para obtener datos completos del usuario actual
 * Unifica datos de AuthContext y AppDataContext de forma inteligente
 */
export const useCurrentUser = (): {
  user: DashboardUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
} => {
  const { state: authState } = useAuth();
  const { user: appDataUser, isLoading: appDataLoading, error: appDataError } = useAppData();
  
  // Combinar datos de ambos contextos, priorizando AppDataContext
  const rawUser = appDataUser || authState.user;
  
  // 🚀 TRANSFORMACIÓN MEJORADA con todos los campos
  const user: DashboardUser | null = rawUser ? {
    id: typeof rawUser.id === 'string' ? parseInt(rawUser.id) || rawUser.id : rawUser.id,
    email: rawUser.email || '',
    firstName: rawUser.firstName || (rawUser as any).first_name || '',
    lastName: rawUser.lastName || (rawUser as any).last_name || '',
    fullName: getFullName(rawUser),
    profileImage: rawUser.profileImage || (rawUser as any).profile_image,
    bannerImage: (rawUser as any).bannerImage || (rawUser as any).banner_image, // 🆕
    role: (rawUser as any).role || 'Usuario',
    isActive: (rawUser as any).isActive !== undefined ? (rawUser as any).isActive : (rawUser as any).is_active,
    initials: getInitials(rawUser),
    
    // 🆕 CAMPOS ADICIONALES
    phone: (rawUser as any).phone,
    birth_date: (rawUser as any).birth_date || (rawUser as any).birthDate,
    username: (rawUser as any).username || rawUser.email?.split('@')[0],
    joinDate: (rawUser as any).joinDate || (rawUser as any).join_date,
    lastLogin: (rawUser as any).lastLogin || (rawUser as any).last_login,
    
    // Compatibilidad
    profile_image: rawUser.profileImage || (rawUser as any).profile_image,
    banner_image: (rawUser as any).bannerImage || (rawUser as any).banner_image
  } : null;

  return {
    user,
    isLoading: authState.isLoading || appDataLoading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error || appDataError
  };
};

/**
 * Obtiene el nombre completo del usuario de forma inteligente
 */
export const getFullName = (user: any): string => {
  if (!user) return 'Usuario';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else if (user.name) {
    return user.name;
  } else if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Usuario';
};

/**
 * Obtiene las iniciales del usuario
 */
export const getInitials = (user: any): string => {
  if (!user) return 'U';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase();
  } else if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Obtiene el saludo personalizado según la hora
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = (user: DashboardUser | null, roleName: string): boolean => {
  if (!user || !user.role) return false;
  return user.role.toLowerCase().includes(roleName.toLowerCase());
};

/**
 * Verifica si el usuario es administrador
 */
export const isAdmin = (user: DashboardUser | null): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Convierte cualquier objeto usuario a formato DashboardUser
 */
export const normalizeToDashboardUser = (rawUser: any): DashboardUser | null => {
  if (!rawUser) return null;
  
  return {
    id: typeof rawUser.id === 'string' ? parseInt(rawUser.id) || rawUser.id : rawUser.id,
    email: rawUser.email || '',
    firstName: rawUser.firstName || rawUser.first_name || '',
    lastName: rawUser.lastName || rawUser.last_name || '',
    fullName: getFullName(rawUser),
    profileImage: rawUser.profileImage || rawUser.profile_image,
    bannerImage: rawUser.bannerImage || rawUser.banner_image, // 🆕
    role: rawUser.role || rawUser.roles?.[0] || 'Usuario',
    isActive: rawUser.isActive !== undefined ? rawUser.isActive : rawUser.is_active,
    initials: getInitials(rawUser),
    
    // 🆕 CAMPOS ADICIONALES
    phone: rawUser.phone,
    birth_date: rawUser.birth_date || rawUser.birthDate,
    username: rawUser.username || rawUser.email?.split('@')[0],
    joinDate: rawUser.joinDate || rawUser.join_date,
    lastLogin: rawUser.lastLogin || rawUser.last_login,
    
    // Compatibilidad
    profile_image: rawUser.profileImage || rawUser.profile_image,
    banner_image: rawUser.bannerImage || rawUser.banner_image
  };
};

/**
 * Hook para obtener información de usuario por ID (con cache)
 * Por ahora devuelve null, se puede expandir más adelante
 */
export const useUserById = (_userId: number | string) => {
  // Este hook se puede expandir más adelante para incluir cache local
  // Por ahora, devolver null y dejar que UserProfilePhoto maneje la carga
  return {
    user: null,
    isLoading: false,
    error: null
  };
};

/**
 * Convierte DashboardUser a formato compatible con UserProfilePhoto
 */
export const toUserProfilePhotoProps = (user: DashboardUser | null) => {
  if (!user) return undefined;
  
  return {
    id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profileImage: user.profileImage
  };
};

/**
 * Utilidades para manejo de imágenes de perfil
 */
export const getProfileImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath || imagePath.trim() === '') return '';
  
  // Si la ruta ya es completa, usarla directamente
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construir URL según el entorno
  let baseUrl: string;
  
  if (import.meta.env.MODE === 'production') {
    baseUrl = window.location.origin;
  } else {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    baseUrl = apiUrl.replace('/api/v1', '');
  }
  
  // Asegurar que la ruta comience con '/'
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

/**
 * 🆕 NUEVA: Convierte ID de usuario a número de forma segura
 */
export const normalizeUserId = (id: string | number | undefined): number | undefined => {
  if (id === undefined || id === null) return undefined;
  
  if (typeof id === 'number') return id;
  
  const parsed = parseInt(id.toString(), 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * 🆕 NUEVA: Obtiene la URL completa de una imagen
 */
export const getFullImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath || imagePath.trim() === '') return '';
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const baseUrl = import.meta.env.MODE === 'production' 
    ? window.location.origin 
    : 'http://localhost:8000';
  
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${path}`;
};