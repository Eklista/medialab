// frontend/src/services/index.ts - 🔄 ACTUALIZADO CON ROLES Y ÁREAS

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

// ===== SERVICIOS DE SEGURIDAD =====
export { default as permissionsService } from './security/permissions.service';
export { default as rolesService } from './security/roles.service'; // 🆕 NUEVO

// ===== SERVICIOS DE ORGANIZACIÓN =====
export { default as areasService } from './organization/areas.service'; // 🆕 NUEVO
export { default as servicesService } from './organization/services.service';
export { default as academicUnitService } from './organization/academicUnits.service';
export { default as departmentTypeService } from './organization/departmentTypes.service';

// 🆕 NUEVO: Servicio unificado de datos del sistema
export { default as systemDataService } from './system/systemData.service';

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

// ===== TIPOS DE ROLES Y ÁREAS (NUEVOS) =====
export type {
  Role,
  RoleWithPermissions,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleStats
} from './security/roles.service';

export type {
  Area,
  AreaCreateRequest,
  AreaUpdateRequest,
  AreaStats
} from './organization/areas.service';

// ===== TIPOS DEL SISTEMA (CENTRALIZADOS) =====
export type {
  Department,
  DepartmentType,
  SystemDataResponse,
  SelectiveDataResponse,
  SystemDataOptions,
  SystemDataType,
  SystemStats,
  SystemConfig
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
  version: '2.2.0',
  description: 'Servicios optimizados con usuarios refactorizados, roles y áreas modulares',
  features: [
    'Sistema unificado de datos',
    'Cache inteligente con TTL',
    'Deduplicación de requests',
    'Carga selectiva de datos',
    '🆕 Usuarios modulares refactorizados',
    '🆕 Servicios de roles y áreas independientes',
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
    security: [
      'rolesService (🆕 nuevo)',
      'permissionsService'
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
      'areasService (🆕 nuevo)',
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
  lastUpdated: '2025-05-30'
} as const;

// ===== UTILIDADES DE DESARROLLO =====
// Importaciones para DEV_UTILS
import userServiceInstance from './users/users.service';
import systemDataServiceInstance from './system/systemData.service';
import rolesServiceInstance from './security/roles.service';
import areasServiceInstance from './organization/areas.service';

export const DEV_UTILS = {
  // Información de todos los servicios
  getServicesInfo: () => SERVICES_INFO,
  
  // Debug de usuarios
  debugUsers: () => userServiceInstance.dev.debugInfo(),
  
  // 🆕 Debug de roles
  debugRoles: () => ({
    cache: rolesServiceInstance.getCacheStats(),
    service: 'roles.service'
  }),
  
  // 🆕 Debug de áreas
  debugAreas: () => ({
    cache: areasServiceInstance.getCacheStats(),
    service: 'areas.service'
  }),
  
  // Health check general
  healthCheck: async () => {
    const results = await Promise.allSettled([
      userServiceInstance.dev.healthCheck(),
      rolesServiceInstance.getRoles({ limit: 1 }).then(() => ({ status: 'OK', service: 'roles' })),
      areasServiceInstance.getAreas({ limit: 1 }).then(() => ({ status: 'OK', service: 'areas' }))
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      results: results.map((result, index) => ({
        service: ['users', 'roles', 'areas'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : result.reason
      }))
    };
  },
  
  // Limpiar todos los caches
  clearAllCaches: () => {
    userServiceInstance.cache.clear();
    systemDataServiceInstance.clearCache();
    rolesServiceInstance.clearCache();
    areasServiceInstance.clearCache();
    console.log('🧹 Todos los caches limpiados');
  },
  
  // 🆕 Refresh específico
  refreshModule: async (module: 'users' | 'roles' | 'areas' | 'all') => {
    console.log(`🔄 Refrescando módulo: ${module}`);
    
    switch (module) {
      case 'users':
        userServiceInstance.cache.clear();
        break;
      case 'roles':
        await rolesServiceInstance.refresh();
        break;
      case 'areas':
        await areasServiceInstance.refresh();
        break;
      case 'all':
        await Promise.all([
          rolesServiceInstance.refresh(),
          areasServiceInstance.refresh()
        ]);
        userServiceInstance.cache.clear();
        systemDataServiceInstance.clearCache();
        break;
    }
    
    console.log(`✅ Módulo ${module} refrescado`);
  }
} as const;

// ===== COMPATIBILIDAD CON FORMULARIOS =====
// Métodos de conveniencia para los formularios existentes

/**
 * 🔄 Adaptador para compatibility con RoleForm
 */
export const roleServiceAdapter = {
  async getRoles() {
    return rolesServiceInstance.getRoles();
  },
  
  async getRoleWithPermissions(roleId: number) {
    return rolesServiceInstance.getRoleById(roleId, true);
  },
  
  async createRole(roleData: any) {
    return rolesServiceInstance.createRole(roleData);
  },
  
  async updateRole(roleId: number, roleData: any) {
    return rolesServiceInstance.updateRole(roleId, roleData);
  },
  
  async deleteRole(roleId: number) {
    return rolesServiceInstance.deleteRole(roleId);
  },
  
  async assignPermissions(roleId: number, permissionIds: number[]) {
    return rolesServiceInstance.assignPermissions(roleId, permissionIds);
  }
};

/**
 * 🔄 Adaptador para compatibility con AreaForm
 */
export const areaServiceAdapter = {
  async getAreas() {
    return areasServiceInstance.getAreas();
  },
  
  async getAreaById(areaId: number) {
    return areasServiceInstance.getAreaById(areaId);
  },
  
  async createArea(areaData: any) {
    return areasServiceInstance.createArea(areaData);
  },
  
  async updateArea(areaId: number, areaData: any) {
    return areasServiceInstance.updateArea(areaId, areaData);
  },
  
  async deleteArea(areaId: number) {
    return areasServiceInstance.deleteArea(areaId);
  }
};

// ===== NOTA PARA DESARROLLO =====
console.log('📚 Servicios cargados:', SERVICES_INFO.version);
console.log('🆕 Nuevos servicios: rolesService, areasService');
console.log('🔧 Para debugging: DEV_UTILS.getServicesInfo()');

// Para debugging en desarrollo
if (import.meta.env.DEV) {
  (window as any).servicesDebug = DEV_UTILS;
  (window as any).rolesService = rolesServiceInstance;
  (window as any).areasService = areasServiceInstance;
}