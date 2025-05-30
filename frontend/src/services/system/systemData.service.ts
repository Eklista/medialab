// frontend/src/services/system/systemData.service.ts
// Elimina múltiples llamadas API y centraliza la carga de datos

import apiClient, { handleApiError, requestDeduplicator } from '../api';
import { UserFormatted } from '../users/types/user.types';
import { PermissionCategory } from '../security/permissions.service';
import { 
  Role, 
  Area, 
  SystemDataResponse, 
  SelectiveDataResponse,
  SystemDataOptions,
  SystemDataType 
} from '../../types/system.types';

// ===== CONFIGURACIÓN =====
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
const DEFAULT_TIMEOUT = 8000; // 8 segundos
const DEFAULT_RETRIES = 2;

class SystemDataService {
  private cache: SystemDataResponse | null = null;
  private cacheExpiry = CACHE_DURATION;
  private isLoading = false;
  
  // ===== MÉTODOS PÚBLICOS =====
  
  /**
   * 🚀 CARGA BATCH DE TODOS LOS DATOS DEL SISTEMA
   * Una sola operación para obtener todos los datos necesarios
   */
  async loadAllSystemData(options: SystemDataOptions = {}): Promise<SystemDataResponse> {
    const { forceRefresh = false, timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options;
    const cacheKey = 'system_data_batch_all';
    
    // Verificar cache local si no se fuerza refresh
    if (!forceRefresh && this.isCacheValid()) {
      console.log('📦 Usando datos del sistema desde cache local');
      return this.cache!;
    }
    
    // Evitar múltiples llamadas simultáneas
    if (this.isLoading) {
      console.log('⏳ Carga ya en progreso, esperando...');
      // Esperar un poco y verificar cache nuevamente
      await this.waitForCurrentLoad();
      if (this.cache) return this.cache;
    }
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      return this.performBatchLoad(timeout, retries);
    });
  }
  
  /**
   * 🎯 CARGA SELECTIVA - Solo los tipos de datos especificados
   */
  async loadSelectiveData(
    dataTypes: SystemDataType[], 
    options: SystemDataOptions = {}
  ): Promise<SelectiveDataResponse> {
    const { forceRefresh = false, timeout = DEFAULT_TIMEOUT } = options;
    const cacheKey = `system_data_selective_${dataTypes.sort().join('_')}`;
    
    console.log(`🎯 Cargando datos selectivos: ${dataTypes.join(', ')}`);
    
    // Si tenemos cache completo y no se fuerza refresh, usar cache
    if (!forceRefresh && this.isCacheValid() && this.cache) {
      return this.extractSelectiveFromCache(dataTypes);
    }
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      return this.performSelectiveLoad(dataTypes, timeout);
    });
  }
  
  /**
   * 🔄 REFRESH INTELIGENTE
   * Determina automáticamente si hacer carga completa o selectiva
   */
  async smartRefresh(requiredData?: SystemDataType[]): Promise<SystemDataResponse | SelectiveDataResponse> {
    console.log('🧠 Iniciando refresh inteligente...');
    
    // Si no se especifican datos requeridos, cargar todo
    if (!requiredData || requiredData.length === 0) {
      console.log('📊 Refresh completo - no se especificaron datos requeridos');
      return this.loadAllSystemData({ forceRefresh: true });
    }
    
    // Si se requieren 3 o más tipos de datos, hacer carga completa
    if (requiredData.length >= 3) {
      console.log('📊 Refresh completo - se requieren 3+ tipos de datos');
      return this.loadAllSystemData({ forceRefresh: true });
    }
    
    // Si se requieren pocos datos, hacer carga selectiva
    console.log('🎯 Refresh selectivo - pocos datos requeridos');
    return this.loadSelectiveData(requiredData, { forceRefresh: true });
  }
  
  /**
   * 📊 OBTENER ESTADÍSTICAS DEL SERVICIO
   */
  getStats() {
    return {
      hasCached: !!this.cache,
      cacheAge: this.cache ? Date.now() - this.cache.timestamp : 0,
      isExpired: !this.isCacheValid(),
      isLoading: this.isLoading,
      cacheSize: this.cache ? this.calculateCacheSize() : 0,
      lastLoadTime: this.cache?.loadTime || 0
    };
  }
  
  /**
   * 🧹 LIMPIAR CACHE
   */
  clearCache() {
    this.cache = null;
    requestDeduplicator.clear();
    console.log('🧹 Cache del sistema limpiado');
  }
  
  /**
   * ✅ VERIFICAR DISPONIBILIDAD DE DATOS
   */
  hasData(dataTypes: SystemDataType[]): boolean {
    if (!this.cache || !this.isCacheValid()) return false;
    
    for (const type of dataTypes) {
      switch (type) {
        case 'roles':
          if (this.cache.roles.length === 0) return false;
          break;
        case 'areas':
          if (this.cache.areas.length === 0) return false;
          break;
        case 'users':
          if (this.cache.users.length === 0) return false;
          break;
        case 'permissions':
          if (this.cache.permissionCategories.length === 0) return false;
          break;
      }
    }
    
    return true;
  }
  
  // ===== MÉTODOS PRIVADOS =====
  
  private async performBatchLoad(timeout: number, retries: number): Promise<SystemDataResponse> {
    this.isLoading = true;
    const startTime = Date.now();
    
    try {
      console.log('🔄 Iniciando carga batch de datos del sistema...');
      
      // Configurar timeout para las requests
      const config = { timeout };
      
      // Carga paralela de todos los datos con Promise.allSettled para manejar errores individuales
      const [rolesResult, areasResult, usersResult, categoriesResult] = await Promise.allSettled([
        apiClient.get<Role[]>('/roles/', config),
        apiClient.get<Area[]>('/areas/', config),
        apiClient.get<UserFormatted[]>('/users/', config),
        apiClient.get<PermissionCategory[]>('/permissions/categories', config)
      ]);
      
      // Procesar resultados y manejar errores individuales
      const systemData: SystemDataResponse = {
        roles: this.extractDataFromResult(rolesResult, 'roles'),
        areas: this.extractDataFromResult(areasResult, 'areas'),
        users: this.extractDataFromResult(usersResult, 'users'),
        permissionCategories: this.extractDataFromResult(categoriesResult, 'permissionCategories'),
        timestamp: Date.now(),
        loadTime: Date.now() - startTime
      };
      
      // Validar que al menos algunos datos se cargaron correctamente
      this.validateSystemData(systemData);
      
      // Cachear resultado
      this.cache = systemData;
      
      const endTime = Date.now();
      console.log(`✅ Datos del sistema cargados en ${endTime - startTime}ms:`, {
        roles: systemData.roles.length,
        areas: systemData.areas.length,
        users: systemData.users.length,
        categories: systemData.permissionCategories.length
      });
      
      return systemData;
      
    } catch (error) {
      console.error('💥 Error en carga batch:', error);
      
      // Intentar retry si quedan intentos
      if (retries > 0) {
        console.log(`🔄 Reintentando carga batch... (${retries} intentos restantes)`);
        await this.delay(1000); // Esperar 1 segundo antes del retry
        return this.performBatchLoad(timeout, retries - 1);
      }
      
      throw new Error(handleApiError(error));
    } finally {
      this.isLoading = false;
    }
  }
  
  private async performSelectiveLoad(dataTypes: SystemDataType[], timeout: number): Promise<SelectiveDataResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Cargando datos selectivos: ${dataTypes.join(', ')}`);
      
      const config = { timeout };
      const requests: Promise<any>[] = [];
      const requestMap: SystemDataType[] = [];
      
      // Construir requests solo para los datos requeridos
      if (dataTypes.includes('roles')) {
        requests.push(apiClient.get<Role[]>('/roles/', config));
        requestMap.push('roles');
      }
      if (dataTypes.includes('areas')) {
        requests.push(apiClient.get<Area[]>('/areas/', config));
        requestMap.push('areas');
      }
      if (dataTypes.includes('users')) {
        requests.push(apiClient.get<UserFormatted[]>('/users/', config));
        requestMap.push('users');
      }
      if (dataTypes.includes('permissions')) {
        requests.push(apiClient.get<PermissionCategory[]>('/permissions/categories', config));
        requestMap.push('permissions');
      }
      
      // Ejecutar requests en paralelo
      const results = await Promise.allSettled(requests);
      
      // Construir respuesta selectiva
      const selectiveData: SelectiveDataResponse = {
        timestamp: Date.now(),
        loadTime: Date.now() - startTime
      };
      
      // Mapear resultados a los datos correspondientes
      results.forEach((result, index) => {
        const dataType = requestMap[index];
        
        if (result.status === 'fulfilled') {
          switch (dataType) {
            case 'roles':
              selectiveData.roles = result.value.data;
              break;
            case 'areas':
              selectiveData.areas = result.value.data;
              break;
            case 'users':
              selectiveData.users = result.value.data;
              break;
            case 'permissions':
              selectiveData.permissionCategories = result.value.data;
              break;
          }
        } else {
          console.warn(`⚠️ Error cargando ${dataType}:`, result.reason);
        }
      });
      
      const endTime = Date.now();
      console.log(`✅ Datos selectivos cargados en ${endTime - startTime}ms`);
      
      return selectiveData;
      
    } catch (error) {
      console.error('💥 Error en carga selectiva:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  private extractDataFromResult<T>(result: PromiseSettledResult<any>, dataType: string): T[] {
    if (result.status === 'fulfilled') {
      return result.value.data || [];
    } else {
      console.warn(`⚠️ Error cargando ${dataType}:`, result.reason);
      return [];
    }
  }
  
  private extractSelectiveFromCache(dataTypes: SystemDataType[]): SelectiveDataResponse {
    if (!this.cache) {
      throw new Error('No hay cache disponible para extracción selectiva');
    }
    
    const selective: SelectiveDataResponse = {
      timestamp: this.cache.timestamp,
      loadTime: 0 // No hay tiempo de carga para datos de cache
    };
    
    if (dataTypes.includes('roles')) selective.roles = this.cache.roles;
    if (dataTypes.includes('areas')) selective.areas = this.cache.areas;
    if (dataTypes.includes('users')) selective.users = this.cache.users;
    if (dataTypes.includes('permissions')) selective.permissionCategories = this.cache.permissionCategories;
    
    console.log(`📦 Datos selectivos extraídos del cache: ${dataTypes.join(', ')}`);
    return selective;
  }
  
  private validateSystemData(data: SystemDataResponse) {
    const hasAnyData = data.roles.length > 0 || 
                      data.areas.length > 0 || 
                      data.users.length > 0 || 
                      data.permissionCategories.length > 0;
    
    if (!hasAnyData) {
      throw new Error('No se pudieron cargar datos del sistema - todos los endpoints fallaron');
    }
  }
  
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.cacheExpiry;
  }
  
  private calculateCacheSize(): number {
    if (!this.cache) return 0;
    
    return this.cache.roles.length + 
           this.cache.areas.length + 
           this.cache.users.length + 
           this.cache.permissionCategories.length;
  }
  
  private async waitForCurrentLoad(maxWait = 10000): Promise<void> {
    const startWait = Date.now();
    
    while (this.isLoading && Date.now() - startWait < maxWait) {
      await this.delay(100);
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== EXPORTAR INSTANCIA SINGLETON =====
const systemDataService = new SystemDataService();

export default systemDataService;

// ===== EXPORTAR FUNCIONES DE UTILIDAD =====
export const getSystemDataStats = () => systemDataService.getStats();
export const clearSystemDataCache = () => systemDataService.clearCache();
export const hasSystemData = (dataTypes: SystemDataType[]) => systemDataService.hasData(dataTypes);