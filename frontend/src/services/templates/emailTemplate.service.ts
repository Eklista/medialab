// src/services/emailTemplate.service.ts - DEBUG VERSION
import apiClient, { handleApiError } from '../api';

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
  private readonly baseUrl = '/email-templates/';

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      // 🔥 DEBUG: Log completo de la configuración
      console.log('🔍 DEBUG - Email Templates Request Info:');
      console.log('  - Environment:', import.meta.env.MODE);
      console.log('  - Base URL:', apiClient.defaults.baseURL);
      console.log('  - Full URL:', `${apiClient.defaults.baseURL}${this.baseUrl}`);
      console.log('  - Current Location:', window.location.href);
      console.log('  - Protocol:', window.location.protocol);
      
      // Verificar si otros endpoints funcionan primero
      console.log('🧪 Testing basic health endpoint...');
      try {
        const healthResponse = await apiClient.get('/auth/me');
        console.log('✅ Auth endpoint working:', healthResponse.status);
      } catch (healthError) {
        console.log('❌ Auth endpoint failed:', healthError);
      }
      
      console.log('🚀 Attempting email templates request...');
      const response = await apiClient.get<EmailTemplate[]>(this.baseUrl);
      
      console.log('✅ Email templates request successful!');
      console.log('  - Status:', response.status);
      console.log('  - Data length:', response.data?.length || 0);
      console.log('  - Response headers:', response.headers);
      
      return response.data;
    } catch (error: any) {
      console.error('💥 DETAILED ERROR for email templates:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);
      
      if (error.response) {
        console.error('  - Response status:', error.response.status);
        console.error('  - Response data:', error.response.data);
        console.error('  - Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('  - Request made but no response:', error.request);
      }
      
      console.error('  - Full error object:', error);
      
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