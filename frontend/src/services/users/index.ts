// ===================================================================
// frontend/src/services/users/index.ts - 🔄 ACTUALIZADO CON NUEVOS MÓDULOS
// ===================================================================

// ===== SERVICIOS MODULARES =====
export { default as userProfileService } from './profile/userProfile.service';
export { default as userEditService } from './edit/userEdit.service';
export { default as userListService } from './list/userList.service';
export { default as userStatusService } from './status/userStatus.service';
export { default as userImageService } from './images/userImage.service';

// 🆕 NUEVOS SERVICIOS OPTIMIZADOS
export { default as userBatchService } from './batch/userBatch.service';
export { default as userCacheService } from './cache/userCache.service';

// ===== SERVICIO PRINCIPAL (ORQUESTADOR) =====
export { default as userService } from './users.service';
export { default } from './users.service'; // Default export

// ===== TIPOS E INTERFACES =====
export * from './types/user.types';
export * from './types/requests.types';

// ===== UTILIDADES =====
export * from './utils/userTransforms';
export * from './utils/userValidations';

// ===== HOOKS PERSONALIZADOS =====
export * from './hooks/useUserService';

// ===== TIPOS DE LOS NUEVOS SERVICIOS =====
export type {
  EssentialUserData,
  DashboardData,
  ManagementData
} from './batch/userBatch.service';

// ===== INFORMACIÓN DEL MÓDULO =====
export const USER_SERVICES_INFO = {
  version: '2.0.0',
  description: 'Servicios de usuarios refactorizados con arquitectura modular',
  modules: {
    core: [
      'userProfileService',
      'userEditService', 
      'userListService',
      'userStatusService',
      'userImageService'
    ],
    optimization: [
      'userBatchService',
      'userCacheService'
    ],
    orchestrator: [
      'userService (principal)'
    ],
    utils: [
      'userTransforms',
      'userValidations'
    ],
    hooks: [
      'useCurrentUserProfile',
      'useUserList',
      'useActiveUsers',
      'usePresenceTracking',
      'useQuickStart',
      'useUserCache'
    ]
  },
  features: [
    'Arquitectura modular',
    'Cache inteligente con TTL',
    'Operaciones en lote optimizadas',
    'Hooks React personalizados',
    'Monitoreo de presencia',
    'Gestión de imágenes',
    'Health checks automáticos',
    'Compatibilidad hacia atrás'
  ],
  lastUpdated: '2025-05-29'
} as const;