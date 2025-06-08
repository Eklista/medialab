// frontend/src/services/inventory/hooks/useInventoryCommon.ts - COMPLETO CON CRUD

import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../inventoryApi';
import {
  InventoryCategory,
  InventoryLocation,
  Supplier,
  EquipmentState,
  MovementType,
  SearchFilters,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  LocationCreateRequest,
  LocationUpdateRequest,
  SupplierCreateRequest,
  SupplierUpdateRequest
} from '../types';
import { handleApiError } from '../../api';

interface UseInventoryCommonReturn {
  // Datos
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  suppliers: Supplier[];
  equipmentStates: EquipmentState[];
  movementTypes: MovementType[];
  searchFilters: SearchFilters | null;
  
  // Estados de carga
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Métodos de lectura (refresh)
  refresh: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshStates: () => Promise<void>;
  refreshMovementTypes: () => Promise<void>;
  
  // ===== MÉTODOS CRUD PARA CATEGORÍAS =====
  createCategory: (data: CategoryCreateRequest) => Promise<{
    success: boolean;
    data?: InventoryCategory;
    error?: string;
    message?: string;
  }>;
  updateCategory: (id: number, data: CategoryUpdateRequest) => Promise<{
    success: boolean;
    data?: InventoryCategory;
    error?: string;
    message?: string;
  }>;
  deleteCategory: (id: number) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  
  // ===== MÉTODOS CRUD PARA UBICACIONES =====
  createLocation: (data: LocationCreateRequest) => Promise<{
    success: boolean;
    data?: InventoryLocation;
    error?: string;
    message?: string;
  }>;
  updateLocation: (id: number, data: LocationUpdateRequest) => Promise<{
    success: boolean;
    data?: InventoryLocation;
    error?: string;
    message?: string;
  }>;
  deleteLocation: (id: number) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  
  // ===== MÉTODOS CRUD PARA PROVEEDORES =====
  createSupplier: (data: SupplierCreateRequest) => Promise<{
    success: boolean;
    data?: Supplier;
    error?: string;
    message?: string;
  }>;
  updateSupplier: (id: number, data: SupplierUpdateRequest) => Promise<{
    success: boolean;
    data?: Supplier;
    error?: string;
    message?: string;
  }>;
  deleteSupplier: (id: number) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

export const useInventoryCommon = (): UseInventoryCommonReturn => {
  // ===== ESTADO =====
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [equipmentStates, setEquipmentStates] = useState<EquipmentState[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== MÉTODOS DE LECTURA =====
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

  // ===== MÉTODOS CRUD PARA CATEGORÍAS =====
  const createCategory = useCallback(async (data: CategoryCreateRequest) => {
    try {
      // Validaciones básicas
      if (!data.name?.trim()) {
        throw new Error('El nombre de la categoría es requerido');
      }

      setIsSubmitting(true);
      setError(null);

      const newCategory = await inventoryApi.common.createCategory(data);
      
      // Actualizar lista local
      setCategories(prev => [...prev, newCategory]);
      
      return {
        success: true,
        data: newCategory,
        message: `Categoría "${newCategory.name}" creada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('💥 Error creando categoría:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: number, data: CategoryUpdateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updatedCategory = await inventoryApi.common.updateCategory(id, data);
      
      // Actualizar lista local
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      );
      
      return {
        success: true,
        data: updatedCategory,
        message: `Categoría "${updatedCategory.name}" actualizada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error actualizando categoría ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await inventoryApi.common.deleteCategory(id);
      
      // Remover de lista local
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      return {
        success: true,
        message: result.message || `Categoría eliminada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error eliminando categoría ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ===== MÉTODOS CRUD PARA UBICACIONES =====
  const createLocation = useCallback(async (data: LocationCreateRequest) => {
    try {
      if (!data.name?.trim()) {
        throw new Error('El nombre de la ubicación es requerido');
      }

      setIsSubmitting(true);
      setError(null);

      const newLocation = await inventoryApi.common.createLocation(data);
      
      setLocations(prev => [...prev, newLocation]);
      
      return {
        success: true,
        data: newLocation,
        message: `Ubicación "${newLocation.name}" creada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('💥 Error creando ubicación:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateLocation = useCallback(async (id: number, data: LocationUpdateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updatedLocation = await inventoryApi.common.updateLocation(id, data);
      
      setLocations(prev => 
        prev.map(loc => loc.id === id ? updatedLocation : loc)
      );
      
      return {
        success: true,
        data: updatedLocation,
        message: `Ubicación "${updatedLocation.name}" actualizada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error actualizando ubicación ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteLocation = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await inventoryApi.common.deleteLocation(id);
      
      setLocations(prev => prev.filter(loc => loc.id !== id));
      
      return {
        success: true,
        message: result.message || `Ubicación eliminada exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error eliminando ubicación ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ===== MÉTODOS CRUD PARA PROVEEDORES =====
  const createSupplier = useCallback(async (data: SupplierCreateRequest) => {
    try {
      if (!data.name?.trim()) {
        throw new Error('El nombre del proveedor es requerido');
      }

      setIsSubmitting(true);
      setError(null);

      const newSupplier = await inventoryApi.common.createSupplier(data);
      
      setSuppliers(prev => [...prev, newSupplier]);
      
      return {
        success: true,
        data: newSupplier,
        message: `Proveedor "${newSupplier.name}" creado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('💥 Error creando proveedor:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateSupplier = useCallback(async (id: number, data: SupplierUpdateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updatedSupplier = await inventoryApi.common.updateSupplier(id, data);
      
      setSuppliers(prev => 
        prev.map(sup => sup.id === id ? updatedSupplier : sup)
      );
      
      return {
        success: true,
        data: updatedSupplier,
        message: `Proveedor "${updatedSupplier.name}" actualizado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error actualizando proveedor ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteSupplier = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await inventoryApi.common.deleteSupplier(id);
      
      setSuppliers(prev => prev.filter(sup => sup.id !== id));
      
      return {
        success: true,
        message: result.message || `Proveedor eliminado exitosamente`
      };
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`💥 Error eliminando proveedor ${id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ===== EFECTO INICIAL =====
  useEffect(() => {
    fetchAllCommonData();
  }, [fetchAllCommonData]);

  // ===== RETURN =====
  return {
    // Datos
    categories,
    locations,
    suppliers,
    equipmentStates,
    movementTypes,
    searchFilters,
    
    // Estados
    isLoading,
    isSubmitting,
    error,
    
    // Métodos de lectura
    refresh,
    refreshCategories: fetchCategories,
    refreshLocations: fetchLocations,
    refreshSuppliers: fetchSuppliers,
    refreshStates: fetchEquipmentStates,
    refreshMovementTypes: fetchMovementTypes,
    
    // CRUD Categorías
    createCategory,
    updateCategory,
    deleteCategory,
    
    // CRUD Ubicaciones
    createLocation,
    updateLocation,
    deleteLocation,
    
    // CRUD Proveedores
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};