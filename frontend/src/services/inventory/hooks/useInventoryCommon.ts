// frontend/src/services/inventory/hooks/useInventoryCommon.ts

import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../inventoryApi';
import {
  InventoryCategory,
  InventoryLocation,
  Supplier,
  EquipmentState,
  MovementType,
  SearchFilters
} from '../types';
import { handleApiError } from '../../api';

interface UseInventoryCommonReturn {
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  suppliers: Supplier[];
  equipmentStates: EquipmentState[];
  movementTypes: MovementType[];
  searchFilters: SearchFilters | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshStates: () => Promise<void>;
  refreshMovementTypes: () => Promise<void>;
}

export const useInventoryCommon = (): UseInventoryCommonReturn => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [equipmentStates, setEquipmentStates] = useState<EquipmentState[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryApi.common.getCategories();
      setCategories(response);
    } catch (err) {
      console.error('Error cargando categorías:', handleApiError(err));
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await inventoryApi.common.getLocations();
      setLocations(response);
    } catch (err) {
      console.error('Error cargando ubicaciones:', handleApiError(err));
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await inventoryApi.common.getSuppliers();
      setSuppliers(response);
    } catch (err) {
      console.error('Error cargando proveedores:', handleApiError(err));
    }
  }, []);

  const fetchEquipmentStates = useCallback(async () => {
    try {
      const response = await inventoryApi.common.getEquipmentStates();
      setEquipmentStates(response);
    } catch (err) {
      console.error('Error cargando estados de equipos:', handleApiError(err));
    }
  }, []);

  const fetchMovementTypes = useCallback(async () => {
    try {
      const response = await inventoryApi.common.getMovementTypes();
      setMovementTypes(response);
    } catch (err) {
      console.error('Error cargando tipos de movimiento:', handleApiError(err));
    }
  }, []);

  const fetchSearchFilters = useCallback(async () => {
    try {
      const response = await inventoryApi.search.getSearchFilters();
      setSearchFilters(response);
    } catch (err) {
      console.error('Error cargando filtros de búsqueda:', handleApiError(err));
    }
  }, []);

  const fetchAllCommonData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCategories(),
        fetchLocations(),
        fetchSuppliers(),
        fetchEquipmentStates(),
        fetchMovementTypes(),
        fetchSearchFilters()
      ]);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando datos comunes de inventario:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchCategories,
    fetchLocations,
    fetchSuppliers,
    fetchEquipmentStates,
    fetchMovementTypes,
    fetchSearchFilters
  ]);

  const refresh = useCallback(async () => {
    await fetchAllCommonData();
  }, [fetchAllCommonData]);

  useEffect(() => {
    fetchAllCommonData();
  }, [fetchAllCommonData]);

  return {
    categories,
    locations,
    suppliers,
    equipmentStates,
    movementTypes,
    searchFilters,
    isLoading,
    error,
    refresh,
    refreshCategories: fetchCategories,
    refreshLocations: fetchLocations,
    refreshSuppliers: fetchSuppliers,
    refreshStates: fetchEquipmentStates,
    refreshMovementTypes: fetchMovementTypes
  };
};
