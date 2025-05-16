import axios, { AxiosError, AxiosInstance } from 'axios';

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

// Función para determinar la ruta de login según la aplicación
const getLoginRoute = () => {
  // Si la URL actual comienza con /portal, estamos en portal-frontend
  if (window.location.pathname.startsWith('/portal')) {
    return '/portal/login';
  }
  // Si no, estamos en el frontend principal
  return '/ml-admin/login';
};

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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
    // Si es error 401, redirigir al login correspondiente
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      if (!window.location.href.includes('/login')) {
        window.location.href = getLoginRoute();
      }
    }
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