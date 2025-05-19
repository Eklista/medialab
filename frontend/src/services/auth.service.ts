import apiClient, { handleApiError, getBaseUrl } from './api';
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
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bannerImage?: string;
  phone?: string;
  birthDate?: string;
  joinDate: string;
  lastLogin?: string;
  isActive: boolean;
  isOnline: boolean;
  roles: string[];
  permissions?: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class AuthService {
  // Claves para almacenamiento seguro
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_ID_KEY = 'userId';
  
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      const response = await axios.post<TokenResponse>(
        `${getBaseUrl()}/auth/login`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );  
      
      // Guardar solo tokens, no datos personales
      localStorage.setItem(this.ACCESS_TOKEN_KEY, response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refresh_token);
      }
      
      // Obtener información del usuario
      const userData = await this.getCurrentUser();

      try {
        const userPermissions = await this.getUserPermissions();
        userData.permissions = userPermissions;
      } catch (permissionsError) {
        console.warn('No se pudieron cargar los permisos:', permissionsError);
        userData.permissions = [];
      }

      // Guardar solo ID en localStorage, no datos sensibles
      if (userData && userData.id) {
        localStorage.setItem(this.USER_ID_KEY, userData.id.toString());
      }
      
      return userData;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
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
    // Limpiar solo tokens y datos mínimos
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem('sessionLocked');
    
    window.location.href = '/ml-admin/login';
  }
  
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/users/me');
      return this.normalizeUserData(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  private normalizeUserData(userData: User): User {
    if (!userData.name && (userData.firstName || userData.lastName)) {
      userData.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    }
    
    if (userData.name && (!userData.firstName || !userData.lastName)) {
      const nameParts = userData.name.split(' ');
      if (!userData.firstName) {
        userData.firstName = nameParts[0] || '';
      }
      if (!userData.lastName) {
        userData.lastName = nameParts.slice(1).join(' ') || '';
      }
    }
    
    return userData;
  }

  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/users/me/permissions');
      return response.data || [];
    } catch (error) {
      return [];
    }
  }
  
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/forgot-password',
        { email }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async verifyCode(email: string, code: string): Promise<{ valid: boolean }> {
    try {
      const response = await apiClient.post<{ valid: boolean }>(
        '/auth/verify-code',
        { email, code }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async resetPassword(password: string, confirmPassword: string, code?: string, email?: string): Promise<{ message: string }> {
    try {
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      if (email && code) {
        const response = await apiClient.post<{ message: string }>(
          `/auth/reset-password`,
          { 
            email,
            code,
            new_password: password 
          }
        );
        return response.data;
      } 
      else if (code) {
        const response = await apiClient.post<{ message: string }>(
          `/auth/reset-password/${code}`,
          { new_password: password }
        );
        return response.data;
      } else {
        throw new Error('Falta información necesaria para restablecer la contraseña');
      }
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
    return !!localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}

export default new AuthService();