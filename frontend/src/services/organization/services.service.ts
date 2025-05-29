import apiClient, { handleApiError } from '../api';

// Interfaces para los modelos de servicios
export interface SubService {
  id?: number;
  name: string;
  description?: string;
  service_id?: number;
}

export interface Service {
  id?: number;
  name: string;
  description?: string;
  icon_name?: string;
  sub_services: SubService[];
}

// Interfaz para crear/actualizar servicios
export interface ServiceCreateRequest {
  name: string;
  description?: string;
  icon_name?: string;
  sub_services?: Omit<SubService, 'service_id' | 'id'>[];
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  icon_name?: string;
}

export interface SubServiceCreateRequest {
  name: string;
  description?: string;
}

export interface SubServiceUpdateRequest {
  name?: string;
  description?: string;
}

class ServicesService {
  /**
   * Obtiene todos los servicios
   */
  async getServices(): Promise<Service[]> {
    try {
      const response = await apiClient.get<Service[]>('/services/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene un servicio por ID
   */
  async getServiceById(serviceId: number): Promise<Service> {
    try {
      const response = await apiClient.get<Service>(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener servicio con ID ${serviceId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Crea un nuevo servicio
   */
  async createService(serviceData: ServiceCreateRequest): Promise<Service> {
    try {
      const response = await apiClient.post<Service>('/services/', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error al crear servicio:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza un servicio existente
   */
  async updateService(serviceId: number, serviceData: ServiceUpdateRequest): Promise<Service> {
    try {
      const response = await apiClient.patch<Service>(`/services/${serviceId}`, serviceData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar servicio con ID ${serviceId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina un servicio
   */
  async deleteService(serviceId: number): Promise<void> {
    try {
      await apiClient.delete(`/services/${serviceId}`);
    } catch (error) {
      console.error(`Error al eliminar servicio con ID ${serviceId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Añade un sub-servicio a un servicio existente
   */
  async addSubService(serviceId: number, subServiceData: SubServiceCreateRequest): Promise<SubService> {
    try {
      const response = await apiClient.post<SubService>(
        `/services/${serviceId}/sub-services`, 
        subServiceData
      );
      return response.data;
    } catch (error) {
      console.error('Error al añadir sub-servicio:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza un sub-servicio existente
   */
  async updateSubService(subServiceId: number, subServiceData: SubServiceUpdateRequest): Promise<SubService> {
    try {
      const response = await apiClient.patch<SubService>(
        `/services/sub-services/${subServiceId}`, 
        subServiceData
      );
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar sub-servicio con ID ${subServiceId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina un sub-servicio
   */
  async deleteSubService(subServiceId: number): Promise<void> {
    try {
      await apiClient.delete(`/services/sub-services/${subServiceId}`);
    } catch (error) {
      console.error(`Error al eliminar sub-servicio con ID ${subServiceId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new ServicesService();