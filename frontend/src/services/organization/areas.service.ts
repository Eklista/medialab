// frontend/src/services/organization/areas.service.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

// ===== INTERFACES =====
export interface Area {
  id: number;
  name: string;
  description?: string;
}

export interface AreaCreateRequest {
  name: string;
  description?: string;
}

export interface AreaUpdateRequest {
  name?: string;
  description?: string;
}

export interface AreaStats {
  total: number;
  withDescription: number;
  withoutDescription: number;
  averageNameLength: number;
}

// ===== CACHE CONFIGURATION =====
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class AreasService {
  // ===== CACHE SYSTEM =====
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly AREA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para áreas específicas

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
   * 🏢 Obtiene todas las áreas
   */
  async getAreas(options?: {
    skip?: number;
    limit?: number;
    useCache?: boolean;
  }): Promise<Area[]> {
    try {
      const { skip = 0, limit = 100, useCache = true } = options || {};
      const cacheKey = createCacheKey('areas_list', { skip, limit });
      
      // Verificar cache
      if (useCache) {
        const cached = this.getFromCache<Area[]>(cacheKey);
        if (cached) return cached;
      }
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('🔄 Cargando áreas desde API...');
        
        const params = new URLSearchParams();
        if (skip > 0) params.append('skip', skip.toString());
        if (limit !== 100) params.append('limit', limit.toString());
        
        const url = `/areas/${params.toString() ? `?${params}` : ''}`;
        const response = await apiClient.get<Area[]>(url);
        
        // Solo cachear si no hay parámetros específicos
        if (skip === 0 && limit === 100) {
          this.setCache(cacheKey, response.data);
        }
        
        console.log(`✅ Cargadas ${response.data.length} áreas`);
        return response.data;
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo áreas:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔍 Obtiene un área por ID
   */
  async getAreaById(areaId: number): Promise<Area> {
    try {
      const cacheKey = `area_${areaId}`;
      
      // Verificar cache
      const cached = this.getFromCache<Area>(cacheKey);
      if (cached) return cached;
      
      // Deduplicar requests
      return this.deduplicateRequest(cacheKey, async () => {
        console.log(`🔍 Obteniendo área ${areaId}...`);
        
        const response = await apiClient.get<Area>(`/areas/${areaId}`);
        
        this.setCache(cacheKey, response.data, this.AREA_CACHE_DURATION);
        
        console.log(`✅ Área obtenida: ${response.data.name}`);
        return response.data;
      });
      
    } catch (error) {
      console.error(`❌ Error obteniendo área ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ➕ Crea una nueva área
   */
  async createArea(areaData: AreaCreateRequest): Promise<Area> {
    try {
      console.log('➕ Creando nueva área:', areaData.name);
      
      // Validaciones del frontend
      this.validateAreaData(areaData);
      
      const response = await apiClient.post<Area>('/areas/', areaData);
      
      // Invalidar cache
      this.invalidateCache('areas_list');
      
      console.log(`✅ Área creada: ${response.data.name} (ID: ${response.data.id})`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error creando área:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ✏️ Actualiza un área existente
   */
  async updateArea(areaId: number, areaData: AreaUpdateRequest): Promise<Area> {
    try {
      console.log(`✏️ Actualizando área ${areaId}...`);
      
      // Validaciones del frontend
      if (Object.keys(areaData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }
      
      if (areaData.name !== undefined && !areaData.name.trim()) {
        throw new Error('El nombre del área no puede estar vacío');
      }
      
      if (areaData.name !== undefined) {
        this.validateAreaName(areaData.name);
      }
      
      if (areaData.description !== undefined && areaData.description.length > 500) {
        throw new Error('La descripción no puede exceder 500 caracteres');
      }
      
      const response = await apiClient.patch<Area>(`/areas/${areaId}`, areaData);
      
      // Invalidar cache relacionado
      this.invalidateCache(`area_${areaId}`);
      this.invalidateCache('areas_list');
      
      console.log(`✅ Área actualizada: ${response.data.name}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error actualizando área ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🗑️ Elimina un área
   */
  async deleteArea(areaId: number): Promise<Area> {
    try {
      console.log(`🗑️ Eliminando área ${areaId}...`);
      
      const response = await apiClient.delete<Area>(`/areas/${areaId}`);
      
      // Invalidar cache relacionado
      this.invalidateCache(`area_${areaId}`);
      this.invalidateCache('areas_list');
      
      console.log(`✅ Área eliminada: ${response.data.name}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error eliminando área ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 📊 Obtiene estadísticas de áreas
   */
  async getAreaStats(): Promise<AreaStats> {
    try {
      const cacheKey = 'area_stats';
      
      // Verificar cache
      const cached = this.getFromCache<AreaStats>(cacheKey);
      if (cached) return cached;
      
      return this.deduplicateRequest(cacheKey, async () => {
        console.log('📊 Calculando estadísticas de áreas...');
        
        const areas = await this.getAreas();
        
        const stats: AreaStats = {
          total: areas.length,
          withDescription: areas.filter(a => a.description && a.description.trim().length > 0).length,
          withoutDescription: areas.filter(a => !a.description || a.description.trim().length === 0).length,
          averageNameLength: areas.length > 0 
            ? Math.round(areas.reduce((sum, area) => sum + area.name.length, 0) / areas.length)
            : 0
        };
        
        this.setCache(cacheKey, stats, this.CACHE_DURATION * 2); // Cache más largo para estadísticas
        
        return stats;
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de áreas:', error);
      return {
        total: 0,
        withDescription: 0,
        withoutDescription: 0,
        averageNameLength: 0
      };
    }
  }

  /**
   * 🔍 Busca áreas por nombre o descripción
   */
  async searchAreas(query: string): Promise<Area[]> {
    try {
      if (!query.trim()) return [];
      
      console.log(`🔍 Buscando áreas: "${query}"`);
      
      // Primero intentar desde cache
      const allAreas = this.getFromCache<Area[]>('areas_list_{"skip":0,"limit":100}');
      if (allAreas) {
        const filtered = allAreas.filter(area => 
          area.name.toLowerCase().includes(query.toLowerCase()) ||
          (area.description && area.description.toLowerCase().includes(query.toLowerCase()))
        );
        
        console.log(`✅ Búsqueda desde cache: ${filtered.length} resultados`);
        return filtered;
      }
      
      // Si no hay cache, hacer búsqueda completa
      const allAreasFromApi = await this.getAreas();
      return allAreasFromApi.filter(area => 
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        (area.description && area.description.toLowerCase().includes(query.toLowerCase()))
      );
      
    } catch (error) {
      console.error('❌ Error buscando áreas:', error);
      return [];
    }
  }

  /**
   * 🏢 Obtiene áreas ordenadas por nombre
   */
  async getAreasSorted(order: 'asc' | 'desc' = 'asc'): Promise<Area[]> {
    try {
      const areas = await this.getAreas();
      
      return areas.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        return order === 'asc' ? comparison : -comparison;
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo áreas ordenadas:', error);
      return [];
    }
  }

  /**
   * 📋 Obtiene áreas para select/dropdown
   */
  async getAreasForSelect(): Promise<Array<{value: number; label: string; description?: string}>> {
    try {
      const areas = await this.getAreasSorted('asc');
      
      return areas.map(area => ({
        value: area.id,
        label: area.name,
        description: area.description
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo áreas para select:', error);
      return [];
    }
  }

  /**
   * ✅ Verifica si un área existe por nombre
   */
  async areaExists(name: string, excludeId?: number): Promise<boolean> {
    try {
      const areas = await this.getAreas();
      
      return areas.some(area => 
        area.name.toLowerCase() === name.toLowerCase() && 
        area.id !== excludeId
      );
      
    } catch (error) {
      console.error('❌ Error verificando existencia de área:', error);
      return false;
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
      console.log('🧹 Cache de áreas completamente limpiado');
    }
  }

  /**
   * 🔄 Refresca datos
   */
  async refresh(): Promise<void> {
    console.log('🔄 Refrescando datos de áreas...');
    this.clearCache();
    await this.getAreas({ useCache: false });
    console.log('✅ Datos de áreas refrescados');
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

  /**
   * 🏷️ Genera sugerencias de nombres basadas en áreas existentes
   */
  async getNameSuggestions(partialName: string): Promise<string[]> {
    try {
      if (!partialName.trim()) return [];
      
      const areas = await this.getAreas();
      const suggestions = new Set<string>();
      
      // Sugerencias basadas en nombres similares
      const partial = partialName.toLowerCase();
      
      areas.forEach(area => {
        if (area.name.toLowerCase().includes(partial)) {
          suggestions.add(area.name);
        }
      });
      
      // Sugerencias comunes para áreas organizacionales
      const commonSuggestions = [
        'Producción', 'Diseño', 'Marketing', 'Ventas', 'Administración',
        'Recursos Humanos', 'Finanzas', 'Operaciones', 'Logística',
        'Calidad', 'Investigación', 'Desarrollo', 'Soporte Técnico',
        'Atención al Cliente', 'Compras', 'Legal', 'Comunicaciones',
        'Transmisión', 'Redacción', 'Fotografía', 'Video', 'Audio'
      ];
      
      commonSuggestions.forEach(suggestion => {
        if (suggestion.toLowerCase().includes(partial)) {
          suggestions.add(suggestion);
        }
      });
      
      return Array.from(suggestions).slice(0, 8); // Máximo 8 sugerencias
      
    } catch (error) {
      console.error('❌ Error generando sugerencias:', error);
      return [];
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private validateAreaData(areaData: AreaCreateRequest): void {
    if (!areaData.name || !areaData.name.trim()) {
      throw new Error('El nombre del área es obligatorio');
    }
    
    this.validateAreaName(areaData.name);
    
    if (areaData.description && areaData.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }
  }

  private validateAreaName(name: string): void {
    if (name.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }
    
    if (name.trim().length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }
    
    // Validar caracteres permitidos (letras, números, espacios, algunos símbolos)
    const validNameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s\-_&.,()]+$/;
    if (!validNameRegex.test(name)) {
      throw new Error('El nombre contiene caracteres no válidos');
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
}

// Crear instancia singleton
const areasService = new AreasService();

export default areasService;