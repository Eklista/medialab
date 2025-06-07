// frontend/src/services/inventory/hooks/useSupplies.ts

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
  supplies: any[];
  lowStockSupplies: SupplyWithDetails[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshLowStock: () => Promise<void>;
  searchSupplies: (params: SupplySearchParams) => Promise<any>;
  createSupply: (data: SupplyCreateRequest) => Promise<SupplyWithDetails>;
  updateSupply: (id: number, data: SupplyUpdateRequest) => Promise<SupplyWithDetails>;
  deleteSupply: (id: number) => Promise<void>;
  createMovement: (params: {
    supply_id: number;
    movement_type_id: number;
    cantidad: number;
    numero_envio?: string;
    user_receives_id?: number;
    user_delivers_to_id?: number;
    observaciones?: string;
  }) => Promise<any>;
  getStockStatus: (id: number) => Promise<SupplyStockResponse>;
}

export const useSuppliesList = ({
  skip = 0,
  limit = 25,
  formatType = 'list',
  autoFetch = true
}: UseSuppliesListParams = {}): UseSuppliesListReturn => {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [lowStockSupplies, setLowStockSupplies] = useState<SupplyWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const searchSupplies = useCallback(async (params: SupplySearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.supplies.searchSupplies(params);
      setSupplies(response.results);
      setTotalCount(response.total_found);
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error buscando suministros:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSupply = useCallback(async (data: SupplyCreateRequest): Promise<SupplyWithDetails> => {
    try {
      const newSupply = await inventoryApi.supplies.createSupply(data);
      
      // Refrescar lista
      await fetchSupplies();
      
      return newSupply;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error creando suministro:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchSupplies]);

  const updateSupply = useCallback(async (id: number, data: SupplyUpdateRequest): Promise<SupplyWithDetails> => {
    try {
      const updatedSupply = await inventoryApi.supplies.updateSupply(id, data);
      
      // Actualizar en la lista local
      setSupplies(prev => prev.map(supply => supply.id === id ? updatedSupply : supply));
      
      return updatedSupply;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error actualizando suministro:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteSupply = useCallback(async (id: number): Promise<void> => {
    try {
      await inventoryApi.supplies.deleteSupply(id);
      
      // Remover de la lista local
      setSupplies(prev => prev.filter(supply => supply.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error eliminando suministro:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

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
      const movement = await inventoryApi.supplies.createSupplyMovement(params);
      
      // Refrescar la lista para obtener stock actualizado
      await fetchSupplies();
      
      return movement;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error creando movimiento:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchSupplies]);

  const getStockStatus = useCallback(async (id: number): Promise<SupplyStockResponse> => {
    try {
      return await inventoryApi.supplies.getSupplyStockStatus(id);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error obteniendo estado de stock:', errorMessage);
      throw new Error(errorMessage);
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

  useEffect(() => {
    if (autoFetch) {
      fetchSupplies();
      fetchLowStockSupplies();
    }
  }, [fetchSupplies, fetchLowStockSupplies, autoFetch]);

  return {
    supplies,
    lowStockSupplies,
    totalCount,
    isLoading,
    error,
    refresh,
    refreshLowStock,
    searchSupplies,
    createSupply,
    updateSupply,
    deleteSupply,
    createMovement,
    getStockStatus
  };
};
