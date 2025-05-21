// src/services/smtp.service.ts (versión actualizada y completa)
import apiClient, { handleApiError } from './api';

export interface SmtpConfig {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  use_ssl: boolean;
  timeout: number;
  default_from_name: string;
  default_from_email: string;
  is_active: boolean;
  updated_at: string;
}

export interface SmtpConfigCreateRequest {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  use_ssl: boolean;
  timeout?: number;
  default_from_name: string;
  default_from_email: string;
  is_active?: boolean;
}

export interface SmtpConfigUpdateRequest {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  use_tls?: boolean;
  use_ssl?: boolean;
  timeout?: number;
  default_from_name?: string;
  default_from_email?: string;
  is_active?: boolean;
}

export interface SmtpTestRequest {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  use_ssl: boolean;
  default_from_email: string;
}

export interface TestEmailRequest {
  to_email: string;
  subject: string;
  message: string;
}

class SmtpService {
  /**
   * Obtiene todas las configuraciones SMTP
   */
  async getSmtpConfigs(): Promise<SmtpConfig[]> {
    try {
      const response = await apiClient.get<SmtpConfig[]>('/smtp-config/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuraciones SMTP:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene una configuración SMTP por ID
   */
  async getSmtpConfigById(id: number): Promise<SmtpConfig> {
    try {
      const response = await apiClient.get<SmtpConfig>(`/smtp-config/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener configuración SMTP con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Crea una nueva configuración SMTP
   */
  async createSmtpConfig(data: SmtpConfigCreateRequest): Promise<SmtpConfig> {
    try {
      const response = await apiClient.post<SmtpConfig>('/smtp-config/', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear configuración SMTP:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza una configuración SMTP existente
   */
  async updateSmtpConfig(id: number, data: SmtpConfigUpdateRequest): Promise<SmtpConfig> {
    try {
      const response = await apiClient.patch<SmtpConfig>(`/smtp-config/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar configuración SMTP con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina una configuración SMTP
   */
  async deleteSmtpConfig(id: number): Promise<void> {
    try {
      await apiClient.delete(`/smtp-config/${id}`);
    } catch (error) {
      console.error(`Error al eliminar configuración SMTP con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Activa una configuración SMTP
   */
  async activateSmtpConfig(id: number): Promise<SmtpConfig> {
    try {
      const response = await apiClient.post<SmtpConfig>(`/smtp-config/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Error al activar configuración SMTP con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Prueba una configuración SMTP
   */
  async testSmtpConfig(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(`/smtp-config/${id}/test`);
      return response.data;
    } catch (error) {
      console.error(`Error al probar configuración SMTP con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Prueba una conexión SMTP con los datos proporcionados (sin guardar)
   */
  async testSmtpConnection(data: SmtpTestRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/smtp-config/test-connection', data);
      return response.data;
    } catch (error) {
      console.error('Error al probar conexión SMTP:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Envía un correo de prueba usando la configuración SMTP activa
   */
  async sendTestEmail(data: TestEmailRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/smtp-config/send-test-email', data);
      return response.data;
    } catch (error) {
      console.error('Error al enviar correo de prueba:', error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new SmtpService();