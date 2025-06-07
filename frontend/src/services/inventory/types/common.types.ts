// frontend/src/services/inventory/types/common.types.ts

// ===== TIPOS BASE =====
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// ===== CATEGORÍAS =====
export interface InventoryCategory extends BaseEntity {
  name: string;
  description?: string;
  is_equipment: boolean;
  is_active: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  is_equipment: boolean;
  is_active?: boolean;
}

export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {}

// ===== UBICACIONES =====
export interface InventoryLocation extends BaseEntity {
  name: string;
  description?: string;
  is_external: boolean;
  is_active: boolean;
}

export interface LocationCreateRequest {
  name: string;
  description?: string;
  is_external?: boolean;
  is_active?: boolean;
}

export interface LocationUpdateRequest extends Partial<LocationCreateRequest> {}

// ===== PROVEEDORES =====
export interface Supplier extends BaseEntity {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  deleted_at?: string;
  deleted_by_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

export interface SupplierCreateRequest {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
}

export interface SupplierUpdateRequest extends Partial<SupplierCreateRequest> {}

// ===== ESTADOS DE EQUIPOS =====
export interface EquipmentState extends BaseEntity {
  name: string;
  description?: string;
  color: string;
  is_operational: boolean;
  is_active: boolean;
}

export interface EquipmentStateCreateRequest {
  name: string;
  description?: string;
  color?: string;
  is_operational?: boolean;
  is_active?: boolean;
}

export interface EquipmentStateUpdateRequest extends Partial<EquipmentStateCreateRequest> {}

// ===== TIPOS DE MOVIMIENTO =====
export interface MovementType extends BaseEntity {
  name: string;
  description?: string;
  affects_stock: number; // -1, 0, 1
  is_active: boolean;
}

export interface MovementTypeCreateRequest {
  name: string;
  description?: string;
  affects_stock?: number;
  is_active?: boolean;
}

export interface MovementTypeUpdateRequest extends Partial<MovementTypeCreateRequest> {}

// ===== RESPUESTAS DE API =====
export interface InventoryMetrics {
  total_equipment: number;
  active_equipment: number;
  damaged_equipment: number;
  assigned_equipment: number;
  total_supplies: number;
  low_stock_supplies: number;
}

export interface CategorySummary {
  id: number;
  name: string;
  count: number;
  operational_count: number;
  percentage: number;
}

export interface LocationSummary {
  id: number;
  name: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  type: string;
  equipment_id?: number;
  equipment_code?: string;
  equipment_brand?: string;
  equipment_model?: string;
  category?: string;
  state?: string;
  timestamp: string;
  description: string;
}

export interface InventoryDashboardResponse {
  metrics: InventoryMetrics;
  categories_summary: CategorySummary[];
  locations_summary: LocationSummary[];
  recent_activity: RecentActivity[];
  alerts: string[];
  timestamp: string;
}

// ===== FILTROS COMUNES =====
export interface SearchFilters {
  categories: Array<{
    id: number;
    name: string;
    count: number;
  }>;
  states: Array<{
    id: number;
    name: string;
    color: string;
    count: number;
  }>;
  locations: Array<{
    id: number;
    name: string;
    is_external: boolean;
    count: number;
  }>;
  suppliers: Array<{
    id: number;
    name: string;
    count: number;
  }>;
}

// ===== TIPOS DE PAGINACIÓN =====
export interface PaginationParams {
  skip?: number;
  limit?: number;
  cursor?: number;
}

export interface PaginatedResponse<T> {
  total_found: number;
  results: T[];
  has_more: boolean;
  next_cursor?: number;
}

// ===== TIPOS DE FORMATO =====
export type FormatType = 'minimal' | 'list' | 'dropdown' | 'search' | 'with_details';

// ===== ESTADOS DE CARGA =====
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

export interface AsyncOperationState extends LoadingState {
  isSubmitting: boolean;
  success: boolean;
}

// ===== FILTROS DE BÚSQUEDA =====
export interface BaseSearchParams {
  q?: string;
  skip?: number;
  limit?: number;
  cursor?: number;
}

// ===== TIPOS DE RESPUESTA UNIFICADA =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface BulkOperationResponse {
  success: boolean;
  total_processed: number;
  successful: number;
  failed: number;
  errors: string[];
  results: any[];
}

// ===== HELPERS DE TIPADO =====
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type OptionalExcept<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

// ===== TIPOS DE ORDENAMIENTO =====
export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortDirection?: SortDirection;
}

// ===== ENUMS =====
export enum InventoryModule {
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  REPORTS = 'reports'
}

export enum PermissionLevel {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  ASSIGN = 'assign',
  MANAGE_STOCK = 'manage_stock',
  ADMIN = 'admin'
}