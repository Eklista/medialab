import apiClient, { handleApiError } from './api';
import axios from 'axios';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bannerImage?: string;
  phone?: string;
  birthDate?: string;
  joinDate: string;
  lastLogin?: string;
  isActive: boolean;
  isOnline: boolean;
  roles: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<User> {
    try {
      console.log('Intentando login con:', credentials.email);
      
      // IMPORTANTE: FastAPI OAuth2 espera exactamente este formato
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      // Usar Axios directamente para evitar interceptores que puedan causar problemas
      const response = await axios.post<TokenResponse>(
        'http://localhost:8000/api/v1/auth/login', 
        formData
      );
      
      console.log('Login exitoso, respuesta:', response.data);
      
      // Guardar tokens
      localStorage.setItem('accessToken', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refreshToken', response.data.refresh_token);
      }
      
      // Obtener información del usuario usando la instancia apiClient
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Error en login:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Mensaje de error específico según el tipo de error
        if (error.response.status === 401) {
          throw new Error(error.response.data.detail || 'Credenciales incorrectas');
        }
        
        if (error.response.status === 422) {
          throw new Error('Formato de solicitud incorrecto');
        }
      }
      
      throw new Error(handleApiError(error));
    }
  }
  
  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/auth/reset-password/${token}`,
        { new_password: newPassword }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ valid: boolean }>('/auth/verify-password', { 
        password 
      });
      return response.data.valid;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/change-password',
        { current_password: currentPassword, new_password: newPassword }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export default new AuthService();