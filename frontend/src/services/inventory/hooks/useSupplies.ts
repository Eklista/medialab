// frontend/src/services/inventory/hooks/useSupplies.ts - COMPLETO

import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../inventoryApi';
import {
  SupplyWithDetails,
  SupplySearchParams,
  SupplyCreateRequest,
  SupplyUpdateRequest,
  SupplyStockResponse,
  FormatType
} from '../types';
import { handleApiError } from '../../api';

interface UseSuppliesListParams {
  skip?: number;
  limit?: number;
  formatType?: FormatType;
  autoFetch?: boolean;
}

interface UseSuppliesListReturn {
  // Datos
  supplies: any[];
  lowStockSupplies: SupplyWithDetails[];
  totalCount: number;
  
  // Estados de carga
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Métodos de lectura
  refresh: () => Promise<void>;
  refreshLowStock: () => Promise<void>;
  
  // ===== BÚSQUEDA =====
  searchSupplies: (params: SupplySearchParams) => Promise<{
    success: boolean;
    data?: any[];
    total?: number;
    hasMore?: boolean;
    nextCursor?: number;
    error?: string;
  }>;
  
  // ===== CRUD SUMINISTROS =====
  createSupply: (data: SupplyCreateRequest) => Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
    message?: string;
  }>;
  updateSupply: (id: number, data: SupplyUpdateRequest) => Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
    message?: string;
  }>;
  deleteSupply: (id: number) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  
  // ===== OPERACIONES DE STOCK =====
  createMovement: (params: {
    supply_id: number;
    movement_type_id: number;
    cantidad: number;
    numero_envio?: string;
    user_receives_id?: number;
    user_delivers_to_id?: number;
    observaciones?: string;
  }) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }>;
  
  getStockStatus: (id: number) => Promise<{
    success: boolean;
    data?: SupplyStockResponse;
    error?: string;
  }>;
  
  // ===== OPERACIONES BULK =====
  bulkStockUpdate: (updates: Array<{
    supplyId: number;
    newStock: number;
    reason?: string;
  }>) => Promise<{
    success: boolean;
    successfulCount: number;
    failedCount: number;
    errors: string[];
    message?: string;
  }>;
  
  // ===== UTILIDADES =====
  getSupplyById: (id: number) => Promise<{
    success: boolean;
    data?: SupplyWithDetails;
    error?: string;
  }>;
}

export const useSuppliesList = ({
  skip = 0,
  limit = 25,
  formatType = 'list',
  autoFetch = true
}: UseSuppliesListParams = {}): UseSuppliesListReturn => {
  
  // ===== ESTADO =====
  const [supplies, setSupplies] = useState<any[]>([]);
  const [lowStockSupplies, setLowStockSupplies] = useState<SupplyWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== MÉTODOS DE LECTURA =====
  const fetchSupplies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.supplies.getSuppliesList({
        skip,
        limit,
        format_type: formatType
      });
      
      setSupplies(response);
      setTotalCount(response.length);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando suministros:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [skip, limit, formatType]);

  const fetchLowStockSupplies = useCallback(async () => {
    try {
      const response = await inventoryApi.supplies.getLowStockSupplies(50);
      setLowStockSupplies(response);
    } catch (err) {
      console.error('🚨 Error cargando suministros con stock bajo:', handleApiError(err));
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSupplies(),
      fetchLowStockSupplies()
    ]);
  }, [fetchSupplies, fetchLowStockSupplies]);

  const refreshLowStock = useCallback(async () => {
    await fetchLowStockSupplies();
  }, [fetchLowStockSupplies]);

  // ===== BÚSQUEDA =====
  const searchSupplies = useCallback(async (params: SupplySearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.supplies.searchSupplies(params);
      setSupplies(response.results);
      setTotalCount(response.total_found);
      
      return {
        success: true,
        data: response.results,
        total: response.total_found,
        hasMore: response.has_more,
        nextCursor: response.next_cursor
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error buscando suministros:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== CRUD SUMINISTROS =====
  const createSupply = useCallback(async (data: SupplyCreateRequest) => {
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

      setIsSubmitting(true);
      setError(null);

      const newSupply = await inventoryApi.supplies.createSupply(data);
      
      // Actualizar lista local
      setSupplies(prev => [newSupply, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return {
        success: true,
        data: newSupply,
        message: `Suministro "${newSupply.nombre_producto}" creado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('💥 Error creando suministro:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateSupply = useCallback(async (id: number, data: SupplyUpdateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updatedSupply = await inventoryApi.supplies.updateSupply(id, data);
      
      // Actualizar en la lista local
      setSupplies(prev => prev.map(supply => 
        supply.id === id ? updatedSupply : supply
      ));
      
      // Actualizar en low stock si está presente
      setLowStockSupplies(prev => prev.map(supply => 
        supply.id === id ? updatedSupply : supply
      ));
      
      return {
        success: true,
        data: updatedSupply,
        message: `Suministro "${updatedSupply.nombre_producto}" actualizado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error actualizando suministro ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteSupply = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await inventoryApi.supplies.deleteSupply(id);
      
      // Remover de la lista local
      setSupplies(prev => prev.filter(supply => supply.id !== id));
      setLowStockSupplies(prev => prev.filter(supply => supply.id !== id));
      setTotalCount(prev => prev - 1);
      
      return {
        success: true,
        message: result.message || `Suministro eliminado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error eliminando suministro ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ===== OPERACIONES DE STOCK =====
  const createMovement = useCallback(async (params: {
    supply_id: number;
    movement_type_id: number;
    cantidad: number;
    numero_envio?: string;
    user_receives_id?: number;
    user_delivers_to_id?: number;
    observaciones?: string;
  }) => {
    try {
      // Validaciones
      if (params.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      setIsSubmitting(true);
      setError(null);

      const movement = await inventoryApi.supplies.createSupplyMovement(params);
      
      // Refrescar la lista para obtener stock actualizado
      await fetchSupplies();
      await fetchLowStockSupplies();
      
      return {
        success: true,
        data: movement,
        message: `Movimiento de ${params.cantidad} unidades registrado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('💥 Error creando movimiento:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchSupplies, fetchLowStockSupplies]);

  const getStockStatus = useCallback(async (id: number) => {
    try {
      const stockStatus = await inventoryApi.supplies.getSupplyStockStatus(id);
      
      return {
        success: true,
        data: stockStatus
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error obteniendo estado de stock ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // ===== OPERACIONES BULK =====
  const bulkStockUpdate = useCallback(async (updates: Array<{
    supplyId: number;
    newStock: number;
    reason?: string;
  }>) => {
    const results = {
      success: true,
      successfulCount: 0,
      failedCount: 0,
      errors: [] as string[]
    };

    setIsSubmitting(true);

    for (const update of updates) {
      try {
        await updateSupply(update.supplyId, {
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

    setIsSubmitting(false);

    return {
      ...results,
      message: `${results.successfulCount} actualizaciones exitosas, ${results.failedCount} fallos`
    };
  }, [updateSupply]);

  // ===== UTILIDADES =====
  const getSupplyById = useCallback(async (id: number) => {
    try {
      const supply = await inventoryApi.supplies.getSupplyById(id);
      
      return {
        success: true,
        data: supply
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error obteniendo suministro ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // ===== EFECTO INICIAL =====
  useEffect(() => {
    if (autoFetch) {
      fetchSupplies();
      fetchLowStockSupplies();
    }
  }, [fetchSupplies, fetchLowStockSupplies, autoFetch]);

  // ===== RETURN =====
  return {
    // Datos
    supplies,
    lowStockSupplies,
    totalCount,
    
    // Estados
    isLoading,
    isSubmitting,
    error,
    
    // Métodos de lectura
    refresh,
    refreshLowStock,
    
    // Búsqueda
    searchSupplies,
    
    // CRUD
    createSupply,
    updateSupply,
    deleteSupply,
    
    // Stock operations
    createMovement,
    getStockStatus,
    
    // Bulk operations
    bulkStockUpdate,
    
    // Utilidades
    getSupplyById
  };
};