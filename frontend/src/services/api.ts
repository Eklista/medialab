// frontend/src/services/api.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 🆕 EXTENDER TIPOS DE AXIOS PARA METADATA
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      url?: string;
      method?: string;
    };
  }
}

export const getBaseUrl = () => {
  // 🔥 FIX: Detectar protocolo y entorno correctamente
  const isHttps = window.location.protocol === 'https:';
  const isProduction = import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // Prioridad: Si estamos en HTTPS, usar HTTPS
  if (isHttps) {
    return 'https://medialab.eklista.com/api/v1';
  }
  
  // Si es producción pero no detectamos HTTPS (edge case), forzar HTTPS
  if (isProduction) {
    return 'https://medialab.eklista.com/api/v1';
  }
  
  // Solo en desarrollo local usar HTTP
  if (isDevelopment && !isHttps) {
    return 'http://localhost:8000/api/v1';
  }
  
  // Fallback seguro
  return 'https://medialab.eklista.com/api/v1';
};

// 🆕 SISTEMA DE DEDUPLICACIÓN DE REQUESTS
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      console.log(`🔄 Request deduplicado: ${key}`);
      return existingRequest as Promise<T>;
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear() {
    this.pendingRequests.clear();
    console.log('🧹 Cache de requests limpiado');
  }
  
  getStats() {
    return {
      pendingCount: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys())
    };
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Crear instancia de Axios con configuración para cookies
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // ← Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔥 FIX: Timeout para evitar requests colgados
  timeout: 15000, // 15 segundos
});

// Variable para controlar si estamos haciendo logout
let isLoggingOut = false;

// 🔥 FIX: Control de bucles infinitos mejorado
let refreshAttempts = 0;
let networkErrorCount = 0;
const MAX_REFRESH_ATTEMPTS = 2;
const MAX_NETWORK_ERRORS = 3;
const NETWORK_ERROR_RESET_TIME = 30000; // 30 segundos

// Reset contadores periódicamente
setInterval(() => {
  if (refreshAttempts > 0) {
    console.log('🔄 Resetting refresh attempts counter');
    refreshAttempts = 0;
  }
  if (networkErrorCount > 0) {
    console.log('🌐 Resetting network error counter');
    networkErrorCount = 0;
  }
}, NETWORK_ERROR_RESET_TIME);

// 🆕 INTERCEPTOR PARA MONITOREO DE PERFORMANCE
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Agregar timestamp para debugging de performance
  config.metadata = { 
    startTime: Date.now(),
    url: config.url,
    method: config.method?.toUpperCase()
  };
  
  return config;
});

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    // Reset contadores en respuestas exitosas
    refreshAttempts = 0;
    networkErrorCount = 0;
    
    // 🆕 Log de performance
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      const method = response.config.metadata.method;
      const url = response.config.metadata.url;
      
      // Solo log requests que tomen más de 500ms
      if (duration > 500) {
        console.log(`⚡ API ${method} ${url}: ${duration}ms`);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    // Log de errores con contexto
    if (error.config?.metadata) {
      const duration = Date.now() - error.config.metadata.startTime;
      const method = error.config.metadata.method;
      const url = error.config.metadata.url;
      console.error(`💥 API ${method} ${url} FAILED after ${duration}ms:`, error.message);
    }
    
    // Si estamos haciendo logout, no intentar renovar tokens
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    // 🔥 FIX: Manejo específico de Network Errors (Mixed Content)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      networkErrorCount++;
      console.error(`💥 Network Error #${networkErrorCount}:`, {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        message: error.message,
        code: error.code
      });

      // Si hay muchos network errors, probablemente es Mixed Content
      if (networkErrorCount >= MAX_NETWORK_ERRORS) {
        console.error('🚨 Demasiados Network Errors. Posible problema de Mixed Content o configuración.');
        // No hacer refresh en estos casos, es un problema de configuración
        return Promise.reject(error);
      }
      
      // Para Network Errors, no intentar refresh automático
      return Promise.reject(error);
    }

    // 🔥 FIX: Manejo de 401 con control de bucles
    if (error.response?.status === 401) {
      // Prevenir bucles infinitos
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error(`💥 Máximo número de intentos de refresh alcanzado (${MAX_REFRESH_ATTEMPTS})`);
        refreshAttempts = 0;
        
        // Limpiar sesión y redirigir
        localStorage.removeItem('userId');
        localStorage.removeItem('sessionLocked');
        
        if (!window.location.pathname.includes('/ml-admin/login')) {
          window.location.href = '/ml-admin/login';
        }
        return Promise.reject(error);
      }

      refreshAttempts++;
      console.log(`🔄 Token expirado, intentando renovar... (intento ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
      
      try {
        // Intentar renovar token
        const refreshResponse = await axios.post(`${getBaseUrl()}/auth/refresh`, {}, {
          withCredentials: true,
          timeout: 8000 // Timeout corto para refresh
        });
        
        if (refreshResponse.status === 200) {
          console.log('✅ Token renovado exitosamente');
          refreshAttempts = 0; // Reset contador
          
          // Si la renovación es exitosa, reintentar la petición original
          if (error.config) {
            return apiClient.request(error.config);
          }
        }
      } catch (refreshError) {
        console.error('💥 Error al renovar token:', refreshError);
        refreshAttempts = 0; // Reset contador
        
        // Si falla la renovación, redirigir al login
        localStorage.removeItem('userId');
        localStorage.removeItem('sessionLocked');
        
        // Evitar loops de redirección
        if (!window.location.pathname.includes('/ml-admin/login')) {
          window.location.href = '/ml-admin/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Función para marcar que estamos haciendo logout
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value;
};

// 🔥 FIX: Función para manejar errores de la API mejorada
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Manejo específico para diferentes tipos de errores
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Esto puede ser causado por un problema de configuración de red o Mixed Content. Contacte al administrador.';
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'La solicitud tardó demasiado en responder. Intente nuevamente.';
    }
    
    if (error.response) {
      const data = error.response.data;
      
      // Manejo de errores de validación
      if (data.detail && Array.isArray(data.detail)) {
        return data.detail
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item.msg) return item.msg;
            if (item.message) return item.message;
            if (item.loc && item.msg) return `${item.loc.join('.')}: ${item.msg}`;
            return JSON.stringify(item);
          })
          .join(', ');
      }
      
      if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
     
      return typeof data === 'string' ? data : JSON.stringify(data) || 'Error en el servidor';
    }
    else if (error.request) {
      return 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
    }
    else {
      return error.message || 'Error desconocido';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
 
  return typeof error === 'string' ? error : JSON.stringify(error) || 'Error desconocido';
};

// 🔥 FIX: Función de utilidad para debugging
export const debugApiConfig = () => {
  console.log('🔧 API Configuration Debug:');
  console.log('  - Current URL:', window.location.href);
  console.log('  - Protocol:', window.location.protocol);
  console.log('  - Environment:', import.meta.env.MODE);
  console.log('  - Base URL:', getBaseUrl());
  console.log('  - Request Deduplicator Stats:', requestDeduplicator.getStats());
  console.log('  - Axios defaults:', {
    baseURL: apiClient.defaults.baseURL,
    timeout: apiClient.defaults.timeout,
    withCredentials: apiClient.defaults.withCredentials
  });
};

// Función para resetear contadores manualmente (útil para debugging)
export const resetErrorCounters = () => {
  refreshAttempts = 0;
  networkErrorCount = 0;
  requestDeduplicator.clear();
  console.log('🔄 Error counters y request cache reset manually');
};

// 🆕 FUNCIÓN HELPER PARA CREAR CLAVES DE CACHE
export const createCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}${paramString}`;
};

export default apiClient;