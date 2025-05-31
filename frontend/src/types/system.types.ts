// frontend/src/types/system.types.ts - 🔄 ACTUALIZADO CON ROLES Y ÁREAS

import { UserFormatted } from '../services/users/types/user.types';
import { PermissionCategory } from '../services/security/permissions.service';

// ===== ROLES =====
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleWithPermissions extends Role {
  permissions: string[];
}

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

// ===== ÁREAS =====
export interface Area {
  id: number;
  name: string;
  description?: string;
}

export interface AreaCreateRequest {
  name: string;
  description?: string;
}

export interface AreaUpdateRequest {
  name?: string;
  description?: string;
}

// ===== DEPARTAMENTOS (EXISTENTES) =====
export interface Department {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  type_id: number;
}

export interface DepartmentType {
  id: number;
  name: string;
}

// ===== RESPUESTAS DEL SISTEMA DE DATOS =====
export interface SystemDataResponse {
  roles: Role[];
  areas: Area[];
  users: UserFormatted[];
  permissionCategories: PermissionCategory[];
  timestamp: number;
  loadTime: number;
}

export interface SelectiveDataResponse {
  roles?: Role[];
  areas?: Area[];
  users?: UserFormatted[];
  permissionCategories?: PermissionCategory[];
  timestamp: number;
  loadTime: number;
}

// ===== CONFIGURACIÓN DEL SISTEMA =====
export interface SystemDataOptions {
  forceRefresh?: boolean;
  timeout?: number;
  retries?: number;
}

export type SystemDataType = 'roles' | 'areas' | 'users' | 'permissions';

// ===== ESTADÍSTICAS DEL SISTEMA =====
export interface SystemStats {
  users: {
    total: number;
    active: number;
    online: number;
    byRole: Record<string, number>;
    byArea: Record<string, number>;
  };
  roles: {
    total: number;
    withPermissions: number;
    withoutPermissions: number;
    byCategory: Record<string, number>;
  };
  areas: {
    total: number;
    withDescription: number;
    withoutDescription: number;
  };
  permissions: {
    total: number;
    categories: number;
    byCategory: Record<string, number>;
  };
  timestamp: number;
}

// ===== CONFIGURACIÓN DEL SISTEMA =====
export interface SystemConfig {
  cache: {
    enabled: boolean;
    duration: number;
    maxSize: number;
  };
  api: {
    timeout: number;
    retries: number;
    rateLimit: number;
  };
  features: {
    realTimeUpdates: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

// ===== DATOS PARA DASHBOARD =====
export interface DashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    totalAreas: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_created' | 'role_created' | 'area_created' | 'user_updated';
    description: string;
    timestamp: string;
    user?: string;
  }>;
  charts: {
    usersByRole: Array<{ name: string; value: number }>;
    usersByArea: Array<{ name: string; value: number }>;
    userActivityOverTime: Array<{ date: string; active: number; total: number }>;
  };
}

// ===== DATOS PARA GESTIÓN =====
export interface ManagementData {
  users: UserFormatted[];
  roles: RoleWithPermissions[];
  areas: Area[];
  stats: SystemStats;
  filters: {
    availableRoles: Array<{ id: number; name: string }>;
    availableAreas: Array<{ id: number; name: string }>;
    statuses: Array<{ key: string; label: string }>;
  };
}

// ===== OPCIONES DE BÚSQUEDA Y FILTRADO =====
export interface SearchFilters {
  query?: string;
  role?: string;
  area?: string;
  status?: 'active' | 'inactive' | 'online' | 'offline';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: 'name' | 'email' | 'role' | 'area' | 'lastLogin' | 'joinDate';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// ===== RESPUESTAS DE LISTA CON METADATOS =====
export interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: SearchFilters;
  sort?: SortOptions;
  timestamp: number;
}

// ===== OPERACIONES EN LOTE =====
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data: T;
  id?: number;
}

export interface BatchResult<T> {
  success: Array<{
    id: number;
    data: T;
    operation: string;
  }>;
  failed: Array<{
    id?: number;
    error: string;
    operation: string;
    data: T;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

// ===== EVENTOS Y NOTIFICACIONES =====
export interface SystemEvent {
  id: string;
  type: 'user' | 'role' | 'area' | 'permission' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned';
  entityId: number;
  entityName: string;
  userId: number;
  userName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
}

// ===== CONFIGURACIÓN DE MÓDULOS =====
export interface ModuleConfig {
  users: {
    enabled: boolean;
    features: string[];
    permissions: string[];
  };
  roles: {
    enabled: boolean;
    features: string[];
    permissions: string[];
  };
  areas: {
    enabled: boolean;
    features: string[];
    permissions: string[];
  };
}

// ===== HEALTH CHECK =====
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: string;
  details?: Record<string, any>;
  dependencies?: HealthCheckResult[];
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: string;
  version: string;
  uptime: number;
}

// ===== COMPATIBILIDAD CON FORMULARIOS EXISTENTES =====
// Mantener compatibilidad con el código existente

// Para RoleForm
export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

// Para AreaForm  
export interface AreaFormData {
  name: string;
  description: string;
}

// Para UserForm
export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  areaId?: string;
  isActive?: boolean;
  phone?: string;
  birthDate?: string;
}

// ===== UTILIDADES DE TIPO =====
export type EntityType = 'user' | 'role' | 'area' | 'permission';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'manage';

export type CacheKey = `${EntityType}_${string}` | `${EntityType}s_list` | `${EntityType}_stats`;

// ===== CONSTANTES DE TIPO =====
export const ENTITY_TYPES = ['user', 'role', 'area', 'permission'] as const;
export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'assign', 'manage'] as const;
export const SYSTEM_DATA_TYPES = ['roles', 'areas', 'users', 'permissions'] as const;

// ===== MAPAS DE UTILIDAD =====
export interface EntityDisplayNames {
  user: 'Usuario';
  role: 'Rol';
  area: 'Área';
  permission: 'Permiso';
}

export interface ActionDisplayNames {
  view: 'Ver';
  create: 'Crear';
  edit: 'Editar';
  delete: 'Eliminar';
  assign: 'Asignar';
  manage: 'Gestionar';
}

// ===== CONFIGURACIÓN DE EXPORTACIÓN =====
export const SYSTEM_CONFIG = {
  API_VERSION: 'v1',
  CACHE_PREFIX: 'system_',
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  REFRESH_INTERVAL: 30000, // 30 segundos
  DEBOUNCE_DELAY: 300, // 300ms para búsquedas
} as const;

// ===== INFORMACIÓN DEL MÓDULO =====
export const SYSTEM_TYPES_INFO = {
  version: '2.2.0',
  description: 'Tipos del sistema actualizados con roles y áreas modulares',
  lastUpdated: '2025-05-30',
  entities: ['users', 'roles', 'areas', 'permissions'],
  features: [
    'Tipos para roles y áreas',
    'Respuestas de sistema unificadas',
    'Operaciones en lote',
    'Health checks',
    'Eventos y notificaciones',
    'Compatibilidad con formularios'
  ]
} as const;