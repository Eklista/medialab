// frontend/src/services/auth.service.ts
import { handleApiError, getBaseUrl } from './api';
import tokenManager from './tokenManager';

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
  /**
   * Inicia sesión utilizando el sistema de cookies seguro
   */
  async login(credentials: { email: string; password: string }): Promise<User> {
    try {
      // Usar el token manager para el login (maneja cookies automáticamente)
      await tokenManager.login(credentials);
      
      // Obtener información del usuario
      const userData = await this.getCurrentUser();
      
      // Cargar permisos del usuario
      try {
        const userPermissions = await this.getUserPermissions();
        userData.permissions = userPermissions;
      } catch (permissionsError) {
        console.warn('No se pudieron cargar los permisos:', permissionsError);
        userData.permissions = [];
      }

      // Solo guardar ID del usuario en localStorage (dato no sensible)
      if (userData && userData.id) {
        localStorage.setItem('userId', userData.id.toString());
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Cierra la sesión limpiando cookies y datos locales
   */
  async logout(): Promise<void> {
    // Limpiar solo datos no sensibles del localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionLocked');
    
    // El tokenManager se encarga de limpiar cookies y llamar al endpoint de logout
    await tokenManager.logout();
  }

  /**
   * Obtiene la información del usuario actual usando cookies
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/users/me`);
      
      if (!response.ok) {
        throw new Error('Failed to get current user');
      }
      
      const userData = await response.json();
      return this.normalizeUserData(userData);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Normaliza los datos del usuario para manejar diferentes formatos de API
   */
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

  /**
   * Obtiene los permisos del usuario actual
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/users/me/permissions`);
      
      if (!response.ok) {
        return [];
      }
      
      const permissions = await response.json();
      return permissions || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Verifica el estado de autenticación de forma asíncrona
   */
  async checkAuthStatus(): Promise<boolean> {
    return await tokenManager.checkAuthStatus();
  }
  
  /**
   * Envía solicitud de recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send password reset');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Verifica el código de recuperación de contraseña
   */
  async verifyCode(email: string, code: string): Promise<{ valid: boolean }> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to verify code');
      }

      return await response.json();
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Restablece la contraseña usando el código de verificación
   */
  async resetPassword(password: string, confirmPassword: string, code?: string, email?: string): Promise<{ message: string }> {
    try {
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      if (email && code) {
        const response = await fetch(`${getBaseUrl()}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            code,
            new_password: password 
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to reset password');
        }

        return await response.json();
      } 
      else if (code) {
        const response = await fetch(`${getBaseUrl()}/auth/reset-password/${code}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_password: password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to reset password');
        }

        return await response.json();
      } else {
        throw new Error('Falta información necesaria para restablecer la contraseña');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verifica la contraseña actual del usuario
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const userData = await response.json();
      return this.normalizeUserData(userData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Sube una imagen de perfil
   */
  async uploadProfileImage(file: File, type: 'profile' | 'banner'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/users/upload-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Valida si el token actual es válido
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/auth/validate-token`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información de la sesión actual
   */
  async getSessionInfo(): Promise<{ valid: boolean; expires_in?: number; user_id?: number }> {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/auth/validate-token`);
      
      if (!response.ok) {
        return { valid: false };
      }

      return await response.json();
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Fuerza la renovación del token de acceso
   */
  async refreshToken(): Promise<boolean> {
    try {
      // El tokenManager ya tiene un método para renovar tokens
      await tokenManager.refreshToken();
      return true;
    } catch (error) {
      console.error('Error al renovar token:', error);
      return false;
    }
  }

  /**
   * Cierra todas las sesiones del usuario (logout global)
   */
  async logoutAllSessions(): Promise<void> {
    try {
      await tokenManager.makeAuthenticatedRequest(`${getBaseUrl()}/auth/logout-all`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error al cerrar todas las sesiones:', error);
    } finally {
      // Limpiar sesión actual de todas formas
      await this.logout();
    }
  }

  /**
   * Obtiene el ID del usuario desde localStorage (dato no sensible)
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Verifica si la sesión está bloqueada
   */
  isSessionLocked(): boolean {
    return localStorage.getItem('sessionLocked') === 'true';
  }

  /**
   * Bloquea la sesión actual
   */
  lockSession(): void {
    localStorage.setItem('sessionLocked', 'true');
  }

  /**
   * Desbloquea la sesión actual
   */
  unlockSession(): void {
    localStorage.removeItem('sessionLocked');
  }

  // ===== MÉTODOS DEPRECADOS (mantenidos para compatibilidad) =====
  
  /**
   * @deprecated Este método ya no devuelve el token por seguridad.
   * Los tokens ahora se manejan automáticamente via cookies httpOnly.
   * Usar isAuthenticated() en su lugar.
   */
  getAccessToken(): string | null {
    console.warn('getAccessToken() está deprecado. Los tokens ahora se manejan via cookies httpOnly.');
    return null;
  }
  
  /**
   * @deprecated Este método ya no devuelve el token por seguridad.
   * Los tokens ahora se manejan automáticamente via cookies httpOnly.
   */
  getRefreshToken(): string | null {
    console.warn('getRefreshToken() está deprecado. Los tokens ahora se manejan via cookies httpOnly.');
    return null;
  }
}

export default new AuthService();