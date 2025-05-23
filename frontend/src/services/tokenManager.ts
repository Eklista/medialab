// frontend/src/services/tokenManager.ts
import { getBaseUrl } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

class TokenManager {
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<void> | null = null;
  private refreshTimeout: number | null = null;

  constructor() {
    // Al inicializar, verificar si hay token válido
    this.initializeFromCookies();
  }

  private async initializeFromCookies(): Promise<void> {
    try {
      // Intentar hacer una llamada para verificar si hay cookies válidas
      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        this.scheduleTokenRefresh();
        console.log('Token válido encontrado en cookies');
      }
    } catch (error) {
      console.log('No hay token válido en cookies');
    }
  }

  /**
   * Inicia sesión y configura las cookies de autenticación
   */
  async login(credentials: LoginCredentials): Promise<any> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await fetch(`${getBaseUrl()}/auth/login`, {
        method: 'POST',
        credentials: 'include', // ← Importante para cookies
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Las cookies se configuran automáticamente por el servidor
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      this.scheduleTokenRefresh();
      
      console.log('Login exitoso - cookies configuradas');
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Realiza una petición autenticada usando las cookies
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Verificar si necesitamos renovar el token
    await this.ensureValidToken();

    return fetch(url, {
      ...options,
      credentials: 'include', // ← Siempre incluir cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // Ya no necesitamos enviar Authorization header
        // porque el token está en las cookies httpOnly
      }
    });
  }

  /**
   * Asegura que el token sea válido, renovándolo si es necesario
   */
  private async ensureValidToken(): Promise<void> {
    // Si no hay token o está por expirar en menos de 2 minutos
    if (!this.tokenExpiry || Date.now() >= this.tokenExpiry - 120000) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.performRefresh();
      }
      await this.refreshPromise;
      this.refreshPromise = null;
    }
  }

  /**
   * Renueva el token de acceso usando el refresh token
   */
  private async performRefresh(): Promise<void> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include' // ← Para enviar refresh token cookie
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      // Token renovado exitosamente - la nueva cookie se configura automáticamente
      this.tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutos
      this.scheduleTokenRefresh();
      
      console.log('Token renovado exitosamente');
    } catch (error) {
      console.error('Error al renovar token:', error);
      // Si falla la renovación, redirigir al login
      this.logout();
      throw error;
    }
  }

  /**
   * Método público para forzar renovación de token
   */
  async refreshToken(): Promise<void> {
    this.refreshPromise = this.performRefresh();
    await this.refreshPromise;
    this.refreshPromise = null;
  }

  /**
   * Programa la renovación automática del token
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
    }

    if (this.tokenExpiry) {
      // Renovar 2 minutos antes de que expire
      const timeUntilRefresh = this.tokenExpiry - Date.now() - 120000;
      
      if (timeUntilRefresh > 0) {
        this.refreshTimeout = window.setTimeout(() => {
          this.performRefresh().catch(error => {
            console.error('Error en renovación programada:', error);
          });
        }, timeUntilRefresh);
      }
    }
  }

  /**
   * Cierra la sesión limpiando cookies y estado
   */
  async logout(): Promise<void> {
    try {
      // Limpiar timeout de renovación
      if (this.refreshTimeout) {
        window.clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      // Llamar al endpoint de logout
      await fetch(`${getBaseUrl()}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local
      this.tokenExpiry = null;
      this.refreshPromise = null;
      
      // Redirigir al login
      window.location.href = '/ml-admin/login';
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.tokenExpiry ? Date.now() < this.tokenExpiry : false;
  }

  /**
   * Verifica el estado de autenticación de forma asíncrona
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        this.scheduleTokenRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar estado de autenticación:', error);
      return false;
    }
  }

  /**
   * Obtiene información de la sesión actual
   */
  async getSessionInfo(): Promise<{ valid: boolean; expires_in?: number; user_id?: number }> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return data;
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Limpia el estado del token manager
   */
  clearState(): void {
    this.tokenExpiry = null;
    this.refreshPromise = null;
    
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  /**
   * Obtiene el tiempo restante hasta la expiración del token (en ms)
   */
  getTimeUntilExpiry(): number {
    if (!this.tokenExpiry) return 0;
    return Math.max(0, this.tokenExpiry - Date.now());
  }

  /**
   * Verifica si el token expirará pronto (en los próximos 5 minutos)
   */
  willExpireSoon(): boolean {
    if (!this.tokenExpiry) return false;
    return Date.now() >= this.tokenExpiry - 300000; // 5 minutos
  }
}

export default new TokenManager();