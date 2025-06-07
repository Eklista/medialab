// frontend/src/services/inventory/hooks/useActivityFeed.ts

import { useState, useEffect, useCallback } from 'react';
import { ActivitiesService, ActivityItem, ActivityType, ActivityFilters, ActivitySummaryResponse } from '../activitiesService';

interface UseActivityFeedParams {
  limit?: number;
  activity_types?: string;
  user_id?: number;
  days_back?: number;
  autoFetch?: boolean;
  refreshInterval?: number; // en milisegundos
}

interface UseActivityFeedReturn {
  // Datos
  activities: ActivityItem[];
  activityTypes: ActivityType[];
  summary: ActivitySummaryResponse | null;
  totalActivities: number;
  hasMore: boolean;
  
  // Estados
  isLoading: boolean;
  isLoadingTypes: boolean;
  isLoadingSummary: boolean;
  error: string | null;
  
  // Acciones
  refresh: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (activityId: string) => Promise<void>;
  updateFilters: (filters: Partial<ActivityFilters>) => void;
  
  // Filtros actuales
  currentFilters: ActivityFilters;
  
  // Estadísticas
  stats: {
    equipment_created: number;
    equipment_assigned: number;
    stock_movements: number;
    low_stock_alerts: number;
    period_days: number;
  };
}

export const useActivityFeed = ({
  limit = 50,
  activity_types,
  user_id,
  days_back = 30,
  autoFetch = true,
  refreshInterval
}: UseActivityFeedParams = {}): UseActivityFeedReturn => {
  
  // Estados principales
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [summary, setSummary] = useState<ActivitySummaryResponse | null>(null);
  const [totalActivities, setTotalActivities] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros actuales
  const [currentFilters, setCurrentFilters] = useState<ActivityFilters>({
    limit,
    activity_types,
    user_id,
    days_back
  });
  
  // Estados de estadísticas
  const [stats, setStats] = useState({
    equipment_created: 0,
    equipment_assigned: 0,
    stock_movements: 0,
    low_stock_alerts: 0,
    period_days: days_back
  });

  // Función para obtener actividades
  const fetchActivities = useCallback(async (appendMode = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ActivitiesService.getActivityFeed(currentFilters);
      
      if (result.success && result.data) {
        if (appendMode) {
          setActivities(prev => [...prev, ...result.data.activities]);
        } else {
          setActivities(result.data.activities);
        }
        
        setTotalActivities(result.data.total);
        setHasMore(result.data.pagination.has_more);
        setStats(result.data.stats);
      } else {
        setError(result.error || 'Error al cargar actividades');
        if (!appendMode) {
          setActivities([]);
          setTotalActivities(0);
          setHasMore(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('🚨 Error en fetchActivities:', errorMessage);
      setError(errorMessage);
      if (!appendMode) {
        setActivities([]);
        setTotalActivities(0);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // Función para obtener tipos de actividades
  const fetchActivityTypes = useCallback(async () => {
    try {
      setIsLoadingTypes(true);
      
      const result = await ActivitiesService.getActivityTypes();
      
      if (result.success) {
        setActivityTypes(result.data);
      } else {
        console.error('Error cargando tipos de actividades:', result.error);
      }
    } catch (err) {
      console.error('🚨 Error en fetchActivityTypes:', err);
    } finally {
      setIsLoadingTypes(false);
    }
  }, []);

  // Función para obtener resumen
  const fetchSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      
      const result = await ActivitiesService.getActivitySummary();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        console.error('Error cargando resumen:', result.error);
      }
    } catch (err) {
      console.error('🚨 Error en fetchSummary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Función de refresh
  const refresh = useCallback(async () => {
    await fetchActivities(false);
  }, [fetchActivities]);

  // Función de refresh para resumen
  const refreshSummary = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  // Función para cargar más
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    // Incrementar el límite para la siguiente llamada
    const newFilters = {
      ...currentFilters,
      limit: (currentFilters.limit || 50) + 25
    };
    
    setCurrentFilters(newFilters);
  }, [hasMore, isLoading, currentFilters]);

  // Función para marcar como leído
  const markAsRead = useCallback(async (activityId: string) => {
    try {
      const result = await ActivitiesService.markAsRead(activityId);
      
      if (result.success) {
        // Actualizar el estado local si es necesario
        setActivities(prev => 
          prev.map(activity => 
            activity.id === activityId 
              ? { ...activity, read: true } // Agregar campo read si se implementa
              : activity
          )
        );
      }
    } catch (err) {
      console.error('🚨 Error marcando actividad como leída:', err);
    }
  }, []);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
      fetchActivityTypes();
      fetchSummary();
    }
  }, [autoFetch, fetchActivities, fetchActivityTypes, fetchSummary]);

  // Efecto para recargar cuando cambien los filtros
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [currentFilters, autoFetch, fetchActivities]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!isLoading) {
        refresh();
        refreshSummary();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isLoading, refresh, refreshSummary]);

  return {
    // Datos
    activities,
    activityTypes,
    summary,
    totalActivities,
    hasMore,
    
    // Estados
    isLoading,
    isLoadingTypes,
    isLoadingSummary,
    error,
    
    // Acciones
    refresh,
    refreshSummary,
    loadMore,
    markAsRead,
    updateFilters,
    
    // Filtros y estadísticas
    currentFilters,
    stats
  };
};