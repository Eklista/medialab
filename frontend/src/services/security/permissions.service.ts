// frontend/src/services/permissions.service.ts - OPTIMIZED VERSION
import apiClient from '../api';

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

// ===== CACHE CONFIGURATION =====
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class PermissionsService {
  // ===== CACHE SYSTEM =====
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para permisos de usuario
  
  // ===== CONCURRENCY CONTROL =====
  private activeRequests = new Map<string, Promise<any>>();
  
  /**
   * 🆕 Sistema de cache unificado
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Cache hit: ${key}`);
    return entry.data;
  }
  
  private setCache<T>(key: string, data: T, customDuration?: number): void {
    const duration = customDuration || this.CACHE_DURATION;
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration
    });
    
    console.log(`💾 Cache set: ${key} (expires in ${duration/1000}s)`);
  }
  
  /**
   * 🆕 Sistema de deduplicación de requests
   */
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Si ya hay un request activo para esta key, esperar por él
    if (this.activeRequests.has(key)) {
      console.log(`⏳ Request deduplicado: ${key}`);
      return this.activeRequests.get(key);
    }
    
    // Crear nuevo request
    const requestPromise = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });
    
    this.activeRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Limpia todos los caches de permisos
   */
  clearCache(): void {
    this.cache.clear();
    this.activeRequests.clear();
    console.log('🧹 Cache de permisos completamente limpiado');
  }

  /**
   * 🆕 Limpia cache específico
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Cache invalidado para patrón: ${pattern}`);
    } else {
      this.clearCache();
    }
  }

  /**
   * 🆕 OPTIMIZED: Obtiene todos los permisos del sistema con cache inteligente
   */
  async getAllPermissions(options?: {
    category?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<Permission[]> {
    try {
      // Crear cache key único basado en opciones
      const cacheKey = `all_permissions_${JSON.stringify(options || {})}`;
      
      // Verificar cache primero
      const cached = this.getFromCache<Permission[]>(cacheKey);
      if (cached) return cached;
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando todos los permisos desde API...');
        
        let url = '/permissions/';
        const params = new URLSearchParams();
        
        if (options?.category) params.append('category', options.category);
        if (options?.search) params.append('search', options.search);
        if (options?.skip) params.append('skip', options.skip.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        
        if (params.toString()) {
          url += `?${params}`;
        }
        
        const response = await apiClient.get<Permission[]>(url);
        
        // Solo cachear si no hay filtros específicos (datos base)
        if (!options || (!options.search && !options.skip && !options.limit)) {
          this.setCache(cacheKey, response.data);
        }
        
        console.log(`✅ Cargados ${response.data.length} permisos`);
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      return [];
    }
  }

  /**
   * 🆕 OPTIMIZED: Obtiene los permisos del usuario actual con cache y deduplicación
   */
  async getUserPermissions(useCache: boolean = true): Promise<string[]> {
    try {
      const cacheKey = 'user_permissions';
      
      // Verificar cache si está habilitado
      if (useCache) {
        const cached = this.getFromCache<string[]>(cacheKey);
        if (cached) return cached;
      }
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando permisos del usuario desde API...');
        
        const response = await apiClient.get<string[]>('/permissions/me');
        
        // Usar cache más corto para permisos de usuario (pueden cambiar más frecuentemente)
        this.setCache(cacheKey, response.data, this.USER_CACHE_DURATION);
        
        console.log(`✅ Usuario tiene ${response.data.length} permisos`);
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error al obtener permisos del usuario:', error);
      return [];
    }
  }

  /**
   * 🆕 OPTIMIZED: Obtiene permisos agrupados por categorías con cache
   */
  async getPermissionsByCategories(): Promise<PermissionCategory[]> {
    try {
      const cacheKey = 'permission_categories';
      
      // Verificar cache
      const cached = this.getFromCache<PermissionCategory[]>(cacheKey);
      if (cached) return cached;
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando categorías de permisos desde API...');
        
        const response = await apiClient.get<PermissionCategory[]>('/permissions/categories');
        
        this.setCache(cacheKey, response.data);
        
        console.log(`✅ Cargadas ${response.data.length} categorías`);
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      return [];
    }
  }

  /**
   * 🆕 OPTIMIZED: Verifica si el usuario tiene un permiso específico (con cache local)
   */
  async checkPermission(permission: string): Promise<boolean> {
    try {
      const cacheKey = `check_permission_${permission}`;
      
      // Verificar cache
      const cached = this.getFromCache<boolean>(cacheKey);
      if (cached !== null) return cached;
      
      // Si tenemos los permisos del usuario en cache, usar esos
      const userPerms = this.getFromCache<string[]>('user_permissions');
      if (userPerms) {
        const hasPermission = userPerms.includes(permission);
        this.setCache(cacheKey, hasPermission, this.USER_CACHE_DURATION);
        return hasPermission;
      }
      
      // Fallback a API
      return this.deduplicateRequest(cacheKey, async () => {
        console.log(`🔄 Verificando permiso '${permission}' desde API...`);
        
        const response = await apiClient.get<boolean>(`/permissions/check/${permission}`);
        
        this.setCache(cacheKey, response.data, this.USER_CACHE_DURATION);
        
        return response.data;
      });
      
    } catch (error) {
      console.error(`❌ Error al verificar permiso '${permission}':`, error);
      return false;
    }
  }

  /**
   * 🆕 OPTIMIZED: Obtiene estadísticas con cache
   */
  async getPermissionStats(): Promise<PermissionStats | null> {
    try {
      const cacheKey = 'permission_stats';
      
      // Verificar cache
      const cached = this.getFromCache<PermissionStats>(cacheKey);
      if (cached) return cached;
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando estadísticas de permisos...');
        
        const response = await apiClient.get<PermissionStats>('/permissions/stats');
        
        // Las estadísticas pueden cambiar menos frecuentemente
        this.setCache(cacheKey, response.data, this.CACHE_DURATION * 2);
        
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return null;
    }
  }

  /**
   * 🆕 BATCH LOADING: Carga múltiples tipos de datos en paralelo
   */
  async loadEssentialData(): Promise<{
    userPermissions: string[];
    categories: PermissionCategory[];
    allPermissions: Permission[];
  }> {
    try {
      console.log('🚀 Cargando datos esenciales de permisos en batch...');
      const startTime = Date.now();
      
      const [userPermissions, categories, allPermissions] = await Promise.all([
        this.getUserPermissions(),
        this.getPermissionsByCategories(),
        this.getAllPermissions()
      ]);
      
      const endTime = Date.now();
      console.log(`✅ Datos esenciales cargados en ${endTime - startTime}ms`);
      
      return {
        userPermissions,
        categories,
        allPermissions
      };
    } catch (error) {
      console.error('❌ Error en batch loading:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS (sin cambios pero optimizados) =====
  
  extractCategory(permissionName: string): string {
    const parts = permissionName.split('_');
    return parts[0] || 'other';
  }

  buildPermissionName(category: string, action: string): string {
    return `${category}_${action}`;
  }

  async getPermissionsByCategory(categoryName: string): Promise<Permission[]> {
    return this.getAllPermissions({ category: categoryName });
  }

  async searchPermissions(query: string): Promise<Permission[]> {
    return this.getAllPermissions({ search: query });
  }

  /**
   * 🆕 OPTIMIZED: Verifica existencia con cache inteligente
   */
  async permissionExists(permissionName: string): Promise<boolean> {
    try {
      const cacheKey = `permission_exists_${permissionName}`;
      
      // Verificar cache
      const cached = this.getFromCache<boolean>(cacheKey);
      if (cached !== null) return cached;
      
      // Si tenemos todos los permisos en cache, usar esos
      const allPerms = this.getFromCache<Permission[]>('all_permissions_{}');
      if (allPerms) {
        const exists = allPerms.some(p => p.name === permissionName);
        this.setCache(cacheKey, exists);
        return exists;
      }
      
      // Fallback: cargar todos los permisos y verificar
      const allPermissions = await this.getAllPermissions();
      const exists = allPermissions.some(p => p.name === permissionName);
      this.setCache(cacheKey, exists);
      
      return exists;
    } catch (error) {
      console.error('❌ Error al verificar existencia del permiso:', error);
      return false;
    }
  }

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
   * 🆕 SMART REFRESH: Refresca solo lo necesario
   */
  async refresh(type?: 'user' | 'system' | 'all'): Promise<void> {
    console.log(`🔄 Refrescando permisos: ${type || 'all'}`);
    
    if (type === 'user' || type === 'all') {
      this.invalidateCache('user_permissions');
      this.invalidateCache('check_permission');
    }
    
    if (type === 'system' || type === 'all') {
      this.invalidateCache('all_permissions');
      this.invalidateCache('permission_categories');
      this.invalidateCache('permission_stats');
    }
    
    if (!type || type === 'all') {
      this.clearCache();
    }
    
    // Pre-cargar datos esenciales si es refresh completo
    if (type === 'all' || !type) {
      await this.loadEssentialData();
    }
    
    console.log('✅ Permisos refrescados');
  }

  /**
   * 🆕 CACHE STATS para debugging
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([, entry]) => entry.timestamp);
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }
}

const permissionsService = new PermissionsService();
export default permissionsService;