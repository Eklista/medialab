// frontend/src/services/inventory/index.ts

// ===== EXPORTACIONES DE TIPOS =====
export type {
  // Common types
  InventoryCategory,
  InventoryLocation,
  Supplier,
  EquipmentState,
  MovementType,
  InventoryMetrics,
  InventoryDashboardResponse,
  SearchFilters,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  LocationCreateRequest,
  LocationUpdateRequest,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  FormatType,
  BulkOperationResponse,
  
  // Equipment types
  Equipment,
  EquipmentWithDetails,
  EquipmentLab,
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  EquipmentSearchParams,
  EquipmentSearchResponse,
  EquipmentListItem,
  EquipmentDropdownOption,
  EquipmentMinimal,
  AssignmentRequest,
  AssignmentHistory,
  EquipmentMetrics,
  
  // Supply types
  Supply,
  SupplyWithDetails,
  SupplyMovement,
  SupplyMovementWithDetails,
  SupplyCreateRequest,
  SupplyUpdateRequest,
  SupplyMovementCreateRequest,
  SupplySearchParams,
  SupplySearchResponse,
  SupplyStockResponse,
  SupplyListItem,
  SupplyDropdownOption,
  SupplyMinimal,
  StockStatus,
  StockAlert,
  MovementReport,
  StockPrediction,
  
  // Pagination and search
  PaginationParams,
  PaginatedResponse,
  BaseSearchParams,
  SortDirection,
  
  // State types
  LoadingState,
  AsyncOperationState
} from './types';

// ===== EXPORTACIONES DE SERVICIOS API =====
export {
  // API principal
  inventoryApi,
  
  // Servicios individuales
  InventoryDashboardService,
  EquipmentService,
  SuppliesService,
  InventorySearchService,
  InventoryCommonService
} from './inventoryApi';

// ===== EXPORTACIONES DE HOOKS =====
export {
  // Dashboard hooks
  useInventoryDashboard,
  
  // Equipment hooks
  useEquipmentList,
  useEquipmentDetails,
  
  // Supply hooks
  useSuppliesList,
  useSupplyDetails,
  
  // Common data hooks
  useInventoryCommon,
  
  // Search hooks
  useInventorySearch
} from './hooks';

// ===== IMPORTACIONES PARA UTILIDADES =====
import { inventoryApi } from './inventoryApi';
import type { FormatType } from './types';

// ===== UTILIDADES Y HELPERS =====
export const inventoryUtils = {
  /**
   * Formatea un código de equipo para mostrar
   */
  formatEquipmentCode: (codigo?: string): string => {
    if (!codigo) return 'Sin código';
    return codigo.toUpperCase();
  },

  /**
   * Obtiene el color para el estado de stock
   */
  getStockStatusColor: (status: string): string => {
    const colors = {
      'ok': 'green',
      'low': 'yellow', 
      'critical': 'orange',
      'out': 'red'
    };
    return colors[status as keyof typeof colors] || 'gray';
  },

  /**
   * Formatea la cantidad de stock
   */
  formatStockQuantity: (current: number, minimum: number): string => {
    const percentage = minimum > 0 ? (current / minimum) * 100 : 100;
    return `${current} (${percentage.toFixed(0)}% del mínimo)`;
  },

  /**
   * Calcula el estado de stock basado en cantidad actual y mínima
   */
  calculateStockStatus: (current: number, minimum: number): string => {
    if (current <= 0) return 'out';
    if (current <= minimum * 0.5) return 'critical';
    if (current <= minimum) return 'low';
    return 'ok';
  },

  /**
   * Formatea fecha para mostrar en español
   */
  formatInventoryDate: (dateString?: string): string => {
    if (!dateString) return 'No disponible';
    
    try {
      return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  },

  /**
   * Obtiene el ícono para el tipo de equipo
   */
  getEquipmentIcon: (categoryName: string): string => {
    const icons = {
      'PC': '💻',
      'Monitor': '🖥️',
      'Fuente': '🔌',
      'Memoria': '🧠',
      'Mouse': '🖱️',
      'Teclado': '⌨️',
      'Cable': '🔗',
      'Router': '📡',
      'Switch': '🔄'
    };
    return icons[categoryName as keyof typeof icons] || '📦';
  },

  /**
   * Obtiene el ícono para el tipo de movimiento
   */
  getMovementIcon: (movementType: string): string => {
    const icons = {
      'ENTRADA': '📥',
      'SALIDA': '📤',
      'AJUSTE': '⚖️',
      'TRANSFERENCIA': '🔄',
      'DEVOLUCIÓN': '↩️'
    };
    return icons[movementType as keyof typeof icons] || '📋';
  },

  /**
   * Valida formato de código de equipo
   */
  validateEquipmentCode: (code: string): boolean => {
    // Formato esperado: PC-0001, MON-0045, etc.
    const pattern = /^[A-Z]{2,4}-\d{4}$/;
    return pattern.test(code);
  },

  /**
   * Genera sugerencias de códigos de equipo
   */
  generateEquipmentCodeSuggestion: (categoryName: string, existingCodes: string[]): string => {
    const prefix = categoryName.substring(0, 3).toUpperCase();
    const numbers = existingCodes
      .filter(code => code.startsWith(prefix))
      .map(code => {
        const match = code.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(num => !isNaN(num));
    
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  },

  /**
   * Calcula métricas básicas para una lista de equipos
   */
  calculateEquipmentMetrics: (equipment: any[]): {
    total: number;
    operational: number;
    assigned: number;
    available: number;
  } => {
    return {
      total: equipment.length,
      operational: equipment.filter(eq => eq.state?.is_operational).length,
      assigned: equipment.filter(eq => eq.assigned_user_id).length,
      available: equipment.filter(eq => eq.state?.is_operational && !eq.assigned_user_id).length
    };
  },

  /**
   * Calcula métricas básicas para una lista de suministros
   */
  calculateSupplyMetrics: (supplies: any[]): {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  } => {
    return {
      total: supplies.length,
      lowStock: supplies.filter(sup => sup.stock_actual <= sup.stock_minimo).length,
      outOfStock: supplies.filter(sup => sup.stock_actual <= 0).length,
      totalValue: supplies.reduce((sum, sup) => sum + (sup.stock_actual * (sup.cost_per_unit || 0)), 0)
    };
  }
};

// ===== CONSTANTES ÚTILES =====
export const INVENTORY_CONSTANTS = {
  // Códigos de estado de stock
  STOCK_STATUS: {
    OK: 'ok',
    LOW: 'low', 
    CRITICAL: 'critical',
    OUT: 'out'
  } as const,

  // Tipos de formato para listas
  FORMAT_TYPES: {
    MINIMAL: 'minimal',
    LIST: 'list',
    DROPDOWN: 'dropdown',
    SEARCH: 'search',
    WITH_DETAILS: 'with_details'
  } as const,

  // Límites de paginación
  PAGINATION: {
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
    DEFAULT_SKIP: 0
  } as const,

  // Colores para estados
  COLORS: {
    STOCK_OK: '#10B981',      // green-500
    STOCK_LOW: '#F59E0B',     // amber-500
    STOCK_CRITICAL: '#EF4444', // red-500
    STOCK_OUT: '#991B1B',     // red-800
    OPERATIONAL: '#10B981',   // green-500
    NON_OPERATIONAL: '#EF4444', // red-500
    ASSIGNED: '#3B82F6',      // blue-500
    AVAILABLE: '#6B7280'      // gray-500
  } as const,

  // Endpoints principales
  ENDPOINTS: {
    DASHBOARD: '/inventory/dashboard',
    EQUIPMENT: '/inventory/equipment',
    SUPPLIES: '/inventory/supplies',
    SEARCH: '/inventory/search',
    COMMON: '/inventory/common'
  } as const
};

// ===== CONFIGURACIÓN POR DEFECTO =====
export const defaultInventoryConfig = {
  // Configuración de lista de equipos
  equipment: {
    defaultLimit: 25,
    defaultFormatType: 'list' as FormatType,
    autoRefreshInterval: 300000, // 5 minutos
    enableRealTimeUpdates: false
  },

  // Configuración de lista de suministros
  supplies: {
    defaultLimit: 25,
    defaultFormatType: 'list' as FormatType,
    lowStockThreshold: 0.2, // 20% del stock mínimo
    criticalStockThreshold: 0.1, // 10% del stock mínimo
    autoRefreshInterval: 180000 // 3 minutos
  },

  // Configuración de dashboard
  dashboard: {
    refreshInterval: 120000, // 2 minutos
    maxRecentActivities: 10,
    enableNotifications: true
  },

  // Configuración de búsqueda
  search: {
    minQueryLength: 2,
    debounceMs: 300,
    maxResults: 50
  }
};

// ===== VALIDADORES =====
export const inventoryValidators = {
  /**
   * Valida datos de equipo antes de enviar
   */
  validateEquipmentData: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.category_id) errors.push('Categoría es requerida');
    if (!data.state_id) errors.push('Estado es requerido');
    if (!data.location_id) errors.push('Ubicación es requerida');
    
    if (data.codigo_ug && !inventoryUtils.validateEquipmentCode(data.codigo_ug)) {
      errors.push('Formato de código inválido (ejemplo: PC-0001)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valida datos de suministro antes de enviar
   */
  validateSupplyData: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nombre_producto?.trim()) errors.push('Nombre del producto es requerido');
    if (!data.category_id) errors.push('Categoría es requerida');
    if (data.stock_actual < 0) errors.push('Stock actual no puede ser negativo');
    if (data.stock_minimo < 0) errors.push('Stock mínimo no puede ser negativo');

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valida datos de movimiento de stock
   */
  validateMovementData: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.supply_id) errors.push('Suministro es requerido');
    if (!data.movement_type_id) errors.push('Tipo de movimiento es requerido');
    if (!data.cantidad || data.cantidad <= 0) errors.push('Cantidad debe ser mayor a 0');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Export default para uso simple
export default {
  api: inventoryApi,
  utils: inventoryUtils,
  constants: INVENTORY_CONSTANTS,
  config: defaultInventoryConfig,
  validators: inventoryValidators
};