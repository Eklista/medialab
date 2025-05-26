// frontend/src/services/index.ts (Organizado)

// Servicios principales
export { default as apiClient } from './api';
export { default as authService } from './auth.service';
export { default as userService } from './users.service';
export { default as permissionsService } from './permissions.service';

// Servicios específicos
export { default as servicesService } from './services.service';
export { default as academicUnitService } from './academicUnits.service';
export { default as departmentTypeService } from './departmentTypes.service';
export { default as publicService } from './public.service';
export { default as serviceTemplatesService } from './serviceTemplates.service';
export { default as smtpService } from './smtp.service';
export { default as emailTemplateService } from './emailTemplate.service';

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
} from './users.service';

// Tipos de permisos
export type {
  Permission,
  PermissionCategory,
  PermissionStats
} from './permissions.service';

// Re-exportar tipos del hook de permisos para conveniencia
export type { UsePermissionsReturn } from '../hooks/usePermissions';

// Funciones de utilidad
export { handleApiError } from './api';