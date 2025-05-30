// frontend/src/types/system.types.ts - 🎯 TIPOS COMPARTIDOS DEL SISTEMA
// Centraliza interfaces que se usan en múltiples servicios

// ===== ENTIDADES PRINCIPALES =====

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  type_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentType {
  id: number;
  name: string;
  description?: string;
}

// ===== REQUESTS COMUNES =====

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AreaCreateRequest {
  name: string;
  description?: string;
  parent_id?: number;
}

export interface AreaUpdateRequest {
  name?: string;
  description?: string;
  parent_id?: number;
}

// ===== RESPONSES DEL SISTEMA =====

export interface SystemDataResponse {
  roles: Role[];
  areas: Area[];
  users: import('../services/users/types/user.types').UserFormatted[];
  permissionCategories: import('../services/security/permissions.service').PermissionCategory[];
  departments?: Department[];
  departmentTypes?: DepartmentType[];
  timestamp: number;
  loadTime: number;
}

export interface SelectiveDataResponse {
  roles?: Role[];
  areas?: Area[];
  users?: import('../services/users/types/user.types').UserFormatted[];
  permissionCategories?: import('../services/security/permissions.service').PermissionCategory[];
  departments?: Department[];
  departmentTypes?: DepartmentType[];
  timestamp: number;
  loadTime: number;
}

// ===== TIPOS DE CONFIGURACIÓN =====

export interface SystemDataOptions {
  forceRefresh?: boolean;
  timeout?: number;
  retries?: number;
  includeInactive?: boolean;
}

export type SystemDataType = 'roles' | 'areas' | 'users' | 'permissions' | 'departments' | 'departmentTypes';

// ===== ESTADÍSTICAS DEL SISTEMA =====

export interface SystemStats {
  roles: {
    total: number;
    active: number;
    withPermissions: number;
  };
  areas: {
    total: number;
    active: number;
    withParent: number;
  };
  users: {
    total: number;
    active: number;
    online: number;
    byRole: Record<string, number>;
    byArea: Record<string, number>;
  };
  departments: {
    total: number;
    byType: Record<string, number>;
  };
  lastUpdated: string;
}

// ===== FILTROS Y BÚSQUEDA =====

export interface SystemSearchFilters {
  query?: string;
  entityType?: SystemDataType;
  isActive?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface SystemPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===== AUDITORÍA Y LOGS =====

export interface SystemAuditLog {
  id: number;
  entity_type: SystemDataType;
  entity_id: number;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, any>;
  user_id: number;
  timestamp: string;
}

// ===== CONFIGURACIÓN DEL SISTEMA =====

export interface SystemConfig {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_users: number;
  session_timeout: number;
  file_upload_max_size: number;
  supported_file_types: string[];
  email_verification_required: boolean;
  password_requirements: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
}

// ===== EXPORTACIONES DE CONVENIENCIA =====

export type SystemEntity = Role | Area | Department | DepartmentType;
export type SystemCreateRequest = RoleCreateRequest | AreaCreateRequest;
export type SystemUpdateRequest = RoleUpdateRequest | AreaUpdateRequest;

// ===== INFORMACIÓN DEL MÓDULO =====
export const SYSTEM_TYPES_INFO = {
  version: '1.0.0',
  description: 'Tipos compartidos para entidades del sistema',
  entities: ['Role', 'Area', 'Department', 'DepartmentType'],
  purposes: [
    'Centralizar tipos comunes',
    'Evitar duplicación de interfaces',
    'Facilitar mantenimiento',
    'Mejorar consistencia de tipos'
  ],
  lastUpdated: '2025-05-29'
} as const;