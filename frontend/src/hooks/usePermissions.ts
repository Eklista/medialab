// frontend/src/hooks/usePermissions.ts (Mejorado)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import permissionsService, { Permission, PermissionCategory, PermissionStats } from '../services/security/permissions.service';

export interface UsePermissionsReturn {
  // Estados
  permissions: Permission[];
  userPermissions: string[];
  categories: PermissionCategory[];
  stats: PermissionStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Funciones de verificación principales
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canPerform: (category: string, action: string) => boolean;
  
  // Funciones CRUD rápidas
  canView: (category: string) => boolean;
  canCreate: (category: string) => boolean;
  canEdit: (category: string) => boolean;
  canDelete: (category: string) => boolean;
  
  // Funciones de datos y utilidades
  getPermissionsByCategory: (category: string) => Permission[];
  searchPermissions: (query: string) => Promise<Permission[]>;
  checkPermissionExists: (permission: string) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  
  // Funciones administrativas
  loadAllPermissions: (options?: { category?: string; search?: string }) => Promise<Permission[]>;
  loadStats: () => Promise<void>;
  
  // Estado derivado
  isAdmin: boolean;
  hasAnyAdminPermission: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { state: authState } = useAuth();
  
  // Estados principales
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados derivados
  const isAdmin = authState.user?.role === 'ADMIN';
  const hasAnyAdminPermission = userPermissions.some(p => 
    p.includes('_view') || p.includes('_create') || p.includes('_edit') || p.includes('_delete')
  );

  /**
   * Carga los permisos del usuario actual
   */
  const loadUserPermissions = useCallback(async () => {
    try {
      if (!authState.isAuthenticated || !authState.user) {
        setUserPermissions([]);
        return;
      }

      const permissions = await permissionsService.getUserPermissions();
      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error cargando permisos del usuario:', err);
      setUserPermissions([]);
    }
  }, [authState.isAuthenticated, authState.user]);

  /**
   * Carga las categorías de permisos
   */
  const loadCategories = useCallback(async () => {
    try {
      const categories = await permissionsService.getPermissionsByCategories();
      setCategories(categories);
    } catch (err) {
      console.error('Error cargando categorías:', err);
      setCategories([]);
    }
  }, []);

  /**
   * Carga inicial de permisos
   */
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        loadUserPermissions(),
        loadCategories()
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar permisos';
      setError(errorMessage);
      console.error('Error en carga inicial de permisos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserPermissions, loadCategories]);

  // Efecto para cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      loadInitialData();
    } else {
      // Limpiar datos si no está autenticado
      setPermissions([]);
      setUserPermissions([]);
      setCategories([]);
      setStats(null);
      setIsLoading(false);
      setError(null);
    }
  }, [authState.isAuthenticated, authState.user, loadInitialData]);

  // ===== FUNCIONES DE VERIFICACIÓN =====

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // Los administradores tienen todos los permisos
    if (isAdmin) {
      return true;
    }
    
    return userPermissions.includes(permission);
  }, [isAdmin, userPermissions]);

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (isAdmin) {
      return true;
    }
    
    return permissionList.some(permission => userPermissions.includes(permission));
  }, [isAdmin, userPermissions]);

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    if (isAdmin) {
      return true;
    }
    
    return permissionList.every(permission => userPermissions.includes(permission));
  }, [isAdmin, userPermissions]);

  /**
   * Verifica si puede realizar una acción en una categoría
   */
  const canPerform = useCallback((category: string, action: string): boolean => {
    const permissionName = permissionsService.buildPermissionName(category, action);
    return hasPermission(permissionName);
  }, [hasPermission]);

  // ===== FUNCIONES CRUD RÁPIDAS =====

  const canView = useCallback((category: string): boolean => 
    canPerform(category, 'view'), [canPerform]);
  
  const canCreate = useCallback((category: string): boolean => 
    canPerform(category, 'create'), [canPerform]);
  
  const canEdit = useCallback((category: string): boolean => 
    canPerform(category, 'edit'), [canPerform]);
  
  const canDelete = useCallback((category: string): boolean => 
    canPerform(category, 'delete'), [canPerform]);

  // ===== FUNCIONES DE DATOS =====

  /**
   * Obtiene permisos de una categoría específica
   */
  const getPermissionsByCategory = useCallback((category: string): Permission[] => {
    return permissions.filter(permission => 
      permissionsService.extractCategory(permission.name) === category
    );
  }, [permissions]);

  /**
   * Busca permisos por texto
   */
  const searchPermissions = useCallback(async (query: string): Promise<Permission[]> => {
    try {
      return await permissionsService.searchPermissions(query);
    } catch (error) {
      console.error('Error buscando permisos:', error);
      return [];
    }
  }, []);

  /**
   * Verifica si un permiso existe
   */
  const checkPermissionExists = useCallback(async (permission: string): Promise<boolean> => {
    try {
      return await permissionsService.permissionExists(permission);
    } catch (error) {
      console.error('Error verificando existencia del permiso:', error);
      return false;
    }
  }, []);

  /**
   * Carga todos los permisos (para administradores)
   */
  const loadAllPermissions = useCallback(async (options?: { 
    category?: string; 
    search?: string 
  }): Promise<Permission[]> => {
    try {
      const allPermissions = await permissionsService.getAllPermissions(options);
      if (!options) {
        setPermissions(allPermissions);
      }
      return allPermissions;
    } catch (error) {
      console.error('Error cargando todos los permisos:', error);
      return [];
    }
  }, []);

  /**
   * Carga estadísticas de permisos
   */
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      const permissionStats = await permissionsService.getPermissionStats();
      setStats(permissionStats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  /**
   * Refresca todos los permisos
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await permissionsService.refresh();
      await loadInitialData();
      
      console.log('✅ Permisos refrescados');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al refrescar permisos';
      setError(errorMessage);
      console.error('Error refrescando permisos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialData]);

  return {
    // Estados
    permissions,
    userPermissions,
    categories,
    stats,
    isLoading,
    error,
    
    // Funciones de verificación principales
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerform,
    
    // Funciones CRUD rápidas
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // Funciones de datos y utilidades
    getPermissionsByCategory,
    searchPermissions,
    checkPermissionExists,
    refreshPermissions,
    
    // Funciones administrativas
    loadAllPermissions,
    loadStats,
    
    // Estado derivado
    isAdmin,
    hasAnyAdminPermission
  };
};