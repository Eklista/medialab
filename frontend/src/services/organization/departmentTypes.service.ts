// src/services/departmentTypes.service.ts
import apiClient, { handleApiError } from '../api';

export interface DepartmentType {
  id: number;
  name: string;
}

export interface DepartmentTypeCreateRequest {
  name: string;
}

export interface DepartmentTypeUpdateRequest {
  name?: string;
}

class DepartmentTypeService {
  /**
   * Obtiene todos los tipos de departamentos
   */
  async getDepartmentTypes(): Promise<DepartmentType[]> {
    try {
      // Usando guión normal para mantener consistencia con otros endpoints
      const response = await apiClient.get<DepartmentType[]>('/department-types/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener tipos de departamentos:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene un tipo de departamento por ID
   */
  async getDepartmentTypeById(id: number): Promise<DepartmentType> {
    try {
      const response = await apiClient.get<DepartmentType>(`/department-types/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener tipo de departamento con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Crea un nuevo tipo de departamento
   */
  async createDepartmentType(data: DepartmentTypeCreateRequest): Promise<DepartmentType> {
    try {
      //console.log('Creando nuevo tipo de departamento:', data);
      const response = await apiClient.post<DepartmentType>('/department-types/', data);
      //console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear tipo de departamento:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza un tipo de departamento existente
   */
  async updateDepartmentType(id: number, data: DepartmentTypeUpdateRequest): Promise<DepartmentType> {
    try {
      const response = await apiClient.patch<DepartmentType>(`/department-types/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar tipo de departamento con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina un tipo de departamento
   */
  async deleteDepartmentType(id: number): Promise<void> {
    try {
      await apiClient.delete(`/department-types/${id}`);
    } catch (error) {
      console.error(`Error al eliminar tipo de departamento con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new DepartmentTypeService();