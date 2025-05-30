// frontend/src/services/index.ts - 🔄 ACTUALIZADO CON USUARIOS REFACTORIZADOS

// ===== SERVICIOS PRINCIPALES =====
export { default as apiClient } from './api';
export { default as authService } from './auth/auth.service';

// 🔄 USUARIOS REFACTORIZADOS - Exportar servicio principal y módulos
export { default as userService } from './users/users.service';
export { 
  userProfileService,
  userEditService,
  userListService,
  userStatusService,
  userImageService,
  userBatchService,
  userCacheService
} from './users';

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

// ===== SERVICIOS COMUNES =====
export { default as fileUploadService } from './common/fileUpload.service';

// ===== TIPOS PRINCIPALES DE USUARIOS (ACTUALIZADOS) =====
export type {
  BaseUser,
  UserProfile,
  UserWithStatus,
  UserWithRoles,
  UserFormatted,
  UserStatusUpdate,
  UserListOptions,
  UserSearchFilters,
  UserStats,
  UserPresence
} from './users/types/user.types';

export type {
  UserCreateRequest,
  UserUpdateRequest,
  UserPasswordChangeRequest,
  UserRoleAssignmentRequest,
  UserImageUploadRequest
} from './users/types/requests.types';

// ===== TIPOS DEL SISTEMA (CENTRALIZADOS) =====
export type {
  Role,
  Area,
  Department,
  DepartmentType,
  SystemDataResponse,
  SelectiveDataResponse,
  SystemDataOptions,
  SystemDataType,
  SystemStats,
  SystemConfig,
  RoleCreateRequest,
  RoleUpdateRequest,
  AreaCreateRequest,
  AreaUpdateRequest
} from '../types/system.types';

// ===== TIPOS DE PERMISOS =====
export type {
  Permission,
  PermissionCategory,
  PermissionStats
} from './security/permissions.service';

// 🆕 NUEVOS: Tipos de servicios de usuarios optimizados
export type {
  EssentialUserData,
  DashboardData,
  ManagementData
} from './users/batch/userBatch.service';

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

// ===== HOOKS OPTIMIZADOS =====
export type { UsePermissionsReturn } from '../hooks/usePermissions';

// 🆕 NUEVOS: Re-exportar hooks de usuarios
export {
  useCurrentUserProfile,
  useUserList,
  useActiveUsers,
  usePresenceTracking,
  useQuickStart,
  useUserCache
} from './users/hooks/useUserService';

// 🆕 NUEVOS: Re-exportar hooks optimizados existentes
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

// ===== INFORMACIÓN DEL MÓDULO ACTUALIZADA =====
export const SERVICES_INFO = {
  version: '2.1.0',
  description: 'Servicios optimizados con usuarios refactorizados, cache inteligente y carga selectiva',
  features: [
    'Sistema unificado de datos',
    'Cache inteligente con TTL',
    'Deduplicación de requests',
    'Carga selectiva de datos',
    '🆕 Usuarios modulares refactorizados',
    '🆕 Operaciones en lote optimizadas',
    '🆕 Cache específico para usuarios',
    '🆕 Hooks React personalizados',
    '🆕 Monitoreo de presencia avanzado',
    'Health checks automáticos',
    'Debugging avanzado'
  ],
  modules: {
    core: [
      'apiClient',
      'authService',
      'userService (refactorizado)',
      'permissionsService',
      'systemDataService'
    ],
    users: [
      'userProfileService',
      'userEditService',
      'userListService',
      'userStatusService',
      'userImageService',
      'userBatchService',
      'userCacheService'
    ],
    organization: [
      'servicesService',
      'academicUnitService',
      'departmentTypeService'
    ],
    templates: [
      'serviceTemplatesService',
      'emailTemplateService'
    ],
    communication: [
      'smtpService'
    ],
    system: [
      'publicService',
      'systemDataService'
    ],
    common: [
      'fileUploadService'
    ]
  },
  lastUpdated: '2025-05-29'
} as const;

// ===== UTILIDADES DE DESARROLLO =====
// Importaciones para DEV_UTILS
import userServiceInstance from './users/users.service';
import systemDataServiceInstance from './system/systemData.service';

export const DEV_UTILS = {
  // Información de todos los servicios
  getServicesInfo: () => SERVICES_INFO,
  
  // Debug de usuarios
  debugUsers: () => userServiceInstance.dev.debugInfo(),
  
  // Health check general
  healthCheck: async () => {
    const results = await Promise.allSettled([
      userServiceInstance.dev.healthCheck(),
      // Aquí podrías agregar más health checks de otros servicios
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      results: results.map((result, index) => ({
        service: ['users'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : result.reason
      }))
    };
  },
  
  // Limpiar todos los caches
  clearAllCaches: () => {
    userServiceInstance.cache.clear();
    systemDataServiceInstance.clearCache();
    console.log('🧹 Todos los caches limpiados');
  }
} as const;