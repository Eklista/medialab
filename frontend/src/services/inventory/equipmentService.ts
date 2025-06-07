// frontend/src/services/inventory/equipmentService.ts

import { EquipmentService as EquipmentApiService } from './inventoryApi';
import { handleApiError } from '../api';
import type {
  EquipmentWithDetails,
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  EquipmentSearchParams,
  AssignmentRequest,
  FormatType
} from './types';

/**
 * Servicio de equipos con manejo de errores y transformación de datos
 */
export class EquipmentService {
  
  /**
   * Obtiene lista de equipos con formato específico
   */
  static async getList(params: {
    skip?: number;
    limit?: number;
    formatType?: FormatType;
  } = {}) {
    try {
      const { skip = 0, limit = 25, formatType = 'list' } = params;
      
      const equipment = await EquipmentApiService.getEquipmentList({
        skip,
        limit,
        format_type: formatType
      });
      
      return {
        success: true,
        data: equipment,
        total: equipment.length,
        message: `${equipment.length} equipos obtenidos exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.getList:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Busca equipos con filtros avanzados
   */
  static async search(params: EquipmentSearchParams) {
    try {
      const results = await EquipmentApiService.searchEquipment(params);
      
      return {
        success: true,
        data: results.results,
        total: results.total_found,
        hasMore: results.has_more,
        nextCursor: results.next_cursor,
        message: `${results.total_found} equipos encontrados`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.search:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un equipo por ID
   */
  static async getById(id: number): Promise<{
    success: boolean;
    data?: EquipmentWithDetails;
    error?: string;
  }> {
    try {
      const equipment = await EquipmentApiService.getEquipmentById(id);
      
      return {
        success: true,
        data: equipment
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en EquipmentService.getById(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo equipo
   */
  static async create(data: EquipmentCreateRequest): Promise<{
    success: boolean;
    data?: EquipmentWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      // Validaciones básicas
      if (!data.category_id) {
        throw new Error('La categoría es requerida');
      }
      if (!data.state_id) {
        throw new Error('El estado es requerido');
      }
      if (!data.location_id) {
        throw new Error('La ubicación es requerida');
      }

      const equipment = await EquipmentApiService.createEquipment(data);
      
      return {
        success: true,
        data: equipment,
        message: `Equipo ${equipment.codigo_ug || equipment.id} creado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.create:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un equipo existente
   */
  static async update(id: number, data: EquipmentUpdateRequest): Promise<{
    success: boolean;
    data?: EquipmentWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      const equipment = await EquipmentApiService.updateEquipment(id, data);
      
      return {
        success: true,
        data: equipment,
        message: `Equipo ${equipment.codigo_ug || equipment.id} actualizado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en EquipmentService.update(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un equipo
   */
  static async delete(id: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const result = await EquipmentApiService.deleteEquipment(id);
      
      return {
        success: true,
        message: result.message || `Equipo ${id} eliminado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en EquipmentService.delete(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Asigna un equipo a un usuario
   */
  static async assign(equipmentId: number, userId: number, notes?: string): Promise<{
    success: boolean;
    data?: EquipmentWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      const assignmentData: AssignmentRequest = {
        user_id: userId,
        notes
      };

      const equipment = await EquipmentApiService.assignEquipment(equipmentId, assignmentData);
      
      return {
        success: true,
        data: equipment,
        message: `Equipo ${equipment.codigo_ug || equipment.id} asignado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en EquipmentService.assign(${equipmentId}, ${userId}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Desasigna un equipo
   */
  static async unassign(equipmentId: number): Promise<{
    success: boolean;
    data?: EquipmentWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      const equipment = await EquipmentApiService.unassignEquipment(equipmentId);
      
      return {
        success: true,
        data: equipment,
        message: `Equipo ${equipment.codigo_ug || equipment.id} desasignado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en EquipmentService.unassign(${equipmentId}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene equipos disponibles para asignación
   */
  static async getAvailable(limit: number = 50) {
    try {
      const results = await EquipmentApiService.searchEquipment({
        operational_only: true,
        unassigned_only: true,
        limit
      });
      
      return {
        success: true,
        data: results.results,
        total: results.total_found,
        message: `${results.total_found} equipos disponibles`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.getAvailable:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene equipos que necesitan mantenimiento
   */
  static async getNeedingMaintenance(limit: number = 50) {
    try {
      const results = await EquipmentApiService.searchEquipment({
        operational_only: false,
        limit
      });
      
      // Filtrar solo los no operativos (en la implementación real esto vendría del backend)
      const needingMaintenance = results.results.filter(eq => 
        !eq.state?.is_operational
      );
      
      return {
        success: true,
        data: needingMaintenance,
        total: needingMaintenance.length,
        message: `${needingMaintenance.length} equipos necesitan mantenimiento`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.getNeedingMaintenance:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Operaciones en lote
   */
  static async bulkAssign(equipmentIds: number[], userId: number, notes?: string): Promise<{
    success: boolean;
    successfulCount: number;
    failedCount: number;
    errors: string[];
    message?: string;
  }> {
    const results = {
      success: true,
      successfulCount: 0,
      failedCount: 0,
      errors: [] as string[]
    };

    for (const equipmentId of equipmentIds) {
      try {
        await this.assign(equipmentId, userId, notes);
        results.successfulCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push(`Equipo ${equipmentId}: ${handleApiError(error)}`);
      }
    }

    if (results.failedCount > 0) {
      results.success = false;
    }

    return {
      ...results,
      message: `${results.successfulCount} equipos asignados, ${results.failedCount} fallos`
    };
  }

  /**
   * Obtiene estadísticas rápidas de equipos
   */
  static async getStats() {
    try {
      // En una implementación real, esto vendría de un endpoint específico
      const allEquipment = await this.getList({ limit: 1000 });
      
      if (!allEquipment.success) {
        throw new Error(allEquipment.error);
      }

      const equipment = allEquipment.data;
      const stats = {
        total: equipment.length,
        operational: equipment.filter((eq: any) => eq.state?.is_operational).length,
        assigned: equipment.filter((eq: any) => eq.assigned_user_id).length,
        available: equipment.filter((eq: any) => eq.state?.is_operational && !eq.assigned_user_id).length,
        needingMaintenance: equipment.filter((eq: any) => !eq.state?.is_operational).length
      };

      return {
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas exitosamente'
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en EquipmentService.getStats:', errorMessage);
      
      return {
        success: false,
        data: {
          total: 0,
          operational: 0,
          assigned: 0,
          available: 0,
          needingMaintenance: 0
        },
        error: errorMessage
      };
    }
  }
}

// Export por defecto
export default EquipmentService;