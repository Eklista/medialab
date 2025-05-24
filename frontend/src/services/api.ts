// frontend/src/services/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

export const getBaseUrl = () => {
  return import.meta.env.MODE === 'production'
    ? 'https://medialab.eklista.com/api/v1'
    : 'http://localhost:8000/api/v1';
};

// Crear instancia de Axios con configuración para cookies
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // ← Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para controlar si estamos haciendo logout
let isLoggingOut = false;

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Si estamos haciendo logout, no intentar renovar tokens
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // console.log('🔄 Token expirado, intentando renovar...');
      
      try {
        // Intentar renovar token una vez
        const refreshResponse = await axios.post(`${getBaseUrl()}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        if (refreshResponse.status === 200) {
          // console.log('✅ Token renovado exitosamente');
          
          // Si la renovación es exitosa, reintentar la petición original
          if (error.config) {
            return apiClient.request(error.config);
          }
        }
      } catch (refreshError) {
        // console.error('💥 Error al renovar token:', refreshError);
        
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

// Función para manejar errores de la API
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data;
      
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
      return 'No se pudo conectar con el servidor';
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

export default apiClient;