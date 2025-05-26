// src/hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import permissionsService, { Permission, PermissionCategory } from '../services/permissions.service';

export interface UsePermissionsReturn {
  // Estados
  permissions: Permission[];
  categories: PermissionCategory[];
  isLoading: boolean;
  error: string | null;
  
  // Funciones de verificación
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canPerform: (category: string, action: string) => boolean;
  
  // Funciones CRUD rápidas
  canView: (category: string) => boolean;
  canCreate: (category: string) => boolean;
  canEdit: (category: string) => boolean;
  canDelete: (category: string) => boolean;
  
  // Funciones de datos
  getPermissionsByCategory: (category: string) => Permission[];
  searchPermissions: (query: string) => Permission[];
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { state: authState, hasPermission: authHasPermission, hasAnyPermission: authHasAnyPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [allPermissions, permissionCategories] = await Promise.all([
        permissionsService.getAllPermissions(),
        permissionsService.getPermissionsByCategories()
      ]);
      
      setPermissions(allPermissions);
      setCategories(permissionCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar permisos';
      setError(errorMessage);
      console.error('Error loading permissions:', err);
      // En caso de error, establecer arrays vacíos
      setPermissions([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadPermissions();
    } else {
      // Limpiar permisos si no está autenticado
      setPermissions([]);
      setCategories([]);
      setIsLoading(false);
    }
  }, [authState.isAuthenticated]);

  // Funciones de verificación usando el contexto de auth
  const hasPermission = (permission: string): boolean => {
    return authHasPermission(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return authHasAnyPermission(permissionList);
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  const canPerform = (category: string, action: string): boolean => {
    const permissionName = permissionsService.buildPermissionName(category, action);
    return hasPermission(permissionName);
  };

  // Funciones CRUD rápidas
  const canView = (category: string): boolean => canPerform(category, 'view');
  const canCreate = (category: string): boolean => canPerform(category, 'create');
  const canEdit = (category: string): boolean => canPerform(category, 'edit');
  const canDelete = (category: string): boolean => canPerform(category, 'delete');

  // Funciones de datos
  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(permission => 
      permission.name.startsWith(`${category}_`)
    );
  };

  const searchPermissions = (query: string): Permission[] => {
    const searchTerm = query.toLowerCase();
    return permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchTerm) ||
      (permission.description && permission.description.toLowerCase().includes(searchTerm))
    );
  };

  const refreshPermissions = async (): Promise<void> => {
    permissionsService.clearCache();
    await loadPermissions();
  };

  return {
    // Estados
    permissions,
    categories,
    isLoading,
    error,
    
    // Funciones de verificación
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerform,
    
    // Funciones CRUD rápidas
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // Funciones de datos
    getPermissionsByCategory,
    searchPermissions,
    refreshPermissions
  };
};