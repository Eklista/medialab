// ===================================================================
// frontend/src/services/users/cache/userCache.service.ts  
// Cache inteligente específico para datos de usuarios
// ===================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  lastAccess: number;
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  oldestEntry: number;
  newestEntry: number;
  mostUsedKey: string;
}

class UserCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0
  };

  // Configuración de TTL por tipo de dato
  private readonly TTL_CONFIG = {
    user_profile: 5 * 60 * 1000,      // 5 minutos - perfil de usuario
    user_list: 10 * 60 * 1000,       // 10 minutos - listas de usuarios
    user_stats: 15 * 60 * 1000,      // 15 minutos - estadísticas
    user_presence: 1 * 60 * 1000,    // 1 minuto - estado online
    user_search: 3 * 60 * 1000,      // 3 minutos - resultados de búsqueda
    default: 5 * 60 * 1000            // 5 minutos - por defecto
  } as const;

  /**
   * 🎯 Obtiene datos del cache o los carga usando el loader
   */
  async getOrLoad<T>(
    key: string, 
    loader: () => Promise<T>,
    options?: {
      ttl?: number;
      category?: 'user_profile' | 'user_list' | 'user_stats' | 'user_presence' | 'user_search' | 'default';
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    
    // Si se fuerza refresh, saltar cache
    if (options?.forceRefresh) {
      console.log(`🔄 Force refresh: ${key}`);
      return this.loadAndCache(key, loader, options);
    }

    const cached = this.get<T>(key);
    
    if (cached !== null) {
      console.log(`📦 Cache hit: ${key}`);
      this.stats.hits++;
      return cached;
    }

    console.log(`🔄 Cache miss, loading: ${key}`);
    this.stats.misses++;
    return this.loadAndCache(key, loader, options);
  }

  /**
   * 📦 Obtiene datos del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Actualizar estadísticas de acceso
    entry.hits++;
    entry.lastAccess = Date.now();
    
    return entry.data;
  }

  /**
   * 💾 Guarda datos en el cache
   */
  set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      category?: 'user_profile' | 'user_list' | 'user_stats' | 'user_presence' | 'user_search' | 'default';
    }
  ): void {
    let ttl = this.TTL_CONFIG.default;
    
    if (options?.ttl) {
      ttl = options.ttl;
    } else if (options?.category) {
      switch (options.category) {
        case 'user_profile':
          ttl = this.TTL_CONFIG.user_profile;
          break;
        case 'user_list':
          ttl = this.TTL_CONFIG.user_list;
          break;
        case 'user_stats':
          ttl = this.TTL_CONFIG.user_stats;
          break;
        case 'user_presence':
          ttl = this.TTL_CONFIG.user_presence;
          break;
        case 'user_search':
          ttl = this.TTL_CONFIG.user_search;
          break;
        default:
          ttl = this.TTL_CONFIG.default;
      }
    }
    
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      hits: 0,
      lastAccess: now
    });
    
    console.log(`💾 Cache set: ${key} (TTL: ${ttl/1000}s)`);
    
    // Limpieza automática si el cache crece mucho
    if (this.cache.size > 200) {
      this.cleanup();
    }
  }

  /**
   * 🔥 Precarga datos frecuentemente usados
   */
  async warmup(initialData?: {
    currentUser?: any;
    activeUsers?: any[];
    stats?: any;
  }): Promise<void> {
    console.log('🔥 Iniciando cache warmup...');
    
    if (initialData?.currentUser) {
      this.set('current_user_enhanced', initialData.currentUser, { 
        category: 'user_profile' 
      });
    }
    
    if (initialData?.activeUsers) {
      this.set('active_users_20', initialData.activeUsers, { 
        category: 'user_list' 
      });
    }
    
    if (initialData?.stats) {
      this.set('user_stats', initialData.stats, { 
        category: 'user_stats' 
      });
    }
    
    console.log('✅ Cache warmup completado');
  }

  /**
   * 🧹 Limpia entradas expiradas y menos usadas
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    // Primero, remover entradas expiradas
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      removedCount++;
    });
    
    // Si aún hay muchas entradas, remover las menos usadas
    if (this.cache.size > 150) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits); // Ordenar por hits ascendente
      
      const toRemove = entries.slice(0, 50); // Remover las 50 menos usadas
      for (const [key] of toRemove) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: ${removedCount} entradas removidas`);
    }
  }

  /**
   * ❌ Invalida cache por patrón o clave específica
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }
    
    let removedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    console.log(`🧹 Cache invalidado para patrón '${pattern}': ${removedCount} entradas`);
  }

  /**
   * 🧹 Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('🧹 User cache completamente limpiado');
  }

  /**
   * 📊 Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([, entry]) => entry.timestamp);
    
    let mostUsedKey = '';
    let maxHits = 0;
    
    entries.forEach(([key, entry]) => {
      if (entry.hits > maxHits) {
        maxHits = entry.hits;
        mostUsedKey = key;
      }
    });
    
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalRequests,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      mostUsedKey
    };
  }

  /**
   * 📋 Lista todas las claves en cache con información
   */
  listKeys(): Array<{
    key: string;
    hits: number;
    age: number;
    expiresIn: number;
    size: number;
  }> {
    const now = Date.now();
    
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: now - entry.timestamp,
      expiresIn: Math.max(0, entry.expiresAt - now),
      size: JSON.stringify(entry.data).length
    }));
  }

  /**
   * 🔍 Busca en cache por patrón
   */
  findByPattern(pattern: string): string[] {
    return Array.from(this.cache.keys()).filter(key => key.includes(pattern));
  }

  /**
   * ⚡ Precarga común para pantallas específicas
   */
  async preloadForScreen(screen: 'dashboard' | 'users' | 'profile'): Promise<void> {
    console.log(`⚡ Precargando cache para pantalla: ${screen}`);
    
    switch (screen) {
      case 'dashboard':
        // Pre-cargar datos de dashboard
        await this.preloadKeys([
          'online_users',
          'user_stats',
          'active_users_10'
        ]);
        break;
        
      case 'users':
        // Pre-cargar datos de gestión de usuarios
        await this.preloadKeys([
          'users_list_complete',
          'user_stats'
        ]);
        break;
        
      case 'profile':
        // Pre-cargar datos de perfil
        await this.preloadKeys([
          'current_user_enhanced'
        ]);
        break;
    }
  }

  /**
   * 🔄 Refresca múltiples claves
   */
  async refreshKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    }
    
    console.log(`🔄 ${keys.length} claves marcadas para refresh`);
  }

  /**
   * 📈 Métricas de rendimiento
   */
  getPerformanceMetrics() {
    const stats = this.getStats();
    const entries = this.listKeys();
    
    return {
      ...stats,
      avgHitsPerKey: stats.size > 0 ? stats.totalHits / stats.size : 0,
      cacheEfficiency: stats.hitRate > 80 ? 'Excellent' : 
                      stats.hitRate > 60 ? 'Good' : 
                      stats.hitRate > 40 ? 'Fair' : 'Poor',
      memorySizeKB: Math.round(
        entries.reduce((total, entry) => total + entry.size, 0) / 1024
      ),
      recommendedActions: this.getRecommendations(stats)
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  private async loadAndCache<T>(
    key: string, 
    loader: () => Promise<T>,
    options?: {
      ttl?: number;
      category?: 'user_profile' | 'user_list' | 'user_stats' | 'user_presence' | 'user_search' | 'default';
    }
  ): Promise<T> {
    const data = await loader();
    this.set(key, data, options);
    return data;
  }

  private async preloadKeys(keys: string[]): Promise<void> {
    // En una implementación real, aquí tendrías loaders específicos
    // para cada tipo de clave
    console.log(`⚡ Solicitado preload de ${keys.length} claves:`, keys);
  }

  private getRecommendations(stats: CacheStats): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRate < 50) {
      recommendations.push('Consider increasing cache TTL values');
    }
    
    if (stats.size > 150) {
      recommendations.push('Cache size is large, consider more frequent cleanup');
    }
    
    if (stats.totalRequests > 0 && stats.hitRate > 90) {
      recommendations.push('Excellent cache performance!');
    }
    
    return recommendations;
  }
}

export default new UserCacheService();