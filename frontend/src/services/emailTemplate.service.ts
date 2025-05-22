// src/services/email-template.service.ts
import apiClient, { handleApiError } from './api';

export interface EmailTemplate {
  id: number;
  code: string;
  name: string;
  subject: string;
  body_html: string;
  description?: string;
  available_variables?: string;
  category: string;
  is_active: boolean;
}

export interface EmailTemplateCreateData {
  code: string;
  name: string;
  subject: string;
  body_html: string;
  description?: string;
  available_variables?: string;
  category: string;
  is_active: boolean;
}

export interface EmailTemplateUpdateData {
  name?: string;
  subject?: string;
  body_html?: string;
  description?: string;
  available_variables?: string;
  category?: string;
  is_active?: boolean;
}

export interface RenderTemplateResponse {
  html: string;
}

class EmailTemplateService {
  private readonly baseUrl = '/email-templates';

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await apiClient.get<EmailTemplate[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas de correo:', error);
      throw new Error(handleApiError(error));
    }
  }

  async getEmailTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    try {
      const response = await apiClient.get<EmailTemplate[]>(
        `${this.baseUrl}?category=${category}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas de correo por categoría:', error);
      throw new Error(handleApiError(error));
    }
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get<EmailTemplate>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener plantilla de correo con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  async getEmailTemplateByCode(code: string): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get<EmailTemplate>(`${this.baseUrl}/code/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener plantilla de correo con código ${code}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  async createEmailTemplate(data: EmailTemplateCreateData): Promise<EmailTemplate> {
    try {
      const response = await apiClient.post<EmailTemplate>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear plantilla de correo:', error);
      throw new Error(handleApiError(error));
    }
  }

  async updateEmailTemplate(id: number, data: EmailTemplateUpdateData): Promise<EmailTemplate> {
    try {
      const response = await apiClient.patch<EmailTemplate>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar plantilla de correo con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  async deleteEmailTemplate(id: number): Promise<EmailTemplate> {
    try {
      const response = await apiClient.delete<EmailTemplate>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar plantilla de correo con ID ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  async renderTemplate(
    code: string,
    context: Record<string, any>
  ): Promise<RenderTemplateResponse> {
    try {
      const response = await apiClient.post<RenderTemplateResponse>(`${this.baseUrl}/${code}/render`, {
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error al renderizar plantilla:', error);
      throw new Error(handleApiError(error));
    }
  }

  async sendTestEmail(
    toEmail: string,
    templateCode: string,
    context: Record<string, any>,
    subjectOverride?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/send-test`,
        {
          to_email: toEmail,
          template_code: templateCode,
          context,
          subject_override: subjectOverride
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al enviar correo de prueba:', error);
      throw new Error(handleApiError(error));
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;