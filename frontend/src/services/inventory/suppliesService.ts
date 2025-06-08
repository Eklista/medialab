// frontend/src/services/inventory/suppliesService.ts - REFINADO Y CONSISTENTE

import { SuppliesService as SuppliesApiService } from './inventoryApi';
import { handleApiError } from '../api';
import type {
  SupplyWithDetails,
  SupplyCreateRequest,
  SupplyUpdateRequest,
  SupplySearchParams,
  SupplyStockResponse,
  StockStatus,
  FormatType
} from './types';

/**
 * Servicio de suministros con manejo de errores y transformación de datos
 * Consistente con EquipmentService
 */
export class SuppliesService {
  
  /**
   * Obtiene lista de suministros con formato específico
   */
  static async getList(params: {
    skip?: number;
    limit?: number;
    formatType?: FormatType;
  } = {}) {
    try {
      const { skip = 0, limit = 25, formatType = 'list' } = params;
      
      const supplies = await SuppliesApiService.getSuppliesList({
        skip,
        limit,
        format_type: formatType
      });
      
      return {
        success: true,
        data: supplies,
        total: supplies.length,
        message: `${supplies.length} suministros obtenidos exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.getList:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Busca suministros con filtros
   */
  static async search(params: SupplySearchParams) {
    try {
      // Validar query si se proporciona
      if (params.q && params.q.trim().length > 0 && params.q.trim().length < 2) {
        throw new Error('La búsqueda debe tener al menos 2 caracteres');
      }

      const results = await SuppliesApiService.searchSupplies(params);
      
      return {
        success: true,
        data: results.results,
        total: results.total_found,
        hasMore: results.has_more,
        nextCursor: results.next_cursor,
        message: `${results.total_found} suministros encontrados`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.search:', errorMessage);
      
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
   * Obtiene un suministro por ID
   */
  static async getById(id: number): Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
  }> {
    try {
      const supply = await SuppliesApiService.getSupplyById(id);
      
      return {
        success: true,
        data: supply
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en SuppliesService.getById(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo suministro
   */
  static async create(data: SupplyCreateRequest): Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      // Validaciones básicas
      if (!data.nombre_producto?.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      if (!data.category_id) {
        throw new Error('La categoría es requerida');
      }
      if (data.stock_actual !== undefined && data.stock_actual < 0) {
        throw new Error('El stock actual no puede ser negativo');
      }
      if (data.stock_minimo !== undefined && data.stock_minimo < 0) {
        throw new Error('El stock mínimo no puede ser negativo');
      }

      const supply = await SuppliesApiService.createSupply(data);
      
      return {
        success: true,
        data: supply,
        message: `Suministro "${supply.nombre_producto}" creado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.create:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un suministro existente
   */
  static async update(id: number, data: SupplyUpdateRequest): Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
    message?: string;
  }> {
    try {
      const supply = await SuppliesApiService.updateSupply(id, data);
      
      return {
        success: true,
        data: supply,
        message: `Suministro "${supply.nombre_producto}" actualizado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en SuppliesService.update(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un suministro
   */
  static async delete(id: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const result = await SuppliesApiService.deleteSupply(id);
      
      return {
        success: true,
        message: result.message || `Suministro ${id} eliminado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en SuppliesService.delete(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un movimiento de stock (entrada/salida)
   */
  static async createMovement(params: {
    supplyId: number;
    movementTypeId: number;
    quantity: number;
    shipmentNumber?: string;
    userReceivesId?: number;
    userDeliversToId?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> {
    try {
      const { supplyId, movementTypeId, quantity, ...restParams } = params;

      // Validaciones
      if (quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      const movement = await SuppliesApiService.createSupplyMovement({
        supply_id: supplyId,
        movement_type_id: movementTypeId,
        cantidad: quantity,
        numero_envio: restParams.shipmentNumber,
        user_receives_id: restParams.userReceivesId,
        user_delivers_to_id: restParams.userDeliversToId,
        observaciones: restParams.notes
      });
      
      return {
        success: true,
        data: movement,
        message: `Movimiento de ${quantity} unidades registrado exitosamente`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.createMovement:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene el estado del stock de un suministro
   */
  static async getStockStatus(id: number): Promise<{
    success: boolean;
    data?: SupplyStockResponse;
    error?: string;
  }> {
    try {
      const stockStatus = await SuppliesApiService.getSupplyStockStatus(id);
      
      return {
        success: true,
        data: stockStatus
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`💥 Error en SuppliesService.getStockStatus(${id}):`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene suministros con stock bajo
   */
  static async getLowStock(limit: number = 50) {
    try {
      const supplies = await SuppliesApiService.getLowStockSupplies(limit);
      
      return {
        success: true,
        data: supplies,
        total: supplies.length,
        message: `${supplies.length} suministros con stock bajo`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.getLowStock:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene suministros sin stock
   */
  static async getOutOfStock(limit: number = 50) {
    try {
      const results = await SuppliesApiService.searchSupplies({
        q: '',
        out_of_stock_only: true,
        limit
      });
      
      return {
        success: true,
        data: results.results,
        total: results.total_found,
        message: `${results.total_found} suministros sin stock`
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.getOutOfStock:', errorMessage);
      
      return {
        success: false,
        data: [],
        total: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Operaciones de stock en lote
   */
  static async bulkStockUpdate(updates: Array<{
    supplyId: number;
    newStock: number;
    reason?: string;
  }>): Promise<{
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

    for (const update of updates) {
      try {
        await this.update(update.supplyId, {
          stock_actual: update.newStock
        });
        results.successfulCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push(`Suministro ${update.supplyId}: ${handleApiError(error)}`);
      }
    }

    if (results.failedCount > 0) {
      results.success = false;
    }

    return {
      ...results,
      message: `${results.successfulCount} actualizaciones exitosas, ${results.failedCount} fallos`
    };
  }

  /**
   * Obtiene estadísticas rápidas de suministros
   */
  static async getStats() {
    try {
      // En una implementación real, esto vendría de un endpoint específico
      const [allSupplies, lowStock] = await Promise.all([
        this.getList({ limit: 1000 }),
        this.getLowStock(1000)
      ]);
      
      if (!allSupplies.success) {
        throw new Error(allSupplies.error);
      }

      const supplies = allSupplies.data;
      const stats = {
        total: supplies.length,
        lowStock: lowStock.data?.length || 0,
        outOfStock: supplies.filter((sup: any) => sup.stock_actual <= 0).length,
        active: supplies.filter((sup: any) => sup.is_active).length,
        totalValue: supplies.reduce((sum: number, sup: any) => 
          sum + (sup.stock_actual * (sup.cost_per_unit || 0)), 0
        )
      };

      return {
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas exitosamente'
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('💥 Error en SuppliesService.getStats:', errorMessage);
      
      return {
        success: false,
        data: {
          total: 0,
          lowStock: 0,
          outOfStock: 0,
          active: 0,
          totalValue: 0
        },
        error: errorMessage
      };
    }
  }

  // ===== UTILIDADES ESTÁTICAS =====

  /**
   * Calcula el estado de stock basado en valores
   */
  static calculateStockStatus(current: number, minimum: number): StockStatus {
    if (current <= 0) return 'out';
    if (current <= minimum * 0.5) return 'critical';
    if (current <= minimum) return 'low';
    return 'ok';
  }

  /**
   * Obtiene el color para mostrar según el estado de stock
   */
  static getStockStatusColor(status: StockStatus): string {
    const colors = {
      'ok': '#10B981',      // green-500
      'low': '#F59E0B',     // amber-500
      'critical': '#EF4444', // red-500
      'out': '#991B1B'      // red-800
    };
    return colors[status];
  }

  /**
   * Formatea la información de stock para mostrar
   */
  static formatStockInfo(current: number, minimum: number): {
    status: StockStatus;
    statusText: string;
    color: string;
    percentage: number;
  } {
    const status = this.calculateStockStatus(current, minimum);
    const percentage = minimum > 0 ? (current / minimum) * 100 : 100;
    
    const statusTexts = {
      'ok': 'Stock normal',
      'low': 'Stock bajo',
      'critical': 'Stock crítico',
      'out': 'Sin stock'
    };

    return {
      status,
      statusText: statusTexts[status],
      color: this.getStockStatusColor(status),
      percentage: Math.round(percentage)
    };
  }

  /**
   * Valida datos de suministro antes de enviar
   */
  static validateSupplyData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.nombre_producto?.trim()) {
      errors.push('Nombre del producto es requerido');
    }
    if (!data.category_id) {
      errors.push('Categoría es requerida');
    }
    if (data.stock_actual !== undefined && data.stock_actual < 0) {
      errors.push('Stock actual no puede ser negativo');
    }
    if (data.stock_minimo !== undefined && data.stock_minimo < 0) {
      errors.push('Stock mínimo no puede ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida datos de movimiento de stock
   */
  static validateMovementData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.supply_id) {
      errors.push('Suministro es requerido');
    }
    if (!data.movement_type_id) {
      errors.push('Tipo de movimiento es requerido');
    }
    if (!data.cantidad || data.cantidad <= 0) {
      errors.push('Cantidad debe ser mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convierte suministros a formato de exportación
   */
  static formatForExport(supplies: SupplyWithDetails[]): any[] {
    return supplies.map(supply => ({
      'ID': supply.id,
      'Código': supply.codigo || '',
      'Nombre del Producto': supply.nombre_producto,
      'Presentación': supply.presentacion || '',
      'Descripción': supply.descripcion || '',
      'Categoría': supply.category?.name || '',
      'Ubicación': supply.location?.name || '',
      'Stock Actual': supply.stock_actual,
      'Stock Mínimo': supply.stock_minimo,
      'Estado del Stock': this.formatStockInfo(supply.stock_actual, supply.stock_minimo).statusText,
      'Activo': supply.is_active ? 'Sí' : 'No',
      'Observaciones': supply.observaciones || '',
      'Fecha de Creación': new Date(supply.created_at).toLocaleDateString('es-GT')
    }));
  }
}

// Export por defecto
export default SuppliesService;