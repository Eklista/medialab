// frontend/src/services/auth.service.ts - Versión corregida
import apiClient, { handleApiError, setLoggingOut } from './api';

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
  first_name?: string;
  last_name?: string;
  profileImage?: string;
  bannerImage?: string;
  phone?: string;
  birthDate?: string;
  joinDate: string;
  lastLogin?: string;
  isActive: boolean;
  isOnline: boolean;
  roles: Array<{id: number, name: string}>;
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
      console.log('🔐 Iniciando login con cookies httpOnly...');
      
      // Crear FormData para OAuth2PasswordRequestForm como espera FastAPI
      const formData = new FormData();
      formData.append('username', credentials.email); // FastAPI espera 'username'
      formData.append('password', credentials.password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true, // Asegurar que se incluyen las cookies
      });

      console.log('✅ Login exitoso:', response.data);
      
      // Obtener información del usuario después del login exitoso
      const userData = await this.getCurrentUser();
      
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
      console.log('🚪 Iniciando proceso de logout...');
      
      // Marcar que estamos haciendo logout para evitar loops
      setLoggingOut(true);
      
      // Llamar al endpoint de logout del backend
      await apiClient.post('/auth/logout', {}, {
        withCredentials: true
      });
      
      console.log('✅ Logout exitoso en el servidor');
    } catch (error) {
      console.error('💥 Error en logout del servidor:', error);
      // No lanzar error para no interrumpir el proceso de logout
    } finally {
      // Restablecer flag de logout
      setLoggingOut(false);
      
      // Limpiar datos locales
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionLocked');
      
      console.log('🧹 Datos locales limpiados');
    }
  }

  /**
   * Obtiene la información del usuario actual usando cookies
   * CORREGIDO: Usar el endpoint correcto /auth/me
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me', {
        withCredentials: true
      });
      return this.normalizeUserData(response.data);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  }
  
  /**
   * Normaliza los datos del usuario para manejar diferentes formatos de API
   */
  private normalizeUserData(userData: any): User {
    // Manejar tanto snake_case como camelCase
    const normalized: User = {
      id: userData.id,
      email: userData.email || '',
      username: userData.username || '',
      firstName: userData.first_name || userData.firstName || '',
      lastName: userData.last_name || userData.lastName || '',
      first_name: userData.first_name || userData.firstName || '',
      last_name: userData.last_name || userData.lastName || '',
      profileImage: userData.profileImage || userData.profile_image || '',
      bannerImage: userData.bannerImage || userData.banner_image || '',
      phone: userData.phone || '',
      birthDate: userData.birth_date || userData.birthDate || '',
      joinDate: userData.join_date || userData.joinDate || '',
      lastLogin: userData.last_login || userData.lastLogin || '',
      isActive: userData.is_active !== undefined ? userData.is_active : userData.isActive,
      isOnline: userData.is_online !== undefined ? userData.is_online : userData.isOnline,
      roles: userData.roles || [],
      permissions: userData.permissions || []
    };
    
    // Generar name si no existe
    if (!normalized.name && (normalized.firstName || normalized.lastName)) {
      normalized.name = `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim();
    }
    
    return normalized;
  }

  /**
   * Obtiene los permisos del usuario actual
   * NOTA: Los permisos ya vienen en /auth/me, pero este método puede ser útil por separado
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      // En tu backend, los permisos vienen incluidos en /auth/me
      const user = await this.getCurrentUser();
      return user.permissions || [];
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
      const response = await apiClient.post('/auth/validate-token', {}, {
        withCredentials: true
      });
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
      const response = await apiClient.post('/auth/forgot-password', { email }, {
        withCredentials: true
      });
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
      const response = await apiClient.post('/auth/verify-code', { email, code }, {
        withCredentials: true
      });
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
        }, {
          withCredentials: true
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
      const response = await apiClient.post('/auth/verify-password', { password }, {
        withCredentials: true
      });
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
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza el perfil del usuario actual
   * NOTA: Para perfiles usar el endpoint de users
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      // Convertir a snake_case para el backend
      const apiData: any = {};
      if (profileData.firstName !== undefined) apiData.first_name = profileData.firstName;
      if (profileData.lastName !== undefined) apiData.last_name = profileData.lastName;
      if (profileData.email !== undefined) apiData.email = profileData.email;
      if (profileData.username !== undefined) apiData.username = profileData.username;
      if (profileData.phone !== undefined) apiData.phone = profileData.phone;
      if (profileData.birthDate !== undefined) apiData.birth_date = profileData.birthDate;

      const response = await apiClient.patch('/users/me', apiData, {
        withCredentials: true
      });
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
        withCredentials: true
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
      const response = await apiClient.post('/auth/validate-token', {}, {
        withCredentials: true
      });
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
      const response = await apiClient.post('/auth/validate-token', {}, {
        withCredentials: true
      });
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
      const response = await apiClient.post('/auth/refresh', {}, {
        withCredentials: true
      });
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
      setLoggingOut(true);
      await apiClient.post('/auth/logout-all', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Error al cerrar todas las sesiones:', error);
    } finally {
      setLoggingOut(false);
      // Limpiar sesión actual de todas formas
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionLocked');
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

  /**
   * Obtiene el estado de seguridad del sistema
   */
  async getSecurityStatus(): Promise<any> {
    try {
      const response = await apiClient.get('/auth/security/status', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estado de seguridad:', error);
      return null;
    }
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
    // Verificación básica: si hay userId Y no estamos en proceso de logout
    const hasUserId = this.getUserId() !== null;
    const isSessionLocked = this.isSessionLocked();
    
    return hasUserId && !isSessionLocked;
  }
}

export default new AuthService();