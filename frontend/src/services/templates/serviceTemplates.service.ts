// src/services/service-templates.service.ts
import apiClient, { handleApiError } from '../api';
import { Service, SubService } from '../organization/services.service';

// Interfaces para los modelos de plantillas
export interface ServiceTemplate {
  id?: number;
  name: string;
  description?: string;
  is_public: boolean;
  services?: Service[];
  subservices?: SubService[];
  service_selections?: TemplateServiceSelection[];
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

export interface TemplateServiceRelation {
  template_id: number;
  service_id: number;
}

export interface TemplateSubServiceRelation {
  id: number;
  name: string;
  description?: string;
  service_id: number;
  template_id: number;
}

class ServiceTemplatesService {

  async getTemplateServiceRelations(templateId: number): Promise<TemplateServiceRelation[]> {
    try {
      const response = await apiClient.get<TemplateServiceRelation[]>(
        `/service-templates/${templateId}/services`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener relaciones de servicios:', error);
      return [];
    }
  }
  
  async getTemplateSubServiceRelations(templateId: number): Promise<TemplateSubServiceRelation[]> {
    try {
      const response = await apiClient.get<TemplateSubServiceRelation[]>(
        `/service-templates/${templateId}/subservices`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener relaciones de subservicios:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las plantillas de servicios
   */
  async getServiceTemplates(): Promise<ServiceTemplate[]> {
    try {
      const response = await apiClient.get<ServiceTemplate[]>('/service-templates/');
      //console.log('Respuesta completa de getServiceTemplates:', JSON.stringify(response.data, null, 2));
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
      // Modificar el formato para incluir subservicios
      const backendData = {
        name: templateData.name,
        description: templateData.description,
        is_public: templateData.is_public,
        // Enviar selecciones completas de servicios y subservicios
        service_ids: templateData.service_selections.map(sel => sel.service_id),
        // Añadir la estructura completa de selecciones
        service_selections: templateData.service_selections
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
  async updateServiceTemplate(templateId: number, templateData: any): Promise<ServiceTemplate> {
    try {
      // Crear un objeto con los datos básicos
      const backendData: any = {
        name: templateData.name,
        description: templateData.description,
        is_public: templateData.isPublic
      };
  
      // Si hay service_selections, añadirlos al objeto
      if (templateData.service_selections) {
        backendData.service_selections = templateData.service_selections;
        // También incluir service_ids para compatibilidad
        backendData.service_ids = templateData.service_selections.map(
          (sel: any) => sel.service_id
        );
      }
      
      //console.log('Datos enviados al backend:', backendData);
      
      const response = await apiClient.patch<ServiceTemplate>(
        `/service-templates/${templateId}`, 
        backendData
      );
      
      //console.log('Respuesta del backend:', response.data);
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