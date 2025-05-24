// frontend/src/services/tokenManager.ts (versión sin loop en logout)
import { getBaseUrl } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

class TokenManager {
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<void> | null = null;
  private refreshTimeout: number | null = null;
  private isRefreshing = false;
  private failedRefreshAttempts = 0;
  private maxRefreshAttempts = 3;
  private isLoggingOut = false; // ← NUEVO: Flag para logout

  constructor() {
    // Al inicializar, verificar si hay token válido
    this.initializeFromCookies();
  }

  private async initializeFromCookies(): Promise<void> {
    // No inicializar si estamos haciendo logout
    if (this.isLoggingOut) return;

    try {
      // Intentar hacer una llamada para verificar si hay cookies válidas
      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        this.scheduleTokenRefresh();
        this.failedRefreshAttempts = 0; // Reset counter on success
        console.log('Token válido encontrado en cookies');
      } else {
        // No hay token válido, limpiar estado
        this.clearState();
      }
    } catch (error) {
      console.log('No hay token válido en cookies');
      this.clearState();
    }
  }

  /**
   * Inicia sesión y configura las cookies de autenticación
   */
  async login(credentials: LoginCredentials): Promise<any> {
    try {
      // Limpiar estado previo
      this.clearState();
      this.isLoggingOut = false; // ← Asegurar que no estamos en logout
      
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await fetch(`${getBaseUrl()}/auth/login`, {
        method: 'POST',
        credentials: 'include',
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
      this.failedRefreshAttempts = 0; // Reset counter on successful login
      
      console.log('Login exitoso - cookies configuradas');
      return data;
    } catch (error) {
      this.clearState();
      throw error;
    }
  }

  /**
   * Realiza una petición autenticada usando las cookies
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Si estamos haciendo logout, rechazar todas las peticiones
    if (this.isLoggingOut) {
      throw new Error('Logging out - request rejected');
    }

    // Si ya estamos en proceso de refresh, esperar
    if (this.isRefreshing && this.refreshPromise) {
      try {
        await this.refreshPromise;
      } catch (error) {
        // Si falla el refresh, no hacer más intentos
        throw new Error('Authentication failed');
      }
    }

    // Verificar si necesitamos renovar el token
    if (this.shouldRefreshToken()) {
      try {
        await this.ensureValidToken();
      } catch (error) {
        // Si falla la renovación, hacer logout silencioso
        this.silentLogout();
        throw new Error('Authentication failed');
      }
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
  }

  /**
   * Verifica si el token debe renovarse
   */
  private shouldRefreshToken(): boolean {
    if (!this.tokenExpiry || this.isLoggingOut) return false;
    // Renovar si expira en menos de 2 minutos
    return Date.now() >= this.tokenExpiry - 120000;
  }

  /**
   * Asegura que el token sea válido, renovándolo si es necesario
   */
  private async ensureValidToken(): Promise<void> {
    // No renovar si estamos haciendo logout
    if (this.isLoggingOut) {
      throw new Error('Logging out');
    }

    // Si ya estamos renovando, esperar a que termine
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    // Si hemos fallado demasiadas veces, no intentar más
    if (this.failedRefreshAttempts >= this.maxRefreshAttempts) {
      throw new Error('Max refresh attempts exceeded');
    }

    if (this.shouldRefreshToken()) {
      this.refreshPromise = this.performRefresh();
      await this.refreshPromise;
      this.refreshPromise = null;
    }
  }

  /**
   * Renueva el token de acceso usando el refresh token
   */
  private async performRefresh(): Promise<void> {
    if (this.isRefreshing || this.isLoggingOut) {
      throw new Error('Already refreshing or logging out');
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        this.failedRefreshAttempts++;
        
        if (response.status === 422 || response.status === 401) {
          // No hay refresh token válido, hacer logout silencioso
          throw new Error('No valid refresh token');
        }
        
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Token renovado exitosamente
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      this.scheduleTokenRefresh();
      this.failedRefreshAttempts = 0; // Reset counter on success
      
      console.log('Token renovado exitosamente');
    } catch (error) {
      console.error('Error al renovar token:', error);
      
      // Si falla la renovación, hacer logout silencioso
      this.silentLogout();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Método público para forzar renovación de token
   */
  async refreshToken(): Promise<void> {
    if (this.failedRefreshAttempts >= this.maxRefreshAttempts || this.isLoggingOut) {
      throw new Error('Max refresh attempts exceeded or logging out');
    }

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

    if (this.tokenExpiry && this.failedRefreshAttempts < this.maxRefreshAttempts && !this.isLoggingOut) {
      // Renovar 2 minutos antes de que expire
      const timeUntilRefresh = this.tokenExpiry - Date.now() - 120000;
      
      if (timeUntilRefresh > 0) {
        this.refreshTimeout = window.setTimeout(() => {
          if (!this.isRefreshing && !this.isLoggingOut) {
            this.performRefresh().catch(error => {
              console.error('Error en renovación programada:', error);
              // No hacer logout automático aquí para evitar loops
            });
          }
        }, timeUntilRefresh);
      }
    }
  }

  /**
   * Logout silencioso que no intenta llamar al servidor
   */
  private silentLogout(): void {
    console.log('Realizando logout silencioso...');
    
    // Marcar que estamos haciendo logout
    this.isLoggingOut = true;
    
    // Limpiar estado local
    this.clearState();
    
    // Redirigir al login sin intentar llamar al servidor
    setTimeout(() => {
      window.location.href = '/ml-admin/login';
    }, 100);
  }

  /**
   * Cierra la sesión limpiando cookies y estado
   */
  async logout(): Promise<void> {
    console.log('Iniciando logout...');
    
    // Marcar que estamos haciendo logout PRIMERO
    this.isLoggingOut = true;
    
    try {
      // Limpiar estado local primero
      this.clearState();

      // Intentar llamar al endpoint de logout solo si tenemos un token válido
      if (this.tokenExpiry && Date.now() < this.tokenExpiry) {
        console.log('Llamando al endpoint de logout...');
        await fetch(`${getBaseUrl()}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
        console.log('Logout exitoso en el servidor');
      } else {
        console.log('No hay token válido, saltando llamada al servidor');
      }
    } catch (error) {
      console.error('Error en logout:', error);
      // No relanzar el error para evitar loops
    } finally {
      // Asegurar redirección al login
      console.log('Redirigiendo al login...');
      window.location.href = '/ml-admin/login';
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.tokenExpiry ? Date.now() < this.tokenExpiry && !this.isLoggingOut : false;
  }

  /**
   * Verifica el estado de autenticación de forma asíncrona
   */
  async checkAuthStatus(): Promise<boolean> {
    // Si estamos haciendo logout, devolver false inmediatamente
    if (this.isLoggingOut) {
      return false;
    }

    try {
      // Si ya hemos fallado demasiadas veces, no intentar más
      if (this.failedRefreshAttempts >= this.maxRefreshAttempts) {
        return false;
      }

      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        this.scheduleTokenRefresh();
        this.failedRefreshAttempts = 0; // Reset counter on success
        return true;
      } else {
        this.clearState();
        return false;
      }
    } catch (error) {
      console.error('Error al verificar estado de autenticación:', error);
      this.clearState();
      return false;
    }
  }

  /**
   * Obtiene información de la sesión actual
   */
  async getSessionInfo(): Promise<{ valid: boolean; expires_in?: number; user_id?: number }> {
    // Si estamos haciendo logout, devolver inválido
    if (this.isLoggingOut) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${getBaseUrl()}/auth/validate-token`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        this.clearState();
        return { valid: false };
      }

      const data = await response.json();
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      this.failedRefreshAttempts = 0; // Reset counter on success
      return data;
    } catch (error) {
      this.clearState();
      return { valid: false };
    }
  }

  /**
   * Limpia el estado del token manager
   */
  clearState(): void {
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.isRefreshing = false;
    
    if (this.refreshTimeout) {
      window.clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // NO limpiar isLoggingOut aquí - se maneja externamente
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

  /**
   * Resetea el contador de intentos fallidos (para testing)
   */
  resetFailedAttempts(): void {
    this.failedRefreshAttempts = 0;
  }

  /**
   * Método para limpiar completamente el estado (incluyendo logout flag)
   */
  fullReset(): void {
    this.isLoggingOut = false;
    this.clearState();
  }
}

export default new TokenManager();