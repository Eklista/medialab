// frontend/src/services/auth.service.ts
import apiClient, { handleApiError } from './api';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
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
      //console.log('🔐 Iniciando login con apiClient...');
      
      // Crear FormData para OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      //const response = await apiClient.post('/auth/login', formData, {
      //  headers: {
      //    'Content-Type': 'multipart/form-data',
      //  },
      //});

      //console.log('✅ Login exitoso:', response.data);
      
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
      console.error('💥 Error en login:', error);
      throw error;
    }
  }
  
  /**
   * Cierra la sesión limpiando cookies y datos locales
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Llamando al endpoint de logout...');
      
      // Llamar al endpoint de logout del backend
      await apiClient.post('/auth/logout');
      
      console.log('✅ Logout exitoso en el servidor');
    } catch (error) {
      console.error('💥 Error en logout del servidor:', error);
      // No lanzar error para no interrumpir el proceso de logout
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionLocked');
      
      console.log('🧹 Datos locales limpiados');
    }
  }

  /**
   * Obtiene la información del usuario actual usando cookies
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/users/me');
      return this.normalizeUserData(response.data);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
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
      const response = await apiClient.get('/users/me/permissions');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      return [];
    }
  }

  /**
   * Verifica el estado de autenticación de forma asíncrona
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/validate-token');
      return response.status === 200;
    } catch (error) {
      console.error('Error al verificar estado de autenticación:', error);
      return false;
    }
  }
  
  /**
   * Envía solicitud de recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Verifica el código de recuperación de contraseña
   */
  async verifyCode(email: string, code: string): Promise<{ valid: boolean }> {
    try {
      const response = await apiClient.post('/auth/verify-code', { email, code });
      return response.data;
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
        const response = await apiClient.post('/auth/reset-password', {
          email,
          code,
          new_password: password 
        });
        return response.data;
      } 
      else if (code) {
        const response = await apiClient.post(`/auth/reset-password/${code}`, {
          new_password: password
        });
        return response.data;
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
      const response = await apiClient.post('/auth/verify-password', { password });
      return response.data.valid;
    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      return false;
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/change-password', {
        current_password: currentPassword, 
        new_password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch('/users/me', profileData);
      return this.normalizeUserData(response.data);
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

      const response = await apiClient.post('/users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Valida si el token actual es válido
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/validate-token');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información de la sesión actual
   */
  async getSessionInfo(): Promise<{ valid: boolean; expires_in?: number; user_id?: number }> {
    try {
      const response = await apiClient.post('/auth/validate-token');
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Fuerza la renovación del token de acceso
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/refresh');
      return response.status === 200;
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
      await apiClient.post('/auth/logout-all');
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
   * Usar checkAuthStatus() en su lugar.
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

  /**
   * @deprecated Los tokens ahora se manejan automáticamente.
   * Este método solo verifica si hay una sesión activa.
   */
  isAuthenticated(): boolean {
    // CAMBIO: No depender solo del localStorage, porque puede ser residual
    // Verificación básica: si hay userId Y no estamos en proceso de logout
    const hasUserId = this.getUserId() !== null;
    const isSessionLocked = this.isSessionLocked();
    
    // Solo considerar autenticado si hay userId y la sesión no está marcada como bloqueada incorrectamente
    return hasUserId && !isSessionLocked;
  }
}

export default new AuthService();