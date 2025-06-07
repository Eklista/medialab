// frontend/src/services/inventory/hooks/useInventoryDashboard.ts

import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../inventoryApi';
import { InventoryDashboardResponse } from '../types';
import { handleApiError } from '../../api';

interface UseInventoryDashboardReturn {
  dashboardData: InventoryDashboardResponse | null;
  quickStats: any | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useInventoryDashboard = (): UseInventoryDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<InventoryDashboardResponse | null>(null);
  const [quickStats, setQuickStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [dashboardResponse, statsResponse] = await Promise.all([
        inventoryApi.dashboard.getDashboardData(),
        inventoryApi.dashboard.getQuickStats()
      ]);
      
      setDashboardData(dashboardResponse);
      setQuickStats(statsResponse);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error cargando dashboard de inventario:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshStats = useCallback(async () => {
    try {
      const statsResponse = await inventoryApi.dashboard.getQuickStats();
      setQuickStats(statsResponse);
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('🚨 Error actualizando estadísticas:', errorMessage);
      // No sobrescribir error principal, solo log
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    quickStats,
    isLoading,
    error,
    refresh,
    refreshStats
  };
};