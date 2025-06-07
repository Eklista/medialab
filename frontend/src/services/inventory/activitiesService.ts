// frontend/src/services/inventory/activitiesService.ts

import apiClient, { createCacheKey, requestDeduplicator } from '../api';
import { handleApiError } from '../api';

// ===== TIPOS =====
export interface ActivityItem {
  id: string;
  type: 'equipment' | 'supply' | 'movement' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned' | 'moved' | 'adjusted' | 'repaired' | 'low_stock' | 'stock_in' | 'stock_out';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  entity?: {
    id: number;
    name: string;
    type: string;
  };
  metadata?: {
    oldValue?: any;
    newValue?: any;
    location?: string;
    category?: string;
    quantity?: number;
    currentStock?: number;
    minimumStock?: number;
    movementType?: string;
    shipmentNumber?: string;
  };
  status?: 'success' | 'warning' | 'error' | 'pending';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Campos procesados por el backend
  display?: {
    icon: string;
    primary_color: string;
    status_color: string;
    badge_text: string;
    summary: string;
    details: string;
  };
  relative_time?: string;
  ui?: {
    priority_class: string;
    status_class: string;
    clickable: boolean;
    show_metadata: boolean;
    show_user: boolean;
    compact_mode: boolean;
  };
}

export interface ActivityFeedResponse {
  activities: ActivityItem[];
  total: number;
  stats: {
    equipment_created: number;
    equipment_assigned: number;
    stock_movements: number;
    low_stock_alerts: number;
    period_days: number;
  };
  filters: {
    days_back: number;
    activity_types: string | string[];
    user_id?: number;
  };
  pagination: {
    limit: number;
    has_more: boolean;
  };
  timestamp: string;
}

export interface ActivityType {
  value: string;
  label: string;
  category: string;
  icon: string;
  color: string;
}

export interface ActivitySummaryResponse {
  today: {
    equipment_created: number;
    equipment_assigned: number;
    stock_movements: number;
  };
  this_week: {
    equipment_created: number;
    equipment_assigned: number;
    stock_movements: number;
  };
  alerts: {
    low_stock_count: number;
  };
  recent_highlights: Array<{
    title: string;
    type: string;
    priority: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface ActivityFilters {
  limit?: number;
  activity_types?: string;
  user_id?: number;
  days_back?: number;
}

// ===== SERVICIO API =====
class ActivitiesApiService {
  private static readonly BASE_PATH = '/inventory/activities';

  /**
   * Obtiene el feed de actividades
   */
  static async getActivityFeed(filters: ActivityFilters = {}): Promise<ActivityFeedResponse> {
    const { limit = 50, activity_types, user_id, days_back = 30 } = filters;
    
    const cacheKey = createCacheKey(`${this.BASE_PATH}`, filters);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const params = new URLSearchParams();
      
      params.append('limit', limit.toString());
      params.append('days_back', days_back.toString());
      
      if (activity_types) {
        params.append('activity_types', activity_types);
      }
      
      if (user_id) {
        params.append('user_id', user_id.toString());
      }
      
      const response = await apiClient.get(`${this.BASE_PATH}?${params.toString()}`);
      return response.data;
    });
  }

  /**
   * Obtiene tipos de actividades disponibles
   */
  static async getActivityTypes(): Promise<ActivityType[]> {
    const cacheKey = createCacheKey(`${this.BASE_PATH}/types`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${this.BASE_PATH}/types`);
      return response.data;
    });
  }

  /**
   * Obtiene resumen de actividades para dashboard
   */
  static async getActivitySummary(): Promise<ActivitySummaryResponse> {
    const cacheKey = createCacheKey(`${this.BASE_PATH}/summary`);
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const response = await apiClient.get(`${this.BASE_PATH}/summary`);
      return response.data;
    });
  }

  /**
   * Marca una actividad como leída
   */
  static async markActivityAsRead(activityId: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.post(`${this.BASE_PATH}/${activityId}/read`);
      return { success: true, message: 'Actividad marcada como leída' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }
}

// ===== SERVICIO CON MANEJO DE ERRORES =====
export class ActivitiesService {
  
  /**
   * Obtiene feed de actividades con manejo de errores
   */
  static async getActivityFeed(filters: ActivityFilters = {}) {
    try {
      const response = await ActivitiesApiService.getActivityFeed(filters);
      
      return {
        success: true,
        data: response,
        message: `${response.total} actividades obtenidas exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en ActivitiesService.getActivityFeed:', errorMessage);
      
      return {
        success: false,
        data: {
          activities: [],
          total: 0,
          stats: {
            equipment_created: 0,
            equipment_assigned: 0,
            stock_movements: 0,
            low_stock_alerts: 0,
            period_days: 30
          },
          filters: filters,
          pagination: { limit: filters.limit || 50, has_more: false },
          timestamp: new Date().toISOString()
        },
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene tipos de actividades
   */
  static async getActivityTypes() {
    try {
      const types = await ActivitiesApiService.getActivityTypes();
      
      return {
        success: true,
        data: types,
        message: `${types.length} tipos de actividades disponibles`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en ActivitiesService.getActivityTypes:', errorMessage);
      
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene resumen de actividades
   */
  static async getActivitySummary() {
    try {
      const summary = await ActivitiesApiService.getActivitySummary();
      
      return {
        success: true,
        data: summary,
        message: 'Resumen de actividades obtenido exitosamente'
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en ActivitiesService.getActivitySummary:', errorMessage);
      
      return {
        success: false,
        data: {
          today: { equipment_created: 0, equipment_assigned: 0, stock_movements: 0 },
          this_week: { equipment_created: 0, equipment_assigned: 0, stock_movements: 0 },
          alerts: { low_stock_count: 0 },
          recent_highlights: [],
          timestamp: new Date().toISOString()
        },
        error: errorMessage
      };
    }
  }

  /**
   * Marca actividad como leída
   */
  static async markAsRead(activityId: string) {
    try {
      await ActivitiesApiService.markActivityAsRead(activityId);
      
      return {
        success: true,
        message: 'Actividad marcada como leída'
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en ActivitiesService.markAsRead:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Export por defecto
export default ActivitiesService;