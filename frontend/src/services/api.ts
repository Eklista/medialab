import axios, { AxiosError, AxiosInstance } from 'axios';
import authService from './auth.service';

// Determinar la URL base según el entorno
export const getBaseUrl = () => {
  return import.meta.env.MODE === 'production'
    ? 'https://medialab.eklista.com/api/v1'
    : 'http://localhost:8000/api/v1';
};

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y redireccionar según la aplicación
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authService.logout();
    }
    return Promise.reject(error);
  }
);

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