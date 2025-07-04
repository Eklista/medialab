// types/forms.ts
export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  serviceTypeId: string;
  serviceType?: ServiceType;
  isActive: boolean;
  requirements?: string;
  hasCriticalRequirements: boolean;
  criticalRequirements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTypeFormData {
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  serviceTypeId: string;
  isActive: boolean;
  requirements?: string;
  hasCriticalRequirements: boolean;
  criticalRequirements: string[];
}

// Tipos de Equipo
export interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentTypeFormData {
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

// Ubicaciones
export interface Location {
  id: string;
  name: string;
  description?: string;
  type: 'studio' | 'room' | 'warehouse' | 'office' | 'outdoor' | 'other';
  capacity?: number;
  equipment?: string[]; // IDs de equipos disponibles en esta ubicación
  features?: string[]; // Características especiales
  isBookable: boolean; // Si se puede reservar
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationFormData {
  name: string;
  description?: string;
  type: 'studio' | 'room' | 'warehouse' | 'office' | 'outdoor' | 'other';
  capacity?: number;
  features?: string[];
  isBookable: boolean;
  isActive: boolean;
}

// Sistema de roles simplificado
export interface Role {
  id: string;
  name: 'super_admin' | 'admin' | 'collaborator' | 'client';
  displayName: string;
  description?: string;
  permissions: Permission[];
  portalAccess: 'god_mode' | 'dashboard' | 'client_portal';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  role?: Role;
  status: 'invited' | 'active' | 'inactive' | 'suspended';
  contractDate: string;
  invitedAt: string;
  registeredAt?: string;
  lastLoginAt?: string;
  profilePicture?: string;
  phone?: string;
  department?: string;
  position?: string;
  invitationToken?: string;
  isActive: boolean;
  // Campos específicos por tipo de usuario
  clientCompany?: string; // Para clientes
  clientType?: 'internal' | 'external'; // Interno (universidad) o externo
  employeeId?: string; // Para colaboradores internos
  accessLevel?: 'basic' | 'advanced'; // Nivel de acceso en portal cliente
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  contractDate: string;
  department?: string;
  position?: string;
  clientCompany?: string;
  clientType?: 'internal' | 'external';
  employeeId?: string;
  accessLevel?: 'basic' | 'advanced';
  isActive: boolean;
}

export interface RoleFormData {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  portalAccess: 'god_mode' | 'dashboard' | 'client_portal';
  isActive: boolean;
}