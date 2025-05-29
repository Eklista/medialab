// src/services/public.service.ts
import axios from 'axios';
import { getBaseUrl } from '../api';
import { Service } from '../organization/services.service';
import { ServiceTemplate } from '../templates/serviceTemplates.service';
import { TemplateServiceRelation, TemplateSubServiceRelation } from '../templates/serviceTemplates.service';

export interface PublicDepartment {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  type_id: number;
}

class PublicService {
  /**
   * Obtiene departamentos desde el endpoint público
   */
  async getPublicDepartments() {
    try {
      // Usar axios directamente, sin el interceptor de token
      const response = await axios.get<PublicDepartment[]>(`${getBaseUrl()}/public/departments`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener departamentos públicos:', error);
      throw new Error('No se pudieron cargar los departamentos');
    }
  }

  /**
   * Obtiene servicios desde el endpoint público
   */
  async getPublicServices() {
    try {
      // Usar axios directamente, sin el interceptor de token
      const response = await axios.get<Service[]>(`${getBaseUrl()}/public/services`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios públicos:', error);
      throw new Error('No se pudieron cargar los servicios');
    }
  }

  /**
   * Obtiene plantillas de servicios públicas
   */
  async getPublicTemplates() {
    try {
      // Usar axios directamente, sin el interceptor de token
      const response = await axios.get<ServiceTemplate[]>(`${getBaseUrl()}/public/templates`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas públicas:', error);
      throw new Error('No se pudieron cargar las plantillas');
    }
  }

    /**
   * Obtiene la relación entre plantilla y servicios
   */
  async getTemplateServiceRelations(templateId: number): Promise<TemplateServiceRelation[]> {
    try {
      const response = await axios.get<TemplateServiceRelation[]>(
        `${getBaseUrl()}/public/templates/${templateId}/services`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener relaciones de servicios:', error);
      return [];
    }
  }
  
  /**
   * Obtiene la relación entre plantilla y subservicios
   */
  async getTemplateSubServiceRelations(templateId: number): Promise<TemplateSubServiceRelation[]> {
    try {
      const response = await axios.get<TemplateSubServiceRelation[]>(
        `${getBaseUrl()}/public/templates/${templateId}/subservices`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener relaciones de subservicios:', error);
      return [];
    }
  }
}

export default new PublicService();