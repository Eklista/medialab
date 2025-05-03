import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Determinar la URL base según el entorno
export const getBaseUrl = () => {
  return import.meta.env.MODE === 'production' 
    ? 'https://medialab.eklista.com/api/v1'  // URL de producción
    : 'http://localhost:8000/api/v1';         // URL de desarrollo local
};

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token a las peticiones y manejar trailing slashes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar trailing slash a todas las peticiones GET
    if (config.method === 'get' && config.url) {
      // Solo agregar si no tiene trailing slash y no tiene query params
      if (!config.url.endsWith('/') && !config.url.includes('?')) {
        config.url = config.url + '/';
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Si el error es 401 (Unauthorized) y no es una petición de refresh
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        originalRequest.url !== '/auth/refresh-token') {
      
      originalRequest._retry = true;
      
      try {
        // Intentar renovar el token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Si no hay refresh token, ir al login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Llamada a refresh token - usar apiClient en lugar de axios
        const response = await apiClient.post('/auth/refresh-token', {
          refresh_token: refreshToken
        });
        
        // Guardar el nuevo token
        const { access_token } = response.data;
        localStorage.setItem('accessToken', access_token);
        
        // Reintentar la petición original con el nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Manejar otros errores
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
    console.log('Error original:', error);
    
    if (axios.isAxiosError(error)) {
      // Error de respuesta del servidor
      if (error.response) {
        const data = error.response.data;
        console.log('Error response data:', data);
        
        // Manejar el caso específico donde detail es un array
        if (data.detail && Array.isArray(data.detail)) {
          return data.detail
            .map((item: any) => {
              // Manejar diferentes formatos de mensajes de error
              if (typeof item === 'string') return item;
              if (item.msg) return item.msg;
              if (item.message) return item.message;
              if (item.loc && item.msg) return `${item.loc.join('.')}: ${item.msg}`;
              return JSON.stringify(item);
            })
            .join(', ');
        }
        
        // Otros casos que ya manejabas
        if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        
        return typeof data === 'string' ? data : JSON.stringify(data) || 'Error en el servidor';
      }
      // Error de petición (no se pudo enviar)
      else if (error.request) {
        return 'No se pudo conectar con el servidor';
      }
      // Otros errores de axios
      else {
        return error.message || 'Error desconocido';
      }
    }
    
    // Error que no es de axios
    if (error instanceof Error) {
      return error.message;
    }
    
    return typeof error === 'string' ? error : JSON.stringify(error) || 'Error desconocido';
  };

export default apiClient;
