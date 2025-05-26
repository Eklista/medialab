// frontend/src/services/permissions.service.ts
import apiClient from './api';

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface PermissionCategory {
  name: string;
  display_name: string;
  permissions: Permission[];
}

export interface PermissionStats {
  total_permissions: number;
  categories_count: number;
  permissions_by_category: Record<string, number>;
  most_common_category?: string;
}

class PermissionsService {
  private permissionsCache: Permission[] | null = null;
  private userPermissionsCache: string[] | null = null;
  private categoriesCache: PermissionCategory[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Limpia todos los caches de permisos
   */
  clearCache(): void {
    this.permissionsCache = null;
    this.userPermissionsCache = null;
    this.categoriesCache = null;
    this.cacheExpiry = 0;
    console.log('🧹 Cache de permisos limpiado');
  }

  /**
   * Verifica si el cache está válido
   */
  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }

  /**
   * Actualiza el tiempo de expiración del cache
   */
  private updateCacheExpiry(): void {
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  /**
   * Obtiene todos los permisos del sistema (solo para administradores)
   */
  async getAllPermissions(options?: {
    category?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<Permission[]> {
    try {
      // Si hay filtros, no usar cache
      if (options && (options.category || options.search || options.skip || options.limit)) {
        const params = new URLSearchParams();
        if (options.category) params.append('category', options.category);
        if (options.search) params.append('search', options.search);
        if (options.skip) params.append('skip', options.skip.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        
        const response = await apiClient.get<Permission[]>(`/permissions/?${params}`);
        return response.data;
      }

      // Usar cache si está disponible y válido
      if (this.permissionsCache && this.isCacheValid()) {
        console.log('📦 Usando permisos desde cache');
        return this.permissionsCache;
      }

      console.log('🔄 Cargando todos los permisos...');
      const response = await apiClient.get<Permission[]>('/permissions/');
      
      this.permissionsCache = response.data;
      this.updateCacheExpiry();
      
      console.log(`✅ Cargados ${response.data.length} permisos`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      return [];
    }
  }

  /**
   * Obtiene los permisos del usuario actual
   */
  async getUserPermissions(useCache: boolean = true): Promise<string[]> {
    try {
      // Usar cache si está disponible y válido
      if (useCache && this.userPermissionsCache && this.isCacheValid()) {
        console.log('📦 Usando permisos de usuario desde cache');
        return this.userPermissionsCache;
      }

      console.log('🔄 Cargando permisos del usuario...');
      const response = await apiClient.get<string[]>('/permissions/me');
      
      this.userPermissionsCache = response.data;
      this.updateCacheExpiry();
      
      console.log(`✅ Usuario tiene ${response.data.length} permisos:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener permisos del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene permisos agrupados por categorías
   */
  async getPermissionsByCategories(): Promise<PermissionCategory[]> {
    try {
      // Usar cache si está disponible y válido
      if (this.categoriesCache && this.isCacheValid()) {
        console.log('📦 Usando categorías desde cache');
        return this.categoriesCache;
      }

      console.log('🔄 Cargando categorías de permisos...');
      const response = await apiClient.get<PermissionCategory[]>('/permissions/categories');
      
      this.categoriesCache = response.data;
      this.updateCacheExpiry();
      
      console.log(`✅ Cargadas ${response.data.length} categorías`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      return [];
    }
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  async checkPermission(permission: string): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(`/permissions/check/${permission}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al verificar permiso '${permission}':`, error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de permisos
   */
  async getPermissionStats(): Promise<PermissionStats | null> {
    try {
      const response = await apiClient.get<PermissionStats>('/permissions/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return null;
    }
  }

  /**
   * Extrae la categoría de un nombre de permiso
   */
  extractCategory(permissionName: string): string {
    const parts = permissionName.split('_');
    return parts[0] || 'other';
  }

  /**
   * Construye un nombre de permiso
   */
  buildPermissionName(category: string, action: string): string {
    return `${category}_${action}`;
  }

  /**
   * Obtiene permisos de una categoría específica
   */
  async getPermissionsByCategory(categoryName: string): Promise<Permission[]> {
    return this.getAllPermissions({ category: categoryName });
  }

  /**
   * Busca permisos por texto
   */
  async searchPermissions(query: string): Promise<Permission[]> {
    return this.getAllPermissions({ search: query });
  }

  /**
   * Verifica si un permiso específico existe en el sistema
   */
  async permissionExists(permissionName: string): Promise<boolean> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.some(p => p.name === permissionName);
    } catch (error) {
      console.error('❌ Error al verificar existencia del permiso:', error);
      return false;
    }
  }

  /**
   * Genera nombre amigable para categoría
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      'user': 'Usuarios',
      'role': 'Roles',
      'area': 'Áreas',
      'service': 'Servicios',
      'template': 'Plantillas',
      'request': 'Solicitudes',
      'department': 'Departamentos',
      'department_type': 'Tipos de Departamentos',
      'smtp_config': 'Configuración SMTP',
      'email_template': 'Plantillas Email',
      'profile': 'Perfil',
      'other': 'Otros'
    };
    
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Refresca todos los datos de permisos
   */
  async refresh(): Promise<void> {
    this.clearCache();
    await Promise.all([
      this.getUserPermissions(false),
      this.getAllPermissions(),
      this.getPermissionsByCategories()
    ]);
    console.log('🔄 Permisos refrescados completamente');
  }
}

const permissionsService = new PermissionsService();
export default permissionsService;