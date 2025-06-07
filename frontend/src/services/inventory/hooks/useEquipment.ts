// frontend/src/services/inventory/hooks/useEquipment.ts

import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../inventoryApi';
import {
  EquipmentWithDetails,
  EquipmentSearchParams,
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  FormatType
} from '../types';
import { handleApiError } from '../../api';

interface UseEquipmentListParams {
  skip?: number;
  limit?: number;
  formatType?: FormatType;
  autoFetch?: boolean;
}

interface UseEquipmentListReturn {
  equipment: any[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchEquipment: (params: EquipmentSearchParams) => Promise<any>;
  createEquipment: (data: EquipmentCreateRequest) => Promise<EquipmentWithDetails>;
  updateEquipment: (id: number, data: EquipmentUpdateRequest) => Promise<EquipmentWithDetails>;
  deleteEquipment: (id: number) => Promise<void>;
  assignEquipment: (id: number, userId: number) => Promise<EquipmentWithDetails>;
  unassignEquipment: (id: number) => Promise<EquipmentWithDetails>;
}

export const useEquipmentList = ({
  skip = 0,
  limit = 25,
  formatType = 'list',
  autoFetch = true
}: UseEquipmentListParams = {}): UseEquipmentListReturn => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.equipment.getEquipmentList({
        skip,
        limit,
        format_type: formatType
      });
      
      setEquipment(response);
      setTotalCount(response.length); // Ajustar según respuesta real
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando equipos:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [skip, limit, formatType]);

  const searchEquipment = useCallback(async (params: EquipmentSearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.equipment.searchEquipment(params);
      setEquipment(response.results);
      setTotalCount(response.total_found);
      
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error buscando equipos:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEquipment = useCallback(async (data: EquipmentCreateRequest): Promise<EquipmentWithDetails> => {
    try {
      const newEquipment = await inventoryApi.equipment.createEquipment(data);
      
      // Refrescar lista
      await fetchEquipment();
      
      return newEquipment;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error creando equipo:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEquipment]);

  const updateEquipment = useCallback(async (id: number, data: EquipmentUpdateRequest): Promise<EquipmentWithDetails> => {
    try {
      const updatedEquipment = await inventoryApi.equipment.updateEquipment(id, data);
      
      // Actualizar en la lista local
      setEquipment(prev => prev.map(eq => eq.id === id ? updatedEquipment : eq));
      
      return updatedEquipment;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error actualizando equipo:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: number): Promise<void> => {
    try {
      await inventoryApi.equipment.deleteEquipment(id);
      
      // Remover de la lista local
      setEquipment(prev => prev.filter(eq => eq.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error eliminando equipo:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const assignEquipment = useCallback(async (id: number, userId: number): Promise<EquipmentWithDetails> => {
    try {
      const updatedEquipment = await inventoryApi.equipment.assignEquipment(id, { user_id: userId });
      
      // Actualizar en la lista local
      setEquipment(prev => prev.map(eq => eq.id === id ? updatedEquipment : eq));
      
      return updatedEquipment;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error asignando equipo:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const unassignEquipment = useCallback(async (id: number): Promise<EquipmentWithDetails> => {
    try {
      const updatedEquipment = await inventoryApi.equipment.unassignEquipment(id);
      
      // Actualizar en la lista local
      setEquipment(prev => prev.map(eq => eq.id === id ? updatedEquipment : eq));
      
      return updatedEquipment;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error desasignando equipo:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    if (autoFetch) {
      fetchEquipment();
    }
  }, [fetchEquipment, autoFetch]);

  return {
    equipment,
    totalCount,
    isLoading,
    error,
    refresh,
    searchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    assignEquipment,
    unassignEquipment
  };
};
