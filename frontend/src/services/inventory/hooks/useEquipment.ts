// frontend/src/services/inventory/hooks/useEquipment.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  // Parámetros de búsqueda que faltaban
  searchParams?: {
    q?: string;
    skip?: number;
    limit?: number;
    category_id?: number;
    state_id?: number;
    location_id?: number;
    assigned_only?: boolean;
    unassigned_only?: boolean;
  };
}

interface UseEquipmentListReturn {
  equipment: any[]; // Mantener como any[] para compatibilidad
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
  // Método simulado hasta que exista en el backend
  exportEquipment: (params?: { equipment_ids?: number[] }) => Promise<void>;
}

export const useEquipmentList = ({
  skip = 0,
  limit = 25,
  formatType = 'list',
  autoFetch = true,
  searchParams // Agregar este parámetro
}: UseEquipmentListParams = {}): UseEquipmentListReturn => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Memoizar searchParams para evitar recreación en cada render
  const memoizedSearchParams = useMemo(() => searchParams, [
    searchParams?.q,
    searchParams?.skip,
    searchParams?.limit,
    searchParams?.category_id,
    searchParams?.state_id,
    searchParams?.location_id,
    searchParams?.assigned_only,
    searchParams?.unassigned_only
  ]);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ Solo usar search si hay un query válido con al menos 2 caracteres
      const hasValidQuery = memoizedSearchParams?.q && memoizedSearchParams.q.trim().length >= 2;
      const hasFilters = memoizedSearchParams && (
        memoizedSearchParams.category_id || 
        memoizedSearchParams.state_id || 
        memoizedSearchParams.location_id || 
        memoizedSearchParams.assigned_only || 
        memoizedSearchParams.unassigned_only
      );
      
      if (hasValidQuery || hasFilters) {
        // Usar endpoint de búsqueda
        const response = await inventoryApi.equipment.searchEquipment({
          ...(hasValidQuery && { q: memoizedSearchParams.q }), // Solo incluir q si es válido
          skip: memoizedSearchParams.skip || skip,
          limit: memoizedSearchParams.limit || limit,
          category_id: memoizedSearchParams.category_id,
          state_id: memoizedSearchParams.state_id,
          location_id: memoizedSearchParams.location_id,
          assigned_only: memoizedSearchParams.assigned_only,
          unassigned_only: memoizedSearchParams.unassigned_only
        });
        
        setEquipment(response.results);
        setTotalCount(response.total_found);
      } else {
        // Usar endpoint de lista normal
        const response = await inventoryApi.equipment.getEquipmentList({
          skip: memoizedSearchParams?.skip || skip,
          limit: memoizedSearchParams?.limit || limit,
          format_type: formatType
        });
        
        setEquipment(response);
        setTotalCount(response.length);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando equipos:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [skip, limit, formatType, memoizedSearchParams]); // ✅ Usar memoizedSearchParams

  const searchEquipment = useCallback(async (params: EquipmentSearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ Validar que el query tenga al menos 2 caracteres si se proporciona
      if (params.q && params.q.trim().length > 0 && params.q.trim().length < 2) {
        setError('La búsqueda debe tener al menos 2 caracteres');
        return;
      }
      
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

  // Método que faltaba - exportEquipment
  const exportEquipment = useCallback(async (params: { equipment_ids?: number[] } = {}) => {
    try {
      // Por ahora simulamos la exportación
      console.log('Exportando equipos:', params);
      
      // En una implementación real, esto llamaría a un endpoint específico
      // const response = await inventoryApi.equipment.exportEquipment(params);
      
      // Simular descarga
      const data = params.equipment_ids 
        ? equipment.filter(eq => params.equipment_ids!.includes(eq.id))
        : equipment;
        
      const csvContent = generateCSV(data);
      downloadCSV(csvContent, 'equipos_export.csv');
      
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error exportando equipos:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [equipment]);

  const refresh = useCallback(async () => {
    await fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    if (autoFetch) {
      // ✅ Debounce para evitar llamadas excesivas
      const timeoutId = setTimeout(() => {
        fetchEquipment();
      }, 100); // 100ms de debounce

      return () => clearTimeout(timeoutId);
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
    unassignEquipment,
    exportEquipment // Agregar este método
  };
};

// Funciones auxiliares para exportación
function generateCSV(data: EquipmentWithDetails[]): string {
  const headers = [
    'ID',
    'Código UG',
    'Número Serie',
    'Service Tag',
    'Marca',
    'Modelo',
    'Descripción',
    'Categoría',
    'Estado',
    'Ubicación',
    'Usuario Asignado',
    'Fecha Entrega',
    'Observaciones'
  ];

  const rows = data.map(eq => [
    eq.id,
    eq.codigo_ug || '',
    eq.numero_serie || '',
    eq.service_tag || '',
    eq.marca || '',
    eq.modelo || '',
    eq.descripcion || '',
    eq.category?.name || '',
    eq.state?.name || '',
    eq.location?.name || '',
    eq.assigned_user?.fullName || '',
    eq.fecha_entrega || '',
    eq.observaciones || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}