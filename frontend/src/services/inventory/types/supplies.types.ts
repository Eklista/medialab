// frontend/src/services/inventory/types/supplies.types.ts

import { 
  BaseEntity, 
  BaseSearchParams, 
  PaginatedResponse,
  InventoryCategory,
  InventoryLocation,
  MovementType
} from './common.types';

// ===== SUMINISTROS =====
export interface Supply extends BaseEntity {
  id: number;
  
  // Clasificación
  category_id: number;
  
  // Identificación
  codigo?: string;
  nombre_producto: string;
  presentacion?: string;
  descripcion?: string;
  
  // Stock
  stock_actual: number;
  stock_minimo: number;
  
  // Ubicación principal
  location_id?: number;
  
  // Estado
  is_active: boolean;
  observaciones?: string;
  
  // Auditoría
  deleted_at?: string;
  deleted_by_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

// ===== SUMINISTROS CON RELACIONES EXPANDIDAS =====
export interface SupplyWithDetails extends Supply {
  category?: InventoryCategory;
  location?: InventoryLocation;
  recent_movements?: SupplyMovementWithDetails[];
  stock_status?: StockStatus;
}

// ===== MOVIMIENTOS DE SUMINISTROS =====
export interface SupplyMovement extends BaseEntity {
  id: number;
  
  // Producto y tipo de movimiento
  supply_id: number;
  movement_type_id: number;
  
  // Cantidad
  cantidad: number;
  
  // Documentación
  numero_envio?: string;
  fecha_movimiento: string;
  
  // Personal involucrado
  user_receives_id?: number;
  user_delivers_to_id?: number;
  
  // Observaciones
  observaciones?: string;
  
  // Auditoría
  created_by_id?: number;
}

// ===== MOVIMIENTOS CON RELACIONES =====
export interface SupplyMovementWithDetails extends SupplyMovement {
  supply?: Supply;
  movement_type?: MovementType;
  user_receives?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  user_delivers_to?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  created_by?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
}

// ===== REQUESTS DE CREACIÓN =====
export interface SupplyCreateRequest {
  codigo?: string;
  nombre_producto: string;
  presentacion?: string;
  descripcion?: string;
  category_id: number;
  location_id?: number;
  stock_actual?: number;
  stock_minimo?: number;
  is_active?: boolean;
  observaciones?: string;
}

export interface SupplyMovementCreateRequest {
  supply_id: number;
  movement_type_id: number;
  cantidad: number;
  numero_envio?: string;
  user_receives_id?: number;
  user_delivers_to_id?: number;
  observaciones?: string;
  fecha_movimiento?: string;
}

// ===== REQUESTS DE ACTUALIZACIÓN =====
export interface SupplyUpdateRequest {
  codigo?: string;
  nombre_producto?: string;
  presentacion?: string;
  descripcion?: string;
  category_id?: number;
  location_id?: number;
  stock_actual?: number;
  stock_minimo?: number;
  is_active?: boolean;
  observaciones?: string;
}

// ===== FILTROS DE BÚSQUEDA =====
export interface SupplySearchParams extends BaseSearchParams {
  category_id?: number;
  location_id?: number;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  active_only?: boolean;
  with_movements?: boolean;
}

// ===== RESPUESTAS DE BÚSQUEDA =====
export interface SupplySearchResponse extends PaginatedResponse<SupplyWithDetails> {
  low_stock_count?: number;
  out_of_stock_count?: number;
}

// ===== ESTADO DEL STOCK =====
export type StockStatus = 'ok' | 'low' | 'critical' | 'out';

export interface StockStatusDetails {
  status: StockStatus;
  message: string;
  color: string;
  icon: string;
  priority: number;
}

export interface SupplyStockResponse {
  supply_id: number;
  codigo?: string;
  nombre_producto: string;
  stock_actual: number;
  stock_minimo: number;
  status: StockStatus;
  last_movement?: SupplyMovementWithDetails;
  days_since_last_movement?: number;
  predicted_stock_out_date?: string;
}

// ===== FORMATEO DE DATOS =====
export interface SupplyListItem {
  id: number;
  codigo: string;
  nombre_producto: string;
  presentacion: string;
  category: string;
  stock_actual: number;
  stock_minimo: number;
  stock_status: StockStatus;
  location: string;
  last_movement_date?: string;
  last_movement_type?: string;
}

export interface SupplyDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  category?: string;
  stock_actual?: number;
  stock_status?: StockStatus;
}

export interface SupplyMinimal {
  id: number;
  codigo: string;
  nombre_producto: string;
  stock_actual: number;
  stock_status: StockStatus;
}

// ===== OPERACIONES DE STOCK =====
export interface StockAdjustmentRequest {
  supply_id: number;
  new_stock: number;
  reason: string;
  adjustment_type: 'manual' | 'inventory_count' | 'damage' | 'expired';
}

export interface StockTransferRequest {
  supply_id: number;
  from_location_id: number;
  to_location_id: number;
  cantidad: number;
  transfer_notes?: string;
  user_receives_id?: number;
}

export interface BulkStockUpdateRequest {
  supplies: Array<{
    supply_id: number;
    new_stock: number;
    reason?: string;
  }>;
  global_reason?: string;
}

// ===== MÉTRICAS Y ESTADÍSTICAS =====
export interface SupplyMetrics {
  total_supplies: number;
  active_supplies: number;
  low_stock_supplies: number;
  out_of_stock_supplies: number;
  total_stock_value?: number;
  by_category: SupplyCategorySummary[];
  by_location: SupplyLocationSummary[];
  by_status: SupplyStatusSummary[];
}

export interface SupplyCategorySummary {
  id: number;
  name: string;
  count: number;
  total_stock: number;
  low_stock_count: number;
  percentage: number;
}

export interface SupplyLocationSummary {
  id: number;
  name: string;
  count: number;
  total_stock: number;
  percentage: number;
}

export interface SupplyStatusSummary {
  status: StockStatus;
  count: number;
  percentage: number;
  supplies: SupplyMinimal[];
}

// ===== ALERTAS DE STOCK =====
export interface StockAlert {
  id: number;
  supply_id: number;
  supply_name: string;
  supply_code?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'negative_stock' | 'no_movement';
  current_stock: number;
  minimum_stock: number;
  days_without_movement?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by_id?: number;
}

export interface StockAlertSummary {
  total_alerts: number;
  critical_alerts: number;
  high_priority_alerts: number;
  unacknowledged_alerts: number;
  alerts_by_type: Record<string, number>;
}

// ===== REPORTES DE MOVIMIENTOS =====
export interface MovementReport {
  supply_id: number;
  supply_name: string;
  total_entries: number;
  total_exits: number;
  net_movement: number;
  movement_frequency: number;
  average_daily_usage: number;
  peak_usage_day?: string;
  movement_trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MovementSummary {
  period: string;
  total_movements: number;
  total_entries: number;
  total_exits: number;
  most_active_supplies: SupplyMinimal[];
  busiest_days: Array<{
    date: string;
    movement_count: number;
  }>;
}

// ===== PREDICCIONES Y ANÁLISIS =====
export interface StockPrediction {
  supply_id: number;
  supply_name: string;
  current_stock: number;
  predicted_stock_out_date?: string;
  days_until_stock_out?: number;
  recommended_order_quantity?: number;
  confidence_level: number;
  based_on_days: number;
}

export interface UsagePattern {
  supply_id: number;
  daily_average: number;
  weekly_average: number;
  monthly_average: number;
  seasonal_variation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: 'low' | 'medium' | 'high';
}

// ===== TIPOS DE EXPORT =====
export interface SupplyExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  include_movements?: boolean;
  include_predictions?: boolean;
  filters?: SupplySearchParams;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface MovementExportRequest {
  format: 'csv' | 'excel';
  supply_ids?: number[];
  movement_type_ids?: number[];
  date_range: {
    start_date: string;
    end_date: string;
  };
  include_user_details?: boolean;
}

// ===== TIPOS DE CONFIGURACIÓN =====
export interface SupplyConfig {
  auto_generate_codigo: boolean;
  codigo_prefix: string;
  default_stock_minimum: number;
  enable_stock_predictions: boolean;
  low_stock_threshold_percentage: number;
  critical_stock_threshold_percentage: number;
  require_movement_notes: boolean;
  enable_location_tracking: boolean;
}

// ===== VALIDACIÓN =====
export interface SupplyValidationError {
  field: string;
  message: string;
  code: string;
}

export interface StockValidationResponse {
  is_valid: boolean;
  errors: SupplyValidationError[];
  warnings?: string[];
  stock_impact?: {
    before: number;
    after: number;
    difference: number;
  };
}

// ===== OPERACIONES BULK =====
export interface BulkSupplyUpdateRequest {
  supply_ids: number[];
  updates: SupplyUpdateRequest;
}

export interface BulkMovementCreateRequest {
  movements: SupplyMovementCreateRequest[];
  batch_notes?: string;
}

// ===== UNION TYPES PARA RESPUESTAS =====
export type SupplyFormattedResponse = 
  | SupplyListItem[]
  | SupplyDropdownOption[]
  | SupplyMinimal[]
  | SupplyWithDetails[];

// ===== HELPERS DE TIPO =====
export type SupplyCreateData = Omit<SupplyCreateRequest, 'created_by_id'>;
export type SupplyUpdateData = Omit<SupplyUpdateRequest, 'updated_by_id'>;
export type MovementCreateData = Omit<SupplyMovementCreateRequest, 'created_by_id'>;

// ===== TIPOS DE ESTADO DE COMPONENTE =====
export interface SupplyComponentState {
  selectedSupply: SupplyWithDetails | null;
  viewMode: 'table' | 'cards' | 'list';
  filters: SupplySearchParams;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  selectedIds: number[];
  showLowStockOnly: boolean;
  isLoading: boolean;
  error: string | null;
}

// ===== TIPOS DE NOTIFICACIONES =====
export interface StockNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'movement_required' | 'approval_needed';
  supply_id: number;
  supply_name: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  created_at: string;
  read_at?: string;
  action_required: boolean;
  action_url?: string;
}

// ===== TIPOS DE WORKFLOW =====
export interface StockWorkflow {
  id: number;
  name: string;
  description: string;
  trigger_conditions: {
    stock_level?: number;
    movement_type?: string;
    quantity_threshold?: number;
  };
  actions: {
    notify_users?: number[];
    create_purchase_request?: boolean;
    auto_adjust_minimum?: boolean;
    send_email?: boolean;
  };
  is_active: boolean;
}

// ===== INTEGRACIÓN CON OTROS MÓDULOS =====
export interface PurchaseRequest {
  id: number;
  supply_id: number;
  requested_quantity: number;
  estimated_cost?: number;
  justification: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requested_by_id: number;
  approved_by_id?: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';
  created_at: string;
}

export interface SupplyWithPurchaseInfo extends SupplyWithDetails {
  pending_purchases?: PurchaseRequest[];
  last_purchase_date?: string;
  average_cost_per_unit?: number;
  total_cost_last_year?: number;
}