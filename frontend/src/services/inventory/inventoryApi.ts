// frontend/src/services/inventory/inventoryApi.ts - ACTUALIZACIÓN COMPLETA

import apiClient, { createCacheKey, requestDeduplicator } from '../api';
import type {
  // Common types
  InventoryDashboardResponse,
  SearchFilters,
  InventoryCategory,
  InventoryLocation,
  Supplier,
  EquipmentState,
  MovementType,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  LocationCreateRequest,
  LocationUpdateRequest,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  // Equipment types
  EquipmentWithDetails,
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  EquipmentSearchParams,
  EquipmentSearchResponse,
  AssignmentRequest,
  // Supply types
  SupplyWithDetails,
  SupplyCreateRequest,
  SupplyUpdateRequest,
  SupplySearchParams,
  SupplySearchResponse,
  SupplyStockResponse,
  // Generic types
  FormatType
} from './types';

// ===== CONFIGURACIÓN BASE =====
const API_BASE = '/inventory';

// ===== DASHBOARD SERVICE =====
class InventoryDashboardService {
  /**
   * Obtiene datos completos del dashboard de inventario
   */
  static async getDashboardData(): Promise<InventoryDashboardResponse> {
    const cacheKey = createCacheKey(`${API_BASE}/dashboard`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/dashboard`);
      return response.data;
    });
  }

  /**
   * Obtiene estadísticas rápidas
   */
  static async getQuickStats(): Promise<any> {
    const cacheKey = createCacheKey(`${API_BASE}/dashboard/stats`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/dashboard/stats`);
      return response.data;
    });
  }
}

// ===== EQUIPMENT SERVICE =====
class EquipmentService {
  /**
   * Obtiene lista de equipos
   */
  static async getEquipmentList(params: {
    skip?: number;
    limit?: number;
    format_type?: FormatType;
  } = {}): Promise<any> {
    const { skip = 0, limit = 25, format_type = 'list' } = params;
    const cacheKey = createCacheKey(`${API_BASE}/equipment`, params);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/equipment`, {
        params: { skip, limit, format_type }
      });
      return response.data;
    });
  }

  /**
   * Busca equipos con filtros avanzados
   */
  static async searchEquipment(params: EquipmentSearchParams): Promise<EquipmentSearchResponse> {
    const response = await apiClient.get(`${API_BASE}/equipment/search`, {
      params
    });
    return response.data;
  }

  /**
   * Obtiene un equipo específico por ID
   */
  static async getEquipmentById(id: number): Promise<EquipmentWithDetails> {
    const cacheKey = createCacheKey(`${API_BASE}/equipment/${id}`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/equipment/${id}`);
      return response.data;
    });
  }

  /**
   * Crea un nuevo equipo
   */
  static async createEquipment(data: EquipmentCreateRequest): Promise<EquipmentWithDetails> {
    const response = await apiClient.post(`${API_BASE}/equipment`, data);
    return response.data;
  }

  /**
   * Actualiza un equipo existente
   */
  static async updateEquipment(id: number, data: EquipmentUpdateRequest): Promise<EquipmentWithDetails> {
    const response = await apiClient.patch(`${API_BASE}/equipment/${id}`, data);
    return response.data;
  }

  /**
   * Elimina un equipo
   */
  static async deleteEquipment(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/equipment/${id}`);
    return response.data;
  }

  /**
   * Asigna un equipo a un usuario
   */
  static async assignEquipment(id: number, assignmentData: AssignmentRequest): Promise<EquipmentWithDetails> {
    const response = await apiClient.post(`${API_BASE}/equipment/${id}/assign`, assignmentData);
    return response.data;
  }

  /**
   * Desasigna un equipo
   */
  static async unassignEquipment(id: number): Promise<EquipmentWithDetails> {
    const response = await apiClient.post(`${API_BASE}/equipment/${id}/unassign`);
    return response.data;
  }
}

// ===== SUPPLIES SERVICE =====
class SuppliesService {
  /**
   * Obtiene lista de suministros
   */
  static async getSuppliesList(params: {
    skip?: number;
    limit?: number;
    format_type?: FormatType;
  } = {}): Promise<any> {
    const { skip = 0, limit = 25, format_type = 'list' } = params;
    const cacheKey = createCacheKey(`${API_BASE}/supplies`, params);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/supplies`, {
        params: { skip, limit, format_type }
      });
      return response.data;
    });
  }

  /**
   * Busca suministros con filtros
   */
  static async searchSupplies(params: SupplySearchParams): Promise<SupplySearchResponse> {
    const response = await apiClient.get(`${API_BASE}/supplies/search`, {
      params
    });
    return response.data;
  }

  /**
   * Obtiene un suministro específico por ID
   */
  static async getSupplyById(id: number): Promise<SupplyWithDetails> {
    const cacheKey = createCacheKey(`${API_BASE}/supplies/${id}`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/supplies/${id}`);
      return response.data;
    });
  }

  /**
   * Crea un nuevo suministro
   */
  static async createSupply(data: SupplyCreateRequest): Promise<SupplyWithDetails> {
    const response = await apiClient.post(`${API_BASE}/supplies`, data);
    return response.data;
  }

  /**
   * Actualiza un suministro existente
   */
  static async updateSupply(id: number, data: SupplyUpdateRequest): Promise<SupplyWithDetails> {
    const response = await apiClient.patch(`${API_BASE}/supplies/${id}`, data);
    return response.data;
  }

  /**
   * Elimina un suministro
   */
  static async deleteSupply(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/supplies/${id}`);
    return response.data;
  }

  /**
   * Crea un movimiento de suministro (entrada/salida)
   */
  static async createSupplyMovement(params: {
    supply_id: number;
    movement_type_id: number;
    cantidad: number;
    numero_envio?: string;
    user_receives_id?: number;
    user_delivers_to_id?: number;
    observaciones?: string;
  }): Promise<any> {
    const { supply_id, ...movementData } = params;
    
    const response = await apiClient.post(`${API_BASE}/supplies/${supply_id}/movements`, movementData);
    return response.data;
  }

  /**
   * Obtiene el estado del stock de un suministro
   */
  static async getSupplyStockStatus(id: number): Promise<SupplyStockResponse> {
    const response = await apiClient.get(`${API_BASE}/supplies/${id}/stock`);
    return response.data;
  }

  /**
   * Obtiene suministros con stock bajo
   */
  static async getLowStockSupplies(limit: number = 50): Promise<SupplyWithDetails[]> {
    const cacheKey = createCacheKey(`${API_BASE}/supplies/low-stock`, { limit });
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/supplies/low-stock`, {
        params: { limit }
      });
      return response.data;
    });
  }
}

// ===== SEARCH SERVICE =====
class InventorySearchService {
  /**
   * Búsqueda unificada en todo el inventario
   */
  static async unifiedSearch(params: {
    q: string;
    search_type?: 'equipment' | 'supplies' | 'all';
    limit?: number;
  }): Promise<any> {
    const { q, search_type = 'all', limit = 50 } = params;
    
    const response = await apiClient.get(`${API_BASE}/search/unified`, {
      params: { q, search_type, limit }
    });
    return response.data;
  }

  /**
   * Obtiene filtros disponibles para búsquedas
   */
  static async getSearchFilters(): Promise<SearchFilters> {
    const cacheKey = createCacheKey(`${API_BASE}/search/filters`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/search/filters`);
      return response.data;
    });
  }
}

// ===== COMMON DATA SERVICE - ACTUALIZADO CON CRUD COMPLETO =====
class InventoryCommonService {
  // ===== CATEGORÍAS =====
  
  /**
   * Obtiene categorías
   */
  static async getCategories(equipmentOnly: boolean = false): Promise<InventoryCategory[]> {
    const cacheKey = createCacheKey(`${API_BASE}/common/categories`, { equipment_only: equipmentOnly });
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/common/categories`, {
        params: { equipment_only: equipmentOnly }
      });
      return response.data;
    });
  }

  /**
   * Crea una nueva categoría
   */
  static async createCategory(data: CategoryCreateRequest): Promise<InventoryCategory> {
    const response = await apiClient.post(`${API_BASE}/common/categories`, data);
    return response.data;
  }

  /**
   * Actualiza una categoría existente
   */
  static async updateCategory(id: number, data: CategoryUpdateRequest): Promise<InventoryCategory> {
    const response = await apiClient.patch(`${API_BASE}/common/categories/${id}`, data);
    return response.data;
  }

  /**
   * Elimina una categoría
   */
  static async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/common/categories/${id}`);
    return response.data;
  }

  // ===== UBICACIONES =====

  /**
   * Obtiene ubicaciones
   */
  static async getLocations(internalOnly: boolean = false): Promise<InventoryLocation[]> {
    const cacheKey = createCacheKey(`${API_BASE}/common/locations`, { internal_only: internalOnly });
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/common/locations`, {
        params: { internal_only: internalOnly }
      });
      return response.data;
    });
  }

  /**
   * Crea una nueva ubicación
   */
  static async createLocation(data: LocationCreateRequest): Promise<InventoryLocation> {
    const response = await apiClient.post(`${API_BASE}/common/locations`, data);
    return response.data;
  }

  /**
   * Actualiza una ubicación existente
   */
  static async updateLocation(id: number, data: LocationUpdateRequest): Promise<InventoryLocation> {
    const response = await apiClient.patch(`${API_BASE}/common/locations/${id}`, data);
    return response.data;
  }

  /**
   * Elimina una ubicación
   */
  static async deleteLocation(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/common/locations/${id}`);
    return response.data;
  }

  // ===== PROVEEDORES =====

  /**
   * Obtiene proveedores
   */
  static async getSuppliers(): Promise<Supplier[]> {
    const cacheKey = createCacheKey(`${API_BASE}/common/suppliers`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/common/suppliers`);
      return response.data;
    });
  }

  /**
   * Crea un nuevo proveedor
   */
  static async createSupplier(data: SupplierCreateRequest): Promise<Supplier> {
    const response = await apiClient.post(`${API_BASE}/common/suppliers`, data);
    return response.data;
  }

  /**
   * Actualiza un proveedor existente
   */
  static async updateSupplier(id: number, data: SupplierUpdateRequest): Promise<Supplier> {
    const response = await apiClient.patch(`${API_BASE}/common/suppliers/${id}`, data);
    return response.data;
  }

  /**
   * Elimina un proveedor
   */
  static async deleteSupplier(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/common/suppliers/${id}`);
    return response.data;
  }

  // ===== ESTADOS DE EQUIPOS (SOLO READ - NO SE PERMITEN MODIFICACIONES DESDE UI) =====

  /**
   * Obtiene estados de equipos
   */
  static async getEquipmentStates(operationalOnly: boolean = false): Promise<EquipmentState[]> {
    const cacheKey = createCacheKey(`${API_BASE}/common/equipment-states`, { operational_only: operationalOnly });
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/common/equipment-states`, {
        params: { operational_only: operationalOnly }
      });
      return response.data;
    });
  }

  // ===== TIPOS DE MOVIMIENTO (SOLO READ - NO SE PERMITEN MODIFICACIONES DESDE UI) =====

  /**
   * Obtiene tipos de movimiento
   */
  static async getMovementTypes(): Promise<MovementType[]> {
    const cacheKey = createCacheKey(`${API_BASE}/common/movement-types`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/common/movement-types`);
      return response.data;
    });
  }
}

// ===== ACTIVITIES SERVICE =====
class InventoryActivitiesService {
  /**
   * Obtiene feed de actividades
   */
  static async getActivityFeed(params: {
    limit?: number;
    activity_types?: string;
    user_id?: number;
    days_back?: number;
  } = {}): Promise<any> {
    const { limit = 50, activity_types, user_id, days_back = 30 } = params;
    const cacheKey = createCacheKey(`${API_BASE}/activities`, params);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('limit', limit.toString());
      searchParams.append('days_back', days_back.toString());
      
      if (activity_types) {
        searchParams.append('activity_types', activity_types);
      }
      
      if (user_id) {
        searchParams.append('user_id', user_id.toString());
      }
      
      const response = await apiClient.get(`${API_BASE}/activities?${searchParams.toString()}`);
      return response.data;
    });
  }

  /**
   * Obtiene tipos de actividades disponibles
   */
  static async getActivityTypes(): Promise<any> {
    const cacheKey = createCacheKey(`${API_BASE}/activities/types`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/activities/types`);
      return response.data;
    });
  }

  /**
   * Obtiene resumen de actividades
   */
  static async getActivitySummary(): Promise<any> {
    const cacheKey = createCacheKey(`${API_BASE}/activities/summary`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${API_BASE}/activities/summary`);
      return response.data;
    });
  }

  /**
   * Marca actividad como leída
   */
  static async markActivityAsRead(activityId: string): Promise<any> {
    const response = await apiClient.post(`${API_BASE}/activities/${activityId}/read`);
    return response.data;
  }
}

// ===== API PRINCIPAL CONSOLIDADA =====
export const inventoryApi = {
  dashboard: InventoryDashboardService,
  equipment: EquipmentService,
  supplies: SuppliesService,
  search: InventorySearchService,
  common: InventoryCommonService,
  activities: InventoryActivitiesService
};

// Export individual services para flexibilidad
export {
  InventoryDashboardService,
  EquipmentService,
  SuppliesService,
  InventorySearchService,
  InventoryCommonService,
  InventoryActivitiesService
};

// Export default para uso simple
export default inventoryApi;