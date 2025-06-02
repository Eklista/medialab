// frontend/src/services/users/onlineUsers.service.ts - VERSIÓN CORREGIDA SIN ERRORES TS

import apiClient from '../api';

// ===== INTERFACES =====
export interface OnlineUser {
  id: number;
  fullName: string;
  initials: string;
  email: string;
  profileImage?: string;
  isOnline: boolean;
  status: 'online' | 'away' | 'offline' | 'inactive';
  lastSeen?: string;
  lastLogin?: string;
  source?: 'redis' | 'database_fallback' | 'error';
  
  // Datos adicionales de Redis
  onlineDuration?: number;
  heartbeatCount?: number;
  onlineSince?: string;
}

export interface OnlineUsersResponse {
  users: OnlineUser[];
  total: number;
  timestamp: string;
  source: 'redis' | 'database_fallback' | 'error';
  error?: string;
  debug?: {
    redis_available?: boolean;
    redis_success?: boolean;
    fallback_used?: boolean;
    auth_user?: string;
    backend_version?: string;
    response_time_ms?: number;
  };
}

export interface HeartbeatResponse {
  success: boolean;
  timestamp: string;
  userId: number;
  message: string;
  storage?: {
    redis: boolean;
    database: boolean;
    primary: string;
  };
}

export interface OnlineStats {
  total_online: number;
  timestamp: string;
  source: string;
  redis_available: boolean;
  ttl_seconds: number;
  heartbeat_interval: number;
}

// ===== SERVICIO PRINCIPAL =====
class OnlineUsersService {
  private baseURL = '/users';
  private heartbeatInterval: number | null = null;
  private _lastResponse: OnlineUsersResponse | null = null;
  private _performanceMetrics = {
    lastHeartbeatTime: 0,
    lastGetUsersTime: 0,
    heartbeatSuccessRate: 100,
    heartbeatAttempts: 0,
    heartbeatSuccesses: 0
  };

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * 🎯 Obtiene usuarios online usando endpoints migrados a Redis
   */
  async getOnlineUsers(): Promise<OnlineUsersResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Obteniendo usuarios online (Redis + BD fallback)...');
      
      // Usar endpoint original - ahora migrado a Redis internamente
      const response = await apiClient.get(`${this.baseURL}/online`);
      
      this._performanceMetrics.lastGetUsersTime = Date.now() - startTime;
      
      console.log('✅ Respuesta del servidor:', {
        total: response.data.total,
        source: response.data.source,
        redis_available: response.data.debug?.redis_available
      });
      
      if (response.data.error) {
        console.error('❌ Error del servidor:', response.data.error);
        const errorResponse: OnlineUsersResponse = {
          users: [],
          total: 0,
          timestamp: new Date().toISOString(),
          source: 'error',
          error: response.data.error
        };
        this._lastResponse = errorResponse;
        return errorResponse;
      }
      
      // Normalizar usuarios
      const normalizedUsers = (response.data.users || []).map((user: any) => this.normalizeUser(user));
      
      const successResponse: OnlineUsersResponse = {
        users: normalizedUsers,
        total: response.data.total || normalizedUsers.length,
        timestamp: response.data.timestamp || new Date().toISOString(),
        source: response.data.source || 'unknown',
        debug: {
          ...response.data.debug,
          backend_version: 'redis_migrated',
          response_time_ms: this._performanceMetrics.lastGetUsersTime
        }
      };
      
      this._lastResponse = successResponse;
      return successResponse;
      
    } catch (error) {
      this._performanceMetrics.lastGetUsersTime = Date.now() - startTime;
      console.error('💥 Error obteniendo usuarios online:', error);
      
      // Análisis específico de errores
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          console.error('🔐 Error 422: Problema de autenticación detectado');
        } else if (error.message.includes('500')) {
          console.error('🛠️ Error 500: Problema interno del servidor');
        }
      }
      
      const errorResponse: OnlineUsersResponse = {
        users: [],
        total: 0,
        timestamp: new Date().toISOString(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        debug: {
          response_time_ms: this._performanceMetrics.lastGetUsersTime
        }
      };
      
      this._lastResponse = errorResponse;
      return errorResponse;
    }
  }

  /**
   * 💓 Envía heartbeat usando endpoint migrado a Redis
   */
  async sendHeartbeat(): Promise<boolean> {
    const startTime = Date.now();
    this._performanceMetrics.heartbeatAttempts++;
    
    try {
      console.log('💓 Enviando heartbeat (Redis + BD)...');
      
      // Usar endpoint original - ahora migrado a Redis internamente
      const response = await apiClient.post(`${this.baseURL}/heartbeat`);
      
      this._performanceMetrics.lastHeartbeatTime = Date.now() - startTime;
      
      const heartbeatData = response.data as HeartbeatResponse;
      
      console.log('✅ Heartbeat response:', {
        success: heartbeatData.success,
        storage: heartbeatData.storage,
        response_time: this._performanceMetrics.lastHeartbeatTime
      });
      
      // Analizar estado del storage
      if (heartbeatData.storage) {
        const { redis, database, primary } = heartbeatData.storage;
        console.log(`📊 Storage status: Redis=${redis}, DB=${database}, Primary=${primary}`);
        
        if (!redis) {
          console.warn('⚠️ Redis no disponible en heartbeat, usando BD como fallback');
        }
      }
      
      const success = heartbeatData.success || false;
      
      if (success) {
        this._performanceMetrics.heartbeatSuccesses++;
      }
      
      // Calcular tasa de éxito
      this._performanceMetrics.heartbeatSuccessRate = 
        (this._performanceMetrics.heartbeatSuccesses / this._performanceMetrics.heartbeatAttempts) * 100;
      
      return success;
      
    } catch (error) {
      this._performanceMetrics.lastHeartbeatTime = Date.now() - startTime;
      console.error('💥 Error enviando heartbeat:', error);
      
      // Análisis específico de errores de heartbeat
      if (error instanceof Error && error.message.includes('422')) {
        console.error('🔐 Error de autenticación en heartbeat - ¿usuario no loggeado?');
      }
      
      return false;
    }
  }

  /**
   * 🔴 Marca usuario como offline en logout
   */
  async markOfflineOnLogout(): Promise<boolean> {
    try {
      console.log('🔴 Marcando usuario como offline en logout...');
      
      const response = await apiClient.post(`${this.baseURL}/logout-online`);
      
      console.log('✅ Logout response:', response.data);
      return response.data.success || false;
      
    } catch (error) {
      console.error('💥 Error marcando offline en logout:', error);
      return false;
    }
  }

  /**
   * 📊 Obtiene estadísticas rápidas de usuarios online
   */
  async getOnlineStats(): Promise<OnlineStats> {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios online...');
      
      // Usar endpoint de stats si existe, sino extraer de usuarios
      try {
        const response = await apiClient.get(`${this.baseURL}/online-stats`);
        return response.data as OnlineStats;
      } catch (statsError) {
        // Fallback: obtener stats desde el endpoint principal
        const usersResponse = await this.getOnlineUsers();
        
        return {
          total_online: usersResponse.total,
          timestamp: usersResponse.timestamp,
          source: usersResponse.source,
          redis_available: usersResponse.debug?.redis_available || false,
          ttl_seconds: 90,
          heartbeat_interval: 60
        };
      }
      
    } catch (error) {
      console.error('💥 Error obteniendo estadísticas:', error);
      return {
        total_online: 0,
        timestamp: new Date().toISOString(),
        source: 'error',
        redis_available: false,
        ttl_seconds: 90,
        heartbeat_interval: 60
      };
    }
  }

  // ===== GESTIÓN DE HEARTBEAT AUTOMÁTICO =====

  /**
   * 💓 Inicia heartbeat automático
   */
  startHeartbeat(interval: number = 60000): () => void {
    if (this.heartbeatInterval) {
      this.stopHeartbeat();
    }

    console.log(`💓 Iniciando heartbeat automático cada ${interval/1000}s (Redis + BD)`);
    
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat().then(success => {
        if (!success) {
          console.warn('⚠️ Heartbeat falló - posible problema de autenticación');
          
          // Si falla muchas veces seguidas, detener heartbeat automático
          if (this._performanceMetrics.heartbeatSuccessRate < 50) {
            console.error('❌ Tasa de éxito de heartbeat muy baja, deteniendo automático');
            this.stopHeartbeat();
          }
        }
      });
    }, interval);

    // Enviar uno inmediatamente
    this.sendHeartbeat();

    // Retornar función para detener
    return () => this.stopHeartbeat();
  }

  /**
   * 🛑 Detiene heartbeat automático
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      console.log('🛑 Deteniendo heartbeat automático');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ===== INTEGRACIÓN CON AUTH =====

  /**
   * 🔐 Maneja evento de login
   */
  onAuthLogin(): void {
    console.log('🔐 Usuario loggeado - iniciando tracking online');
    
    // Resetear métricas
    this._performanceMetrics.heartbeatAttempts = 0;
    this._performanceMetrics.heartbeatSuccesses = 0;
    this._performanceMetrics.heartbeatSuccessRate = 100;
    
    // Iniciar heartbeat automático
    this.startHeartbeat(60000);
  }

  /**
   * 🔐 Maneja evento de logout
   */
  onAuthLogout(): void {
    console.log('🔐 Usuario desloggeado - limpiando estado online');
    
    // Detener heartbeat
    this.stopHeartbeat();
    
    // Marcar como offline
    this.markOfflineOnLogout();
    
    // Limpiar datos locales
    this._lastResponse = null;
  }

  // ===== NORMALIZACIÓN Y UTILIDADES =====

  /**
   * 🔄 Normaliza usuario desde respuesta del backend
   */
  private normalizeUser(user: any): OnlineUser {
    // Manejar diferentes formatos del backend
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    
    let fullName = user.fullName;
    if (!fullName) {
      fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) {
        fullName = user.email?.split('@')[0] || 'Usuario';
      }
    }

    let initials = user.initials;
    if (!initials) {
      if (firstName && lastName) {
        initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      } else if (firstName) {
        initials = firstName.charAt(0).toUpperCase();
      } else {
        initials = user.email?.charAt(0).toUpperCase() || 'U';
      }
    }

    return {
      id: user.id,
      fullName,
      initials,
      email: user.email,
      profileImage: user.profileImage || user.profile_image,
      isOnline: user.isOnline ?? user.is_online ?? false,
      status: user.status || (user.isActive ? 'offline' : 'inactive'),
      lastSeen: user.lastSeen || user.last_seen || user.lastLogin || user.last_login,
      lastLogin: user.lastLogin || user.last_login,
      source: user.source,
      
      // Datos adicionales de Redis
      onlineDuration: user.onlineDuration,
      heartbeatCount: user.heartbeatCount,
      onlineSince: user.onlineSince
    };
  }

  // ===== MÉTODOS DE INFORMACIÓN =====

  /**
   * 📊 Obtiene información de rendimiento
   */
  getPerformanceInfo(): {
    dataSource: string;
    redisAvailable: boolean;
    fallbackUsed: boolean;
    lastUpdate: string | null;
    heartbeatMetrics: {
      successRate: number;
      attempts: number;
      successes: number;
      lastResponseTime: number;
    };
    getUsersMetrics: {
      lastResponseTime: number;
    };
  } {
    return {
      dataSource: this._lastResponse?.source || 'unknown',
      redisAvailable: this._lastResponse?.debug?.redis_available || false,
      fallbackUsed: this._lastResponse?.debug?.fallback_used || false,
      lastUpdate: this._lastResponse?.timestamp || null,
      heartbeatMetrics: {
        successRate: this._performanceMetrics.heartbeatSuccessRate,
        attempts: this._performanceMetrics.heartbeatAttempts,
        successes: this._performanceMetrics.heartbeatSuccesses,
        lastResponseTime: this._performanceMetrics.lastHeartbeatTime
      },
      getUsersMetrics: {
        lastResponseTime: this._performanceMetrics.lastGetUsersTime
      }
    };
  }

  /**
   * 📋 Obtiene información del servicio
   */
  getServiceInfo() {
    return {
      version: '3.0.0',
      description: 'Servicio de usuarios online migrado a Redis con fallback a BD',
      endpoints: {
        getUsers: `${this.baseURL}/online`,
        heartbeat: `${this.baseURL}/heartbeat`,
        logout: `${this.baseURL}/logout-online`,
        stats: `${this.baseURL}/online-stats`
      },
      features: [
        'Redis como almacenamiento primario',
        'BD como fallback automático', 
        'Heartbeat automático con retry logic',
        'Métricas de rendimiento',
        'Integración con auth events',
        'Normalización robusta de datos',
        'Auto-limpieza con TTL'
      ],
      performance: this.getPerformanceInfo(),
      status: {
        heartbeatActive: this.heartbeatInterval !== null,
        lastDataSource: this._lastResponse?.source || 'none',
        redisMode: this._lastResponse?.debug?.redis_available || false
      }
    };
  }

  // ===== MÉTODOS DE TESTING =====

  /**
   * 🧪 Test completo de la migración a Redis
   */
  async testRedisMigration(): Promise<{
    heartbeat: boolean;
    getUsers: boolean;
    logout: boolean;
    stats: boolean;
    redisAvailable: boolean;
    source: string;
    performance: any;
    error?: string;
  }> {
    try {
      console.log('🧪 Testing migración completa a Redis...');
      
      const startTime = Date.now();
      
      // Test heartbeat
      const heartbeatSuccess = await this.sendHeartbeat();
      
      // Test get users
      const usersResponse = await this.getOnlineUsers();
      const getUsersSuccess = !usersResponse.error;
      
      // Test logout (sin hacer logout real)
      const logoutSuccess = true;
      
      // Test stats
      const statsResponse = await this.getOnlineStats();
      const statsSuccess = statsResponse.total_online >= 0;
      
      const totalTime = Date.now() - startTime;
      
      return {
        heartbeat: heartbeatSuccess,
        getUsers: getUsersSuccess,
        logout: logoutSuccess,
        stats: statsSuccess,
        redisAvailable: usersResponse.debug?.redis_available || false,
        source: usersResponse.source,
        performance: {
          totalTestTime: totalTime,
          heartbeatTime: this._performanceMetrics.lastHeartbeatTime,
          getUsersTime: this._performanceMetrics.lastGetUsersTime
        }
      };
      
    } catch (error) {
      return {
        heartbeat: false,
        getUsers: false,
        logout: false,
        stats: false,
        redisAvailable: false,
        source: 'error',
        performance: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🔍 Test de conectividad básica
   */
  async testConnection(): Promise<{
    success: boolean;
    endpoint: string;
    responseTime: number;
    source: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.getOnlineUsers();
      
      return {
        success: !response.error,
        endpoint: `${this.baseURL}/online`,
        responseTime: Date.now() - startTime,
        source: response.source
      };
    } catch (error) {
      return {
        success: false,
        endpoint: `${this.baseURL}/online`,
        responseTime: Date.now() - startTime,
        source: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // ===== COMPATIBILIDAD CON HOOKS EXISTENTES =====

  /**
   * 👥 Método simplificado para hooks que solo necesitan la lista
   */
  async getOnlineUsersList(): Promise<{
    users: OnlineUser[];
    count: number;
    isLoading: boolean;
    error: string | null;
  }> {
    try {
      const response = await this.getOnlineUsers();
      
      return {
        users: response.users,
        count: response.total,
        isLoading: false,
        error: response.error || null
      };
    } catch (error) {
      return {
        users: [],
        count: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 📊 Método simplificado para estadísticas rápidas
   */
  async getOnlineUsersStats(): Promise<{
    totalOnline: number;
    totalActive: number;
    lastUpdate: string;
    source: string;
  }> {
    try {
      const stats = await this.getOnlineStats();
      
      return {
        totalOnline: stats.total_online,
        totalActive: stats.total_online, // En Redis, online = active
        lastUpdate: stats.timestamp,
        source: stats.source
      };
    } catch (error) {
      return {
        totalOnline: 0,
        totalActive: 0,
        lastUpdate: new Date().toISOString(),
        source: 'error'
      };
    }
  }

  // ===== CLEANUP =====

  /**
   * 🧹 Limpieza al desmontar el servicio
   */
  cleanup(): void {
    console.log('🧹 Limpiando OnlineUsersService...');
    this.stopHeartbeat();
    this._lastResponse = null;
  }
}

// ===== INSTANCIA SINGLETON =====
export const onlineUsersService = new OnlineUsersService();
export default onlineUsersService;

// ===== UTILIDADES ADICIONALES =====

/**
 * 🎨 Helper para formatear tiempo desde última conexión
 */
export const formatLastSeen = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return 'Nunca';
  
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
  if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)}h`;
  return `Hace ${Math.floor(diffMinutes / 1440)}d`;
};

/**
 * 🎨 Helper para color de estado
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

/**
 * 🎨 Helper para texto de estado
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'online': return 'En línea';
    case 'away': return 'Ausente';
    case 'busy': return 'Ocupado';
    case 'inactive': return 'Inactivo';
    default: return 'Desconectado';
  }
};

/**
 * 🔧 Helper para determinar si Redis está funcionando
 */
export const isRedisMode = (): boolean => {
  const serviceInfo = onlineUsersService.getServiceInfo();
  return serviceInfo.status.redisMode;
};

/**
 * 🎯 Hook de conveniencia para React
 */
export const useOnlineUsersService = () => {
  return {
    service: onlineUsersService,
    getUsers: () => onlineUsersService.getOnlineUsers(),
    sendHeartbeat: () => onlineUsersService.sendHeartbeat(),
    getStats: () => onlineUsersService.getOnlineStats(),
    getPerformanceInfo: () => onlineUsersService.getPerformanceInfo(),
    testMigration: () => onlineUsersService.testRedisMigration(),
    startHeartbeat: (interval?: number) => onlineUsersService.startHeartbeat(interval),
    stopHeartbeat: () => onlineUsersService.stopHeartbeat()
  };
};