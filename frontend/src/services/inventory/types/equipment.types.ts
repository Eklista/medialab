// frontend/src/services/inventory/types/equipment.types.ts

import { 
  BaseEntity, 
  BaseSearchParams, 
  PaginatedResponse,
  InventoryCategory,
  InventoryLocation,
  EquipmentState,
  Supplier,
  CategorySummary,
  LocationSummary
} from './common.types';

// ===== EQUIPOS =====
export interface Equipment extends BaseEntity {
  // Identificación
  id: number;
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  
  // Especificaciones
  marca?: string;
  modelo?: string;
  descripcion?: string;
  
  // Relaciones (IDs)
  category_id: number;
  state_id: number;
  location_id: number;
  assigned_user_id?: number;
  supplier_id?: number;
  
  // Fechas y documentación
  fecha_entrega?: string;
  numero_hoja_envio?: string;
  observaciones?: string;
  
  // Auditoría
  deleted_at?: string;
  deleted_by_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

// ===== EQUIPOS CON RELACIONES EXPANDIDAS =====
export interface EquipmentWithDetails extends Equipment {
  category?: InventoryCategory;
  state?: EquipmentState;
  location?: InventoryLocation;
  supplier?: Supplier;
  assigned_user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  lab_details?: EquipmentLab;
}

// ===== DETALLES DE LABORATORIO =====
export interface EquipmentLab extends BaseEntity {
  equipment_id: number;
  
  // Detalles técnicos específicos
  numero_pc?: string;
  procesador?: string;
  memoria_ram?: string;
  capacidad_hdd?: string;
  
  // Monitor asociado
  monitor_serie?: string;
  monitor_codigo_ug?: string;
  
  // Flujo SEGA → laboratorio → medialab
  supplier_id?: number;
  fecha_recepcion_sega?: string;
  fecha_entrega_medialab?: string;
  
  // Auditoría
  deleted_at?: string;
  deleted_by_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
  
  // Relaciones expandidas
  supplier?: Supplier;
}

// ===== REQUESTS DE CREACIÓN =====
export interface EquipmentCreateRequest {
  // Identificación
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  
  // Especificaciones
  marca?: string;
  modelo?: string;
  descripcion?: string;
  
  // Relaciones (requeridas)
  category_id: number;
  state_id: number;
  location_id: number;
  
  // Relaciones opcionales
  assigned_user_id?: number;
  supplier_id?: number;
  
  // Fechas y documentación
  fecha_entrega?: string;
  numero_hoja_envio?: string;
  observaciones?: string;
  
  // Detalles de laboratorio opcionales
  lab_details?: EquipmentLabCreateRequest;
}

export interface EquipmentLabCreateRequest {
  numero_pc?: string;
  procesador?: string;
  memoria_ram?: string;
  capacidad_hdd?: string;
  monitor_serie?: string;
  monitor_codigo_ug?: string;
  supplier_id?: number;
  fecha_recepcion_sega?: string;
  fecha_entrega_medialab?: string;
}

// ===== REQUESTS DE ACTUALIZACIÓN =====
export interface EquipmentUpdateRequest {
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  category_id?: number;
  state_id?: number;
  location_id?: number;
  assigned_user_id?: number;
  supplier_id?: number;
  fecha_entrega?: string;
  numero_hoja_envio?: string;
  observaciones?: string;
}

export interface EquipmentLabUpdateRequest {
  numero_pc?: string;
  procesador?: string;
  memoria_ram?: string;
  capacidad_hdd?: string;
  monitor_serie?: string;
  monitor_codigo_ug?: string;
  supplier_id?: number;
  fecha_recepcion_sega?: string;
  fecha_entrega_medialab?: string;
}

// ===== FILTROS DE BÚSQUEDA =====
export interface EquipmentSearchParams extends BaseSearchParams {
  category_id?: number;
  state_id?: number;
  location_id?: number;
  assigned_user_id?: number;
  supplier_id?: number;
  operational_only?: boolean;
  assigned_only?: boolean;
  unassigned_only?: boolean;
}

// ===== RESPUESTAS DE BÚSQUEDA =====
export interface EquipmentSearchResponse extends PaginatedResponse<EquipmentWithDetails> {
  performance_hint?: string;
}

// ===== FORMATEO DE DATOS =====
export interface EquipmentListItem {
  id: number;
  codigo_ug: string;
  marca: string;
  modelo: string;
  category: string;
  state: {
    name: string;
    color: string;
    is_operational: boolean;
  };
  location: string;
  assigned_user?: {
    id: number;
    fullName: string;
    email: string;
  };
  created_at: string;
}

export interface EquipmentDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  category?: string;
  state?: string;
}

export interface EquipmentMinimal {
  id: number;
  codigo_ug: string;
  marca: string;
  modelo: string;
  is_available: boolean;
}

// ===== OPERACIONES DE ASIGNACIÓN =====
export interface AssignmentRequest {
  user_id: number;
  notes?: string;
}

export interface UnassignmentRequest {
  return_notes?: string;
}

export interface AssignmentHistory extends BaseEntity {
  equipment_id: number;
  user_id: number;
  assigned_at: string;
  unassigned_at?: string;
  assigned_by_id: number;
  unassigned_by_id?: number;
  assignment_notes?: string;
  return_notes?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assigned_by?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  unassigned_by?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// ===== MÉTRICAS Y ESTADÍSTICAS =====
export interface EquipmentMetrics {
  total_equipment: number;
  active_equipment: number;
  damaged_equipment: number;
  assigned_equipment: number;
  available_equipment: number;
  by_category: CategorySummary[];
  by_location: LocationSummary[];
  by_state: StateSummary[];
}

export interface StateSummary {
  id: number;
  name: string;
  color: string;
  count: number;
  percentage: number;
  is_operational: boolean;
}

// ===== TIPOS DE VISTA =====
export type EquipmentViewMode = 'table' | 'cards' | 'list';

// ===== TIPOS DE EXPORT =====
export interface EquipmentExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  filters?: EquipmentSearchParams;
  include_lab_details?: boolean;
  include_assignment_history?: boolean;
}

export interface EquipmentExportResponse {
  file_url: string;
  filename: string;
  expires_at: string;
}

// ===== TIPOS DE VALIDACIÓN =====
export interface EquipmentValidationError {
  field: string;
  message: string;
  code: string;
}

export interface EquipmentValidationResponse {
  is_valid: boolean;
  errors: EquipmentValidationError[];
  warnings?: string[];
  suggestions?: string[];
}

// ===== OPERACIONES BULK =====
export interface BulkEquipmentUpdateRequest {
  equipment_ids: number[];
  updates: EquipmentUpdateRequest;
}

export interface BulkAssignmentRequest {
  equipment_ids: number[];
  user_id: number;
  notes?: string;
}

export interface BulkUnassignmentRequest {
  equipment_ids: number[];
  return_notes?: string;
}

export interface BulkStateChangeRequest {
  equipment_ids: number[];
  new_state_id: number;
  reason?: string;
}

// ===== TIPOS DE CONFIGURACIÓN =====
export interface EquipmentConfig {
  auto_generate_codigo: boolean;
  codigo_prefix: string;
  require_assignment_notes: boolean;
  allow_duplicate_serial: boolean;
  require_lab_details_for_pc: boolean;
  default_warranty_months: number;
}

// ===== UNION TYPES PARA RESPUESTAS =====
export type EquipmentFormattedResponse = 
  | EquipmentListItem[]
  | EquipmentDropdownOption[]
  | EquipmentMinimal[]
  | EquipmentWithDetails[];

// ===== HELPERS DE TIPO =====
export type EquipmentCreateData = Omit<EquipmentCreateRequest, 'created_by_id'>;
export type EquipmentUpdateData = Omit<EquipmentUpdateRequest, 'updated_by_id'>;

// ===== TIPOS DE ESTADO DE COMPONENTE =====
export interface EquipmentComponentState {
  selectedEquipment: EquipmentWithDetails | null;
  viewMode: EquipmentViewMode;
  filters: EquipmentSearchParams;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  selectedIds: number[];
  isLoading: boolean;
  error: string | null;
}