// frontend/src/services/users/types/user.types.ts - 🔧 TIPOS FLEXIBLES PARA BACKEND
export interface BaseUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface UserProfile extends BaseUser {
  profileImage?: string | null;
  bannerImage?: string | null;
  phone?: string;
  birth_date?: string | null;
  joinDate?: string;
  lastLogin?: string | null;
  
  // 🔧 CAMPOS ALTERNATIVOS DEL BACKEND (snake_case)
  profile_image?: string | null;
  banner_image?: string | null;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  join_date?: string;
  last_login?: string | null;
}

export interface UserWithStatus extends UserProfile {
  isOnline?: boolean;
  status?: 'online' | 'away' | 'offline' | 'inactive';
  statusIcon?: string;
  statusColor?: string;
  last_seen?: string;
  
  // 🔧 CAMPOS ALTERNATIVOS
  is_online?: boolean;
}

export interface UserWithRoles extends UserWithStatus {
  roles: string[]; // ⭐ SIMPLIFICADO: solo strings para compatibilidad
  areas?: string[]; // ⭐ SIMPLIFICADO: solo strings para compatibilidad
  permissions?: string[];
  roleDisplay?: string;
  areaDisplay?: string;
  
  // 🔧 CAMPOS ALTERNATIVOS
  role_display?: string;
  area_display?: string;
}

export interface UserFormatted extends UserWithRoles {
  fullName: string;
  initials: string;
  stats?: {
    profileCompletion: number;
    accountAgeDays: number;
    totalLogins: number;
  };
  display?: {
    fullName: string;
    initials: string;
    avatarUrl: string;
    roleBadge: string;
    areaBadge: string;
  };
  
  // 🔧 CAMPOS ALTERNATIVOS
  full_name?: string;
}

export interface UserStatusUpdate {
  isOnline?: boolean;
  lastSeen?: string;
  status?: 'online' | 'away' | 'offline' | 'inactive';
  
  // 🔧 CAMPOS ALTERNATIVOS
  is_online?: boolean;
  last_seen?: string;
}

export interface UserListOptions {
  skip?: number;
  limit?: number;
  formatType?: 'basic' | 'detailed' | 'with_roles' | 'complete' | 'active_menu';
  includeInactive?: boolean;
  sortBy?: 'name' | 'email' | 'lastLogin' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchFilters {
  role?: string;
  area?: string;
  isActive?: boolean;
  status?: 'online' | 'away' | 'offline' | 'inactive';
}

export interface UserStats {
  total: number;
  active: number;
  online: number;
  byRole: Record<string, number>;
  byArea: Record<string, number>;
}

export interface UserPresence {
  isOnline: boolean;
  lastSeen: string | null;
  status: 'online' | 'away' | 'offline' | 'inactive';
  
  // 🔧 CAMPOS ALTERNATIVOS
  is_online?: boolean;
  last_seen?: string | null;
}

// 🆕 TIPO UNIÓN PARA USUARIOS QUE PUEDEN VENIR DEL BACKEND EN DIFERENTES FORMATOS
export type BackendUser = UserProfile | UserFormatted | {
  // Formato snake_case del backend
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  profile_image?: string;
  banner_image?: string;
  phone?: string;
  birth_date?: string;
  join_date?: string;
  last_login?: string;
  is_online?: boolean;
  roles?: Array<string | {id?: number; name: string}>; // Backend puede enviar objetos
  areas?: Array<string | {id?: number; name: string}>; // Backend puede enviar objetos
};