// frontend/src/services/security/roles.service.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

// ===== INTERFACES =====
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleWithPermissions extends Role {
  permissions: string[];
}

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleStats {
  total: number;
  withPermissions: number;
  withoutPermissions: number;
  byCategory: Record<string, number>;
}

// ===== CACHE CONFIGURATION =====
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RolesService {
  // ===== CACHE SYSTEM =====
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para roles específicos

  /**
   * 🎯 Sistema de cache unificado
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
    return requestDeduplicator.deduplicate(key, requestFn);
  }

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * 📋 Obtiene todos los roles
   */
  async getRoles(options?: {
    skip?: number;
    limit?: number;
    useCache?: boolean;
  }): Promise<Role[]> {
    try {
      const { skip = 0, limit = 100, useCache = true } = options || {};
      const cacheKey = createCacheKey('roles_list', { skip, limit });
      
      // Verificar cache
      if (useCache) {
        const cached = this.getFromCache<Role[]>(cacheKey);
        if (cached) return cached;
      }
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando roles desde API...');
        
        const params = new URLSearchParams();
        if (skip > 0) params.append('skip', skip.toString());
        if (limit !== 100) params.append('limit', limit.toString());
        
        const url = `/roles/${params.toString() ? `?${params}` : ''}`;
        const response = await apiClient.get<Role[]>(url);
        
        // Solo cachear si no hay parámetros específicos
        if (skip === 0 && limit === 100) {
          this.setCache(cacheKey, response.data);
        }
        
        console.log(`✅ Cargados ${response.data.length} roles`);
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo roles:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔍 Obtiene un rol por ID con permisos
   */
  async getRoleById(roleId: number, includePermissions = true): Promise<RoleWithPermissions> {
    try {
      const cacheKey = `role_${roleId}_${includePermissions ? 'with' : 'without'}_permissions`;
      
      // Verificar cache
      const cached = this.getFromCache<RoleWithPermissions>(cacheKey);
      if (cached) return cached;
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log(`🔍 Obteniendo rol ${roleId}...`);
        
        const response = await apiClient.get<RoleWithPermissions>(`/roles/${roleId}`);
        
        this.setCache(cacheKey, response.data, this.ROLE_CACHE_DURATION);
        
        console.log(`✅ Rol obtenido: ${response.data.name}`);
        return response.data;
      });
      
    } catch (error) {
      console.error(`❌ Error obteniendo rol ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ➕ Crea un nuevo rol
   */
  async createRole(roleData: RoleCreateRequest): Promise<Role> {
    try {
      console.log('➕ Creando nuevo rol:', roleData.name);
      
      // Validaciones del frontend
      this.validateRoleData(roleData);
      
      const response = await apiClient.post<Role>('/roles/', roleData);
      
      // Invalidar cache
      this.invalidateCache('roles_list');
      
      console.log(`✅ Rol creado: ${response.data.name} (ID: ${response.data.id})`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error creando rol:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ✏️ Actualiza un rol existente
   */
  async updateRole(roleId: number, roleData: RoleUpdateRequest): Promise<Role> {
    try {
      console.log(`✏️ Actualizando rol ${roleId}...`);
      
      // Validaciones del frontend
      if (Object.keys(roleData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }
      
      if (roleData.name !== undefined && !roleData.name.trim()) {
        throw new Error('El nombre del rol no puede estar vacío');
      }
      
      const response = await apiClient.patch<Role>(`/roles/${roleId}`, roleData);
      
      // Invalidar cache relacionado
      this.invalidateCache(`role_${roleId}`);
      this.invalidateCache('roles_list');
      
      console.log(`✅ Rol actualizado: ${response.data.name}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error actualizando rol ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🗑️ Elimina un rol
   */
  async deleteRole(roleId: number): Promise<Role> {
    try {
      console.log(`🗑️ Eliminando rol ${roleId}...`);
      
      const response = await apiClient.delete<Role>(`/roles/${roleId}`);
      
      // Invalidar cache relacionado
      this.invalidateCache(`role_${roleId}`);
      this.invalidateCache('roles_list');
      
      console.log(`✅ Rol eliminado: ${response.data.name}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error eliminando rol ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔗 Asigna permisos a un rol
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<{message: string}> {
    try {
      console.log(`🔗 Asignando ${permissionIds.length} permisos al rol ${roleId}...`);
      
      // Validaciones
      if (!permissionIds || permissionIds.length === 0) {
        throw new Error('Debe proporcionar al menos un permiso');
      }
      
      if (permissionIds.some(id => id <= 0)) {
        throw new Error('Todos los IDs de permisos deben ser números positivos');
      }
      
      const response = await apiClient.post<{message: string}>(`/roles/${roleId}/permissions`, permissionIds);
      
      // Invalidar cache del rol específico
      this.invalidateCache(`role_${roleId}`);
      
      console.log(`✅ Permisos asignados exitosamente al rol ${roleId}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error asignando permisos al rol ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 📊 Obtiene estadísticas de roles
   */
  async getRoleStats(): Promise<RoleStats> {
    try {
      const cacheKey = 'role_stats';
      
      // Verificar cache
      const cached = this.getFromCache<RoleStats>(cacheKey);
      if (cached) return cached;
      
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('📊 Calculando estadísticas de roles...');
        
        const roles = await this.getRoles();
        
        const stats: RoleStats = {
          total: roles.length,
          withPermissions: roles.filter(r => r.permissions && r.permissions.length > 0).length,
          withoutPermissions: roles.filter(r => !r.permissions || r.permissions.length === 0).length,
          byCategory: this.calculateRolesByCategory(roles)
        };
        
        this.setCache(cacheKey, stats, this.CACHE_DURATION * 2); // Cache más largo para estadísticas
        
        return stats;
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de roles:', error);
      return {
        total: 0,
        withPermissions: 0,
        withoutPermissions: 0,
        byCategory: {}
      };
    }
  }

  /**
   * 🔍 Busca roles por nombre
   */
  async searchRoles(query: string): Promise<Role[]> {
    try {
      if (!query.trim()) return [];
      
      console.log(`🔍 Buscando roles: "${query}"`);
      
      // Primero intentar desde cache
      const allRoles = this.getFromCache<Role[]>('roles_list_{"skip":0,"limit":100}');
      if (allRoles) {
        const filtered = allRoles.filter(role => 
          role.name.toLowerCase().includes(query.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(query.toLowerCase()))
        );
        
        console.log(`✅ Búsqueda desde cache: ${filtered.length} resultados`);
        return filtered;
      }
      
      // Si no hay cache, hacer búsqueda completa
      const allRolesFromApi = await this.getRoles();
      return allRolesFromApi.filter(role => 
        role.name.toLowerCase().includes(query.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(query.toLowerCase()))
      );
      
    } catch (error) {
      console.error('❌ Error buscando roles:', error);
      return [];
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * 🧹 Limpia cache específico o todo
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      this.invalidateCache(pattern);
    } else {
      this.cache.clear();
      console.log('🧹 Cache de roles completamente limpiado');
    }
  }

  /**
   * 🔄 Refresca datos
   */
  async refresh(): Promise<void> {
    console.log('🔄 Refrescando datos de roles...');
    this.clearCache();
    await this.getRoles({ useCache: false });
    console.log('✅ Datos de roles refrescados');
  }

  /**
   * 📈 Obtiene estadísticas del cache
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([, entry]) => entry.timestamp);
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  private validateRoleData(roleData: RoleCreateRequest): void {
    if (!roleData.name || !roleData.name.trim()) {
      throw new Error('El nombre del rol es obligatorio');
    }
    
    if (roleData.name.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }
    
    if (roleData.name.trim().length > 50) {
      throw new Error('El nombre no puede exceder 50 caracteres');
    }
    
    if (roleData.description && roleData.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }
  }

  private invalidateCache(pattern: string): void {
    let removedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache invalidado para patrón '${pattern}': ${removedCount} entradas`);
    }
  }

  private calculateRolesByCategory(roles: Role[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    roles.forEach(role => {
      // Categorizar por tipo de rol (puedes ajustar esta lógica)
      let category = 'otros';
      
      const roleName = role.name.toLowerCase();
      if (roleName.includes('admin')) category = 'administración';
      else if (roleName.includes('editor') || roleName.includes('coordinador')) category = 'gestión';
      else if (roleName.includes('usuario') || roleName.includes('viewer')) category = 'usuarios';
      else if (roleName.includes('supervisor') || roleName.includes('manager')) category = 'supervisión';
      
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }
}

// Crear instancia singleton
const rolesService = new RolesService();

export default rolesService;