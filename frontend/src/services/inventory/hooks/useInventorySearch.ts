// frontend/src/services/inventory/hooks/useInventorySearch.ts

import { useState, useCallback, useEffect } from 'react';
import { inventoryApi } from '../inventoryApi';
import { handleApiError } from '../../api';
import type { 
  EquipmentWithDetails, 
  SupplyWithDetails, 
  SupplyStockResponse 
} from '../types';

interface UseInventorySearchReturn {
  searchResults: any | null;
  isSearching: boolean;
  searchError: string | null;
  search: (query: string, searchType?: 'equipment' | 'supplies' | 'all', limit?: number) => Promise<void>;
  clearSearch: () => void;
}

export const useInventorySearch = (): UseInventorySearchReturn => {
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string, 
    searchType: 'equipment' | 'supplies' | 'all' = 'all',
    limit: number = 50
  ) => {
    if (!query.trim() || query.length < 2) {
      setSearchError('La búsqueda debe tener al menos 2 caracteres');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      const results = await inventoryApi.search.unifiedSearch({
        q: query.trim(),
        search_type: searchType,
        limit
      });
      
      setSearchResults(results);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error en búsqueda unificada:', errorMessage);
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    clearSearch
  };
};

// ===== HOOK PARA DETALLES DE UN EQUIPO =====
export const useEquipmentDetails = (equipmentId: number | null) => {
  const [equipment, setEquipment] = useState<EquipmentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!equipmentId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await inventoryApi.equipment.getEquipmentById(equipmentId);
      setEquipment(response);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando detalles del equipo:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  return {
    equipment,
    isLoading,
    error,
    refresh: fetchEquipment
  };
};

// ===== HOOK PARA DETALLES DE UN SUMINISTRO =====
export const useSupplyDetails = (supplyId: number | null) => {
  const [supply, setSupply] = useState<SupplyWithDetails | null>(null);
  const [stockStatus, setStockStatus] = useState<SupplyStockResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupply = useCallback(async () => {
    if (!supplyId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const [supplyResponse, stockResponse] = await Promise.all([
        inventoryApi.supplies.getSupplyById(supplyId),
        inventoryApi.supplies.getSupplyStockStatus(supplyId)
      ]);
      
      setSupply(supplyResponse);
      setStockStatus(stockResponse);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando detalles del suministro:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supplyId]);

  useEffect(() => {
    fetchSupply();
  }, [fetchSupply]);

  return {
    supply,
    stockStatus,
    isLoading,
    error,
    refresh: fetchSupply
  };
};