import apiClient, { handleApiError } from './api';

// Interfaces para las unidades académicas
export interface AcademicUnit {
  id: number;
  abbreviation: string;
  name: string;
  type: 'faculty' | 'department';
  description: string;
}

export interface AcademicUnitCreateRequest {
  abbreviation: string;
  name: string;
  type: 'faculty' | 'department';
  description?: string;
}

export interface AcademicUnitUpdateRequest {
  abbreviation?: string;
  name?: string;
  type?: 'faculty' | 'department';
  description?: string;
}

class AcademicUnitService {
  /**
   * Obtiene todas las unidades académicas
   */
  async getAcademicUnits(): Promise<AcademicUnit[]> {
    try {
      const response = await apiClient.get<AcademicUnit[]>('/departments/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener unidades académicas:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene una unidad académica por ID
   */
  async getAcademicUnitById(id: number): Promise<AcademicUnit> {
    try {
      const response = await apiClient.get<AcademicUnit>(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener unidad académica con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Crea una nueva unidad académica
   */
  async createAcademicUnit(data: AcademicUnitCreateRequest): Promise<AcademicUnit> {
    try {
      const response = await apiClient.post<AcademicUnit>('/departments', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear unidad académica:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza una unidad académica existente
   */
  async updateAcademicUnit(id: number, data: AcademicUnitUpdateRequest): Promise<AcademicUnit> {
    try {
      const response = await apiClient.patch<AcademicUnit>(`/departments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar unidad académica con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina una unidad académica
   */
  async deleteAcademicUnit(id: number): Promise<void> {
    try {
      await apiClient.delete(`/departments/${id}`);
    } catch (error) {
      console.error(`Error al eliminar unidad académica con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Filtra unidades académicas por tipo
   */
  async getAcademicUnitsByType(type: 'faculty' | 'department'): Promise<AcademicUnit[]> {
    try {
      const units = await this.getAcademicUnits();
      return units.filter(unit => unit.type === type);
    } catch (error) {
      console.error(`Error al filtrar unidades por tipo ${type}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new AcademicUnitService();