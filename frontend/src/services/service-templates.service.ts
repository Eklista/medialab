// src/services/service-templates.service.ts
import apiClient, { handleApiError } from './api';
import { Service } from './services.service';

// Interfaces para los modelos de plantillas
export interface ServiceTemplate {
  id?: number;
  name: string;
  description?: string;
  is_public: boolean;
  services?: Service[];
}

export interface TemplateServiceSelection {
  service_id: number;
  sub_service_ids: number[]; 
}

// Interfaz para crear/actualizar plantillas
export interface ServiceTemplateCreateRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  service_selections: TemplateServiceSelection[];
}

export interface ServiceTemplateUpdateRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  service_ids?: number[];
}

class ServiceTemplatesService {
  /**
   * Obtiene todas las plantillas de servicios
   */
  async getServiceTemplates(): Promise<ServiceTemplate[]> {
    try {
      const response = await apiClient.get<ServiceTemplate[]>('/service-templates/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas de servicios:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene una plantilla por ID
   */
  async getServiceTemplateById(templateId: number): Promise<ServiceTemplate> {
    try {
      const response = await apiClient.get<ServiceTemplate>(`/service-templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener plantilla con ID ${templateId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Crea una nueva plantilla de servicios
   */
  async createServiceTemplate(templateData: ServiceTemplateCreateRequest): Promise<ServiceTemplate> {
    try {
      // Convertir a formato que entiende el backend actual
      const backendData = {
        name: templateData.name,
        description: templateData.description,
        is_public: templateData.is_public,
        // Extraer solo los IDs de servicios para el backend actual
        service_ids: templateData.service_selections.map(sel => sel.service_id)
      };
      
      const response = await apiClient.post<ServiceTemplate>('/service-templates/', backendData);
      return response.data;
    } catch (error) {
      console.error('Error al crear plantilla de servicios:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza una plantilla existente
   */
  async updateServiceTemplate(templateId: number, templateData: ServiceTemplateUpdateRequest): Promise<ServiceTemplate> {
    try {
      const response = await apiClient.patch<ServiceTemplate>(`/service-templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar plantilla con ID ${templateId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina una plantilla
   */
  async deleteServiceTemplate(templateId: number): Promise<void> {
    try {
      await apiClient.delete(`/service-templates/${templateId}`);
    } catch (error) {
      console.error(`Error al eliminar plantilla con ID ${templateId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new ServiceTemplatesService();