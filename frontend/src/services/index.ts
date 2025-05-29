// frontend/src/services/index.ts - SOLO EXPORTACIONES

// ===== SERVICIOS PRINCIPALES =====
export { default as apiClient } from './api';
export { default as authService } from './auth/auth.service';
export { default as userService } from './users/users.service';
export { default as permissionsService } from './security/permissions.service';

// 🆕 NUEVO: Servicio unificado de datos del sistema
export { default as systemDataService } from './system/systemData.service';

// ===== SERVICIOS DE ORGANIZACIÓN =====
export { default as servicesService } from './organization/services.service';
export { default as academicUnitService } from './organization/academicUnits.service';
export { default as departmentTypeService } from './organization/departmentTypes.service';

// ===== SERVICIOS DEL SISTEMA =====
export { default as publicService } from './system/public.service';

// ===== SERVICIOS DE PLANTILLAS =====
export { default as serviceTemplatesService } from './templates/serviceTemplates.service';
export { default as emailTemplateService } from './templates/emailTemplate.service';

// ===== SERVICIOS DE COMUNICACIÓN =====
export { default as smtpService } from './communication/smtp.service';

// ===== TIPOS PRINCIPALES DE USUARIOS =====
export type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  Role,
  RoleCreateRequest,
  RoleUpdateRequest,
  Area,
  AreaCreateRequest,
  AreaUpdateRequest
} from './users/users.service';

// ===== TIPOS DE PERMISOS =====
export type {
  Permission,
  PermissionCategory,
  PermissionStats
} from './security/permissions.service';

// 🆕 NUEVOS: Tipos del servicio de datos del sistema
export type {
  SystemDataResponse,
  SelectiveDataResponse,
  SystemDataOptions,
  SystemDataType
} from './system/systemData.service';

// ===== FUNCIONES DE UTILIDAD =====
export { 
  handleApiError, 
  requestDeduplicator, 
  createCacheKey,
  debugApiConfig,
  resetErrorCounters 
} from './api';

// 🆕 NUEVAS: Funciones de utilidad del sistema de datos
export { 
  getSystemDataStats, 
  clearSystemDataCache, 
  hasSystemData 
} from './system/systemData.service';

// ===== RE-EXPORTAR HOOKS OPTIMIZADOS =====
export type { UsePermissionsReturn } from '../hooks/usePermissions';

// 🆕 NUEVOS: Re-exportar hooks optimizados
export {
  useOptimizedData,
  useRoles,
  useAreas,
  useUsers,
  usePermissionCategories,
  useDashboardData,
  useUserManagementData,
  useSystemStats,
  useDataDebugger
} from '../hooks/useOptimizedData';

// ===== CONFIGURACIÓN Y CONSTANTES =====
export const API_CONFIG = {
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
  USER_CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  REQUEST_TIMEOUT: 15000, // 15 segundos
  MAX_RETRIES: 2
} as const;

// ===== INFORMACIÓN DEL MÓDULO =====
export const SERVICES_INFO = {
  version: '2.0.0',
  description: 'Servicios optimizados con cache inteligente y carga selectiva',
  features: [
    'Sistema unificado de datos',
    'Cache inteligente con TTL',
    'Deduplicación de requests',
    'Carga selectiva de datos',
    'Hooks optimizados',
    'Monitoreo de performance',
    'Health checks automáticos',
    'Debugging avanzado'
  ],
  lastUpdated: '2025-05-28'
} as const;