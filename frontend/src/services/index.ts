// frontend/src/services/index.ts (Organizado)

// Servicios principales
export { default as apiClient } from './api';
export { default as authService } from './auth/auth.service';
export { default as userService } from './users/users.service';
export { default as permissionsService } from './security/permissions.service';

// Servicios específicos
export { default as servicesService } from './organization/services.service';
export { default as academicUnitService } from './organization/academicUnits.service';
export { default as departmentTypeService } from './organization/departmentTypes.service';
export { default as publicService } from './system/public.service';
export { default as serviceTemplatesService } from './templates/serviceTemplates.service';
export { default as smtpService } from './communication/smtp.service';
export { default as emailTemplateService } from './templates/emailTemplate.service';

// Tipos principales de usuarios
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

// Tipos de permisos
export type {
  Permission,
  PermissionCategory,
  PermissionStats
} from './security/permissions.service';

// Re-exportar tipos del hook de permisos para conveniencia
export type { UsePermissionsReturn } from '../hooks/usePermissions';

// Funciones de utilidad
export { handleApiError } from './api';