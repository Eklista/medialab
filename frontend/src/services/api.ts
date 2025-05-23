// frontend/src/services/api.ts (versión actualizada)
import axios, { AxiosError, AxiosInstance } from 'axios';
import tokenManager from './tokenManager';

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

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Intentar renovar token una vez
      try {
        await tokenManager.checkAuthStatus();
        // Si la renovación es exitosa, reintentar la petición original
        if (error.config) {
          return apiClient.request(error.config);
        }
      } catch (refreshError) {
        // Si falla la renovación, hacer logout
        await tokenManager.logout();
      }
    }
    return Promise.reject(error);
  }
);

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