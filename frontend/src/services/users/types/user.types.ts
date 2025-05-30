// ===================================================================
// frontend/src/services/users/types/user.types.ts - 🔧 COMPLETO
// ===================================================================
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
}

export interface UserWithStatus extends UserProfile {
  isOnline?: boolean;
  status?: 'online' | 'away' | 'offline' | 'inactive'; // 🔧 Agregado 'inactive'
  statusIcon?: string;
  statusColor?: string;
  last_seen?: string;
}

export interface UserWithRoles extends UserWithStatus {
  roles: string[];
  areas?: Array<{id: number, name: string}>;
  permissions?: string[];
  roleDisplay?: string;
  areaDisplay?: string;
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
}

// 🆕 NUEVOS TIPOS QUE FALTABAN
export interface UserStatusUpdate {
  isOnline?: boolean;
  lastSeen?: string;
  status?: 'online' | 'away' | 'offline' | 'inactive';
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
}