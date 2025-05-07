// src/services/public.service.ts
import axios from 'axios';
import { getBaseUrl } from './api';
import { Service } from './services.service';
import { ServiceTemplate } from './service-templates.service';

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
}

export default new PublicService();