// types/forms.ts
export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  hasRequirements: boolean; // Si tiene requerimientos críticos
  criticalRequirements: string[]; // Lista de requerimientos críticos
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
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTypeFormData {
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  hasRequirements: boolean;
  criticalRequirements: string[];
}

export interface ServiceFormData {
  name: string;
  description?: string;
  serviceTypeId: string;
  isActive: boolean;
  requirements?: string;
}