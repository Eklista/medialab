// frontend/src/hooks/useOptimizedData.ts - 🔧 CORREGIDO CON NUEVA ARQUITECTURA
// 🚀 HOOK INTELIGENTE QUE REEMPLAZA useRoles, useAreas, useUsers, usePermissionCategories
// Carga solo los datos que realmente necesitas

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppData } from '../context/AppDataContext';
import { PermissionCategory } from '../services/security/permissions.service';

// 🔧 IMPORTS CORREGIDOS - usando la nueva estructura modular
import { UserFormatted } from '../services/users/types/user.types';
import { Role, Area } from '../types/system.types';

// 🔧 TIPOS DEFINIDOS LOCALMENTE (mientras verificamos la centralización)
type SystemDataType = 'roles' | 'areas' | 'users' | 'permissions';

// ===== INTERFACES =====
export interface OptimizedDataOptions {
  /**
   * Si es true, carga automáticamente los datos al montar el componente
   * Si es false, debes llamar manualmente a loadData()
   */
  autoLoad?: boolean;
  
  /**
   * Si es true, fuerza el refresh de datos aunque estén en cache
   */
  forceRefresh?: boolean;
  
  /**
   * Tiempo de espera máximo para la carga (en ms)
   */
  timeout?: number;
  
  /**
   * Si es true, muestra logs detallados para debugging
   */
  debug?: boolean;
}

export interface OptimizedDataResult {
  // 🔧 CORREGIDO: Usar UserFormatted en lugar de UserServiceUser
  roles?: Role[];
  areas?: Area[];
  users?: UserFormatted[]; // ✅ Cambiado
  permissionCategories?: PermissionCategory[];
  
  // Estados de carga
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  
  // Metadatos útiles
  hasData: boolean;
  dataCount: number;
  lastUpdated: number | null;
  
  // Métodos de control
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Estadísticas para debugging
  stats: {
    requestedTypes: SystemDataType[];
    availableTypes: SystemDataType[];
    missingTypes: SystemDataType[];
    cacheHit: boolean;
  };
}

// ===== CONFIGURACIÓN POR DEFECTO =====
const DEFAULT_OPTIONS: Required<OptimizedDataOptions> = {
  autoLoad: true,
  forceRefresh: false,
  timeout: 8000,
  debug: false
};

// ===== HOOK PRINCIPAL =====
export const useOptimizedData = (
  requiredData: SystemDataType[],
  options: OptimizedDataOptions = {}
): OptimizedDataResult => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const { 
    roles, areas, users, permissionCategories, 
    ensureSystemData, refreshSystemData, 
    isLoading: contextLoading, isInitialized,
    getSystemDataStats
  } = useAppData();
  
  // Estado local del hook
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Logs de debugging
  const debugLog = useCallback((message: string, data?: any) => {
    if (finalOptions.debug) {
      console.log(`🔍 [useOptimizedData] ${message}`, data || '');
    }
  }, [finalOptions.debug]);
  
  // Verificar qué datos están disponibles y cuáles faltan
  const dataAnalysis = useMemo(() => {
    const available: SystemDataType[] = [];
    const missing: SystemDataType[] = [];
    
    requiredData.forEach(type => {
      switch (type) {
        case 'roles':
          if (roles.length > 0) available.push(type);
          else missing.push(type);
          break;
        case 'areas':
          if (areas.length > 0) available.push(type);
          else missing.push(type);
          break;
        case 'users':
          if (users.length > 0) available.push(type);
          else missing.push(type);
          break;
        case 'permissions':
          if (permissionCategories.length > 0) available.push(type);
          else missing.push(type);
          break;
      }
    });
    
    const systemStats = getSystemDataStats();
    const cacheHit = available.length === requiredData.length && systemStats.service?.hasCached;
    
    return {
      requestedTypes: requiredData,
      availableTypes: available,
      missingTypes: missing,
      cacheHit
    };
  }, [requiredData, roles.length, areas.length, users.length, permissionCategories.length, getSystemDataStats]);
  
  // Función para cargar datos faltantes
  const loadMissingData = useCallback(async (force = false) => {
    if (dataAnalysis.missingTypes.length === 0 && !force) {
      debugLog('✅ Todos los datos requeridos están disponibles');
      return;
    }
    
    setLocalLoading(true);
    setError(null);
    
    try {
      debugLog(`📥 Cargando datos faltantes: ${dataAnalysis.missingTypes.join(', ')}`, {
        missing: dataAnalysis.missingTypes,
        force,
        requiredData
      });
      
      const startTime = Date.now();
      
      if (force || dataAnalysis.missingTypes.length > 0) {
        await ensureSystemData(force ? requiredData : dataAnalysis.missingTypes);
      }
      
      const endTime = Date.now();
      setLastUpdated(endTime);
      
      debugLog(`✅ Datos cargados exitosamente en ${endTime - startTime}ms`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      debugLog(`💥 Error cargando datos: ${errorMessage}`, err);
    } finally {
      setLocalLoading(false);
    }
  }, [dataAnalysis.missingTypes, ensureSystemData, requiredData, debugLog]);
  
  // Función para refresh completo
  const refreshData = useCallback(async () => {
    debugLog('🔄 Refresh completo de datos');
    setError(null);
    setLocalLoading(true);
    
    try {
      const startTime = Date.now();
      await refreshSystemData(requiredData);
      const endTime = Date.now();
      
      setLastUpdated(endTime);
      debugLog(`✅ Refresh completado en ${endTime - startTime}ms`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en refresh';
      setError(errorMessage);
      debugLog(`💥 Error en refresh: ${errorMessage}`, err);
    } finally {
      setLocalLoading(false);
    }
  }, [refreshSystemData, requiredData, debugLog]);
  
  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
    debugLog('🧹 Error limpiado');
  }, [debugLog]);
  
  // Auto-carga al montar el componente
  useEffect(() => {
    if (finalOptions.autoLoad && isInitialized && !contextLoading) {
      debugLog('🚀 Auto-carga inicial', {
        requiredData,
        missingTypes: dataAnalysis.missingTypes,
        isInitialized,
        contextLoading
      });
      
      loadMissingData(finalOptions.forceRefresh);
    }
  }, [finalOptions.autoLoad, finalOptions.forceRefresh, isInitialized, contextLoading, loadMissingData, requiredData, dataAnalysis.missingTypes, debugLog]);
  
  // Construir datos de respuesta filtrados
  const responseData = useMemo(() => {
    const result: Pick<OptimizedDataResult, 'roles' | 'areas' | 'users' | 'permissionCategories'> = {};
    
    if (requiredData.includes('roles')) {
      result.roles = roles;
    }
    if (requiredData.includes('areas')) {
      result.areas = areas;
    }
    if (requiredData.includes('users')) {
      result.users = users;
    }
    if (requiredData.includes('permissions')) {
      result.permissionCategories = permissionCategories;
    }
    
    return result;
  }, [requiredData, roles, areas, users, permissionCategories]);
  
  // Calcular metadatos
  const hasData = dataAnalysis.availableTypes.length > 0;
  const dataCount = Object.values(responseData).reduce((count, arr) => count + (arr?.length || 0), 0);
  const isLoading = contextLoading || localLoading;
  const isError = !!error;
  
  // Log de estadísticas cuando cambian los datos
  useEffect(() => {
    if (finalOptions.debug) {
      debugLog('📊 Estadísticas actualizadas', {
        hasData,
        dataCount,
        isLoading,
        isError,
        analysis: dataAnalysis
      });
    }
  }, [hasData, dataCount, isLoading, isError, dataAnalysis, debugLog, finalOptions.debug]);
  
  return {
    // Datos filtrados
    ...responseData,
    
    // Estados
    isLoading,
    isError,
    error,
    
    // Metadatos
    hasData,
    dataCount,
    lastUpdated,
    
    // Métodos
    loadData: () => loadMissingData(false),
    refresh: refreshData,
    clearError,
    
    // Estadísticas
    stats: dataAnalysis
  };
};

// ===== HOOKS ESPECIALIZADOS PARA CASOS COMUNES =====

/**
 * 🎯 Hook específico para obtener solo roles
 * Reemplaza el antiguo useRoles()
 */
export const useRoles = (options?: OptimizedDataOptions) => {
  const result = useOptimizedData(['roles'], options);
  
  return {
    roles: result.roles || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refresh,
    hasRoles: (result.roles?.length || 0) > 0
  };
};

/**
 * 🎯 Hook específico para obtener solo áreas
 * Reemplaza el antiguo useAreas()
 */
export const useAreas = (options?: OptimizedDataOptions) => {
  const result = useOptimizedData(['areas'], options);
  
  return {
    areas: result.areas || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refresh,
    hasAreas: (result.areas?.length || 0) > 0
  };
};

/**
 * 🎯 Hook específico para obtener solo usuarios
 * Reemplaza el antiguo useUsers()
 */
export const useUsers = (options?: OptimizedDataOptions) => {
  const result = useOptimizedData(['users'], options);
  
  return {
    users: result.users || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refresh,
    hasUsers: (result.users?.length || 0) > 0
  };
};

/**
 * 🎯 Hook específico para obtener categorías de permisos
 * Reemplaza el antiguo usePermissionCategories()
 */
export const usePermissionCategories = (options?: OptimizedDataOptions) => {
  const result = useOptimizedData(['permissions'], options);
  
  return {
    categories: result.permissionCategories || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refresh,
    hasCategories: (result.permissionCategories?.length || 0) > 0
  };
};

/**
 * 🚀 Hook para datos completos del dashboard
 * Para componentes que necesitan todo
 */
export const useDashboardData = (options?: OptimizedDataOptions) => {
  return useOptimizedData(['roles', 'areas', 'users', 'permissions'], {
    debug: false,
    ...options
  });
};

/**
 * 🎯 Hook para gestión de usuarios (roles + áreas)
 * Para formularios de usuarios
 */
export const useUserManagementData = (options?: OptimizedDataOptions) => {
  return useOptimizedData(['roles', 'areas'], {
    debug: false,
    ...options
  });
};

/**
 * 📊 Hook para estadísticas del sistema
 * Útil para páginas de administración
 */
export const useSystemStats = () => {
  const { getSystemDataStats } = useAppData();
  
  return useMemo(() => {
    const stats = getSystemDataStats();
    return {
      ...stats,
      summary: {
        totalItems: stats.context.rolesCount + stats.context.areasCount + 
                   stats.context.usersCount + stats.context.categoriesCount,
        lastRefresh: new Date(stats.context.lastRefresh).toLocaleString(),
        cacheStatus: stats.service?.hasCached ? 'Active' : 'Empty',
        loadTime: stats.service?.lastLoadTime || 0
      }
    };
  }, [getSystemDataStats]);
};

// ===== UTILIDADES ADICIONALES =====

/**
 * Hook para debugging - muestra información detallada en consola
 */
export const useDataDebugger = (requiredData: SystemDataType[]) => {
  const result = useOptimizedData(requiredData, { debug: true, autoLoad: false });
  
  const logFullStats = useCallback(() => {
    console.group('🔍 Data Debugger Stats');
    console.log('📊 Required Data:', result.stats.requestedTypes);
    console.log('✅ Available Data:', result.stats.availableTypes);
    console.log('❌ Missing Data:', result.stats.missingTypes);
    console.log('📦 Cache Hit:', result.stats.cacheHit);
    console.log('📈 Data Count:', result.dataCount);
    console.log('⏰ Last Updated:', result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : 'Never');
    console.log('🔄 Is Loading:', result.isLoading);
    console.log('❗ Has Error:', result.isError);
    if (result.error) console.log('💥 Error:', result.error);
    console.groupEnd();
  }, [result]);
  
  return {
    ...result,
    logStats: logFullStats
  };
};