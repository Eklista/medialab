// frontend/src/services/websocket/websocket.service.ts - VERSIÓN CORREGIDA
// 🚀 SERVICIO WEBSOCKET CORREGIDO PARA SOLUCIONAR 403 FORBIDDEN

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: number;
}

interface WebSocketEventHandlers {
  [key: string]: (data: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private messageQueue: WebSocketMessage[] = [];
  
  // 🆕 Estados de conexión para debugging
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  
  constructor() {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 5000, // 5 segundos
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000 // 30 segundos
    };
  }
  
  // ===== CONFIGURACIÓN Y CONEXIÓN =====
  
  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const isProduction = import.meta.env.MODE === 'production';
    
    if (isProduction || isHttps) {
      return 'wss://medialab.eklista.com/ws';
    }
    
    return 'ws://localhost:8000/ws';
  }
  
  // 🔧 FUNCIÓN MEJORADA: Obtener token desde cookies
  private getAccessToken(): string | null {
    try {
        // 🔧 MÉTODO 1: Usar document.cookie directamente (más confiable)
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
        const [name, ...parts] = cookie.trim().split('=');
        if (name === 'access_token') {
            const value = parts.join('='); // Rejoin in case token has = characters
            
            // 🔧 VALIDACIÓN MEJORADA
            if (value && 
                value.length > 20 && 
                value !== 'undefined' && 
                value !== 'null' &&
                !value.includes('expired')) {
            
            console.log('🍪 Token encontrado y validado:', {
                length: value.length,
                preview: `${value.substring(0, 30)}...`,
                isJWE: value.includes('.') && value.split('.').length >= 3
            });
            
            return value;
            }
        }
        }
        
        // 🔧 MÉTODO 2: Fallback usando regexp (más robusto)
        const cookieMatch = document.cookie.match(/(?:^|;\s*)access_token\s*=\s*([^;]+)/);
        if (cookieMatch && cookieMatch[1]) {
        const token = cookieMatch[1];
        if (token.length > 20 && token !== 'undefined' && token !== 'null') {
            console.log('🍪 Token encontrado via fallback:', {
            length: token.length,
            preview: `${token.substring(0, 30)}...`
            });
            return token;
        }
        }
        
        // 🔧 MÉTODO 3: Debug completo de cookies
        console.log('🔍 Debug de cookies completo:', {
        fullCookieString: document.cookie,
        cookieCount: document.cookie.split(';').length,
        hasCookies: document.cookie.length > 0,
        allCookieNames: document.cookie.split(';').map(c => c.trim().split('=')[0])
        });
        
        console.log('🍪 No se encontró token válido en cookies');
        return null;
        
    } catch (error) {
        console.error('💥 Error obteniendo token desde cookies:', error);
        return null;
    }
    }
  
  /**
   * 🚀 CONECTAR AL WEBSOCKET
   */
  async connect(userId?: number): Promise<void> {
    if (this.isConnected || this.connectionState === 'connecting') {
        console.log('🔌 WebSocket ya conectado o conectando');
        return;
    }
    
    try {
        this.connectionState = 'connecting';
        console.log('🔌 Conectando WebSocket...', this.config.url);
        
        // 🔧 DETECCIÓN MEJORADA DE TOKEN Y ENDPOINT
        const accessToken = this.getAccessToken();
        const hasValidToken = !!accessToken;
        
        console.log('🔍 Estado de autenticación:', {
        hasToken: hasValidToken,
        tokenLength: accessToken ? accessToken.length : 0,
        userId: userId,
        cookiesEnabled: navigator.cookieEnabled
        });
        
        // 🔧 CONSTRUCCIÓN DE URL INTELIGENTE
        const wsUrl = this.buildWebSocketUrl(accessToken, userId);
        
        console.log('🔗 URL WebSocket final:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        
        // Crear WebSocket
        this.ws = new WebSocket(wsUrl);
        this.setupEventListeners();
        
        // Promesa para esperar la conexión
        return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout conectando WebSocket'));
        }, 15000);
        
        const onOpen = () => {
            clearTimeout(timeout);
            resolve();
        };
        
        const onError = (error: Event) => {
            clearTimeout(timeout);
            reject(error);
        };
        
        this.ws!.addEventListener('open', onOpen, { once: true });
        this.ws!.addEventListener('error', onError, { once: true });
        });
        
    } catch (error) {
        console.error('💥 Error conectando WebSocket:', error);
        this.connectionState = 'disconnected';
        throw error;
    }
  }
    /**
     * 🧠 CONSTRUIR URL WEBSOCKET INTELIGENTE
     */
  private buildWebSocketUrl(accessToken: string | null, userId?: number): string {
    const baseUrl = new URL(this.config.url);
    
    // 🔧 LÓGICA MEJORADA DE SELECCIÓN DE ENDPOINT
    if (accessToken) {
        if (userId) {
        // CASO 1: Token + userId = Endpoint principal autenticado
        baseUrl.pathname = '/ws/';
        baseUrl.searchParams.append('user_id', userId.toString());
        baseUrl.searchParams.append('token', accessToken);
        console.log('🔐 Usando endpoint principal autenticado');
        
        } else {
        // CASO 2: Solo token = Endpoint seguro  
        baseUrl.pathname = '/ws/secure';
        baseUrl.searchParams.append('token', accessToken);
        console.log('🔐 Usando endpoint seguro');
        }
        
    } else {
        if (userId) {
        // CASO 3: Solo userId = Endpoint principal sin auth
        baseUrl.pathname = '/ws/';
        baseUrl.searchParams.append('user_id', userId.toString());
        console.log('👤 Usando endpoint principal con userId');
        
        } else {
        // CASO 4: Sin nada = Endpoint de testing
        baseUrl.pathname = '/ws/test';
        console.log('🧪 Usando endpoint de testing');
        }
    }
    
    return baseUrl.toString();
 }

    /**
     * 🔧 MÉTODO DE TESTING PARA VERIFICAR COOKIES
     */
  testCookieDetectionSimple(): void {
    console.log('🧪 === TEST DE DETECCIÓN DE COOKIES ===');
    
    console.log('📊 Información básica:', {
        cookiesEnabled: navigator.cookieEnabled,
        cookieLength: document.cookie.length,
        hasCookies: document.cookie.length > 0
    });
    
    console.log('🍪 Cookies encontradas:');
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        const [name, ...parts] = cookie.trim().split('=');
        const value = parts.join('=');
        
        console.log(`  - ${name}:`, {
        length: value.length,
        preview: value.length > 30 ? `${value.substring(0, 30)}...` : value,
        isAccessToken: name === 'access_token'
        });
    });
    
    // Test específico del access_token
    const accessToken = this.getAccessToken();
    console.log('🔑 Access Token:', {
        found: !!accessToken,
        length: accessToken ? accessToken.length : 0,
        preview: accessToken ? `${accessToken.substring(0, 30)}...` : 'No encontrado'
    });
    }

  /**
   * 🔧 CONFIGURAR EVENT LISTENERS MEJORADOS
   */
  private setupEventListeners(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado exitosamente');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      
      // Emitir evento de conexión exitosa
      if (this.eventHandlers['connected']) {
        this.eventHandlers['connected']({ status: 'connected' });
      }
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket mensaje recibido:', message.type, message);
        this.handleMessage(message);
      } catch (error) {
        console.error('💥 Error parseando mensaje WebSocket:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket desconectado:', event.code, event.reason);
      this.isConnected = false;
      this.connectionState = 'disconnected';
      this.stopHeartbeat();
      
      // Emitir evento de desconexión
      if (this.eventHandlers['disconnected']) {
        this.eventHandlers['disconnected']({ 
          code: event.code, 
          reason: event.reason 
        });
      }
      
      // 🔧 LÓGICA DE RECONEXIÓN MEJORADA
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        // Códigos específicos que no deben reconectar automáticamente
        if (event.code === 1008 || event.code === 4001 || event.code === 4003) {
          console.log('🔐 Desconexión por autenticación/autorización - no reconectar automáticamente');
          console.log('💡 Sugerencia: Verificar credenciales y reconectar manualmente');
        } else {
          this.scheduleReconnect();
        }
      } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        console.error('❌ Máximo número de intentos de reconexión alcanzado');
        if (this.eventHandlers['max_reconnect_reached']) {
          this.eventHandlers['max_reconnect_reached']({ attempts: this.reconnectAttempts });
        }
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('💥 Error WebSocket:', error);
      this.connectionState = 'disconnected';
      
      // Emitir evento de error
      if (this.eventHandlers['error']) {
        this.eventHandlers['error']({ error });
      }
    };
  }
  
  // ===== RECONEXIÓN AUTOMÁTICA MEJORADA =====
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    // Backoff exponencial: 5s, 10s, 20s, 40s, max 60s
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );
    
    console.log(`🔄 Programando reconexión en ${delay/1000}s... (intento ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  // ===== HEARTBEAT =====
  
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // ===== MANEJO DE MENSAJES MEJORADO =====
  
  /**
   * 📨 MANEJAR MENSAJES ENTRANTES
   */
  private handleMessage(message: WebSocketMessage): void {
    const handler = this.eventHandlers[message.type];
    if (handler) {
      handler(message.data);
    } else {
      console.warn(`⚠️ No hay handler para mensaje tipo: ${message.type}`);
    }
    
    // 🔧 MANEJAR MENSAJES DEL SISTEMA
    switch (message.type) {
      case 'connected':
        console.log('🎉 Conexión WebSocket confirmada por el servidor:', message.data);
        break;
        
      case 'heartbeat':
        console.log('💓 Heartbeat recibido del servidor');
        break;
        
      case 'pong':
        console.log('🏓 Pong recibido del servidor');
        break;
        
      case 'error':
        console.error('❌ Error del servidor:', message.data);
        break;
        
      case 'room_joined':
        console.log('🏠 Unido a sala:', message.data);
        break;
        
      case 'room_left':
        console.log('🚪 Salido de sala:', message.data);
        break;
        
      case 'notification':
        console.log('🔔 Notificación recibida:', message.data);
        break;
        
      case 'test_response':
        console.log('🧪 Respuesta de test:', message.data);
        break;
        
      default:
        console.log('📨 Mensaje recibido:', message.type, message.data);
    }
  }
  
  /**
   * 📤 ENVIAR MENSAJE CON VALIDACIÓN
   */
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };
    
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 Mensaje enviado:', type, data);
      } catch (error) {
        console.error('💥 Error enviando mensaje:', error);
        // Encolar mensaje para reenvío
        this.messageQueue.push(message);
      }
    } else {
      // Encolar mensaje para enviar cuando se conecte
      this.messageQueue.push(message);
      console.log('📥 Mensaje encolado (no conectado):', type);
    }
  }
  
  /**
   * 📤 PROCESAR COLA DE MENSAJES
   */
  private processMessageQueue(): void {
    let processed = 0;
    while (this.messageQueue.length > 0 && this.isConnected && processed < 10) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws!.send(JSON.stringify(message));
        console.log('📤 Mensaje de cola enviado:', message.type);
        processed++;
      } catch (error) {
        console.error('💥 Error enviando mensaje de cola:', error);
        // Reencolar el mensaje al principio
        this.messageQueue.unshift(message);
        break;
      }
    }
    
    if (processed > 0) {
      console.log(`📤 Procesados ${processed} mensajes de la cola`);
    }
  }
  
  // ===== SUSCRIPCIONES A EVENTOS =====
  
  /**
   * 👂 SUSCRIBIRSE A EVENTOS
   */
  on(eventType: string, handler: (data: any) => void): void {
    this.eventHandlers[eventType] = handler;
    console.log(`👂 Suscrito a evento: ${eventType}`);
  }
  
  /**
   * 🚫 DESUSCRIBIRSE DE EVENTOS
   */
  off(eventType: string): void {
    delete this.eventHandlers[eventType];
    console.log(`🚫 Desuscrito de evento: ${eventType}`);
  }
  
  // ===== EVENTOS ESPECÍFICOS PARA LA APP =====
  
  /**
   * 👤 SUSCRIBIRSE A ACTUALIZACIONES DE USUARIOS
   */
  onUserUpdate(handler: (userData: any) => void): void {
    this.on('user_updated', handler);
  }
  
  /**
   * 🏢 SUSCRIBIRSE A ACTUALIZACIONES DE ROLES/ÁREAS
   */
  onSystemDataUpdate(handler: (data: { type: string; data: any }) => void): void {
    this.on('system_data_updated', handler);
  }
  
  /**
   * 🔔 SUSCRIBIRSE A NOTIFICACIONES
   */
  onNotification(handler: (notification: any) => void): void {
    this.on('notification', handler);
  }
  
  /**
   * 🔌 SUSCRIBIRSE A EVENTOS DE CONEXIÓN
   */
  onConnectionChange(handler: (status: { connected: boolean; state: string }) => void): void {
    this.on('connected', () => handler({ connected: true, state: 'connected' }));
    this.on('disconnected', () => handler({ connected: false, state: 'disconnected' }));
    this.on('error', () => handler({ connected: false, state: 'error' }));
  }
  
  // ===== MÉTODOS DE SUSCRIPCIÓN A SALAS =====
  
  /**
   * 🏠 SUSCRIBIRSE A UNA SALA ESPECÍFICA
   */
  subscribeToRoom(roomType: string, roomId?: number): void {
    this.send('subscribe', {
      room_type: roomType,
      room_id: roomId
    });
  }
  
  /**
   * 🚪 DESUSCRIBIRSE DE UNA SALA
   */
  unsubscribeFromRoom(roomType: string, roomId?: number): void {
    this.send('unsubscribe', {
      room_type: roomType,
      room_id: roomId
    });
  }
  
  /**
   * 👤 ACTUALIZAR ESTADO DEL USUARIO
   */
  updateUserStatus(status: string): void {
    this.send('user_status', {
      status: status
    });
  }
  
  // ===== CONTROL DE CONEXIÓN =====
  
  /**
   * 🔌 DESCONECTAR
   */
  disconnect(): void {
    console.log('🔌 Desconectando WebSocket...');
    
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexión intencional');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
  }
  
  /**
   * 📊 OBTENER ESTADO DE CONEXIÓN
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      queuedMessages: this.messageQueue.length,
      url: this.config.url,
      hasToken: this.getAccessToken() !== null,
      readyState: this.ws ? this.ws.readyState : -1,
      readyStateText: this.ws ? this.getReadyStateText(this.ws.readyState) : 'No WebSocket'
    };
  }
  
  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
  
  /**
   * 🔄 FORZAR RECONEXIÓN
   */
  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
  
  // ===== MÉTODOS DE DEBUGGING MEJORADOS =====
  
  /**
   * 🔍 INFORMACIÓN DE DEBUG COMPLETA
   */
  getDebugInfo() {
    return {
      ...this.getConnectionInfo(),
      config: this.config,
      handlers: Object.keys(this.eventHandlers),
      messageQueue: this.messageQueue.map(msg => ({ type: msg.type, timestamp: msg.timestamp })),
      token: this.getAccessToken() ? 'Present' : 'Missing',
      cookies: document.cookie ? 'Present' : 'Missing',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 🧪 ENVIAR MENSAJE DE PRUEBA MEJORADO
   */
  sendTestMessage(): void {
    this.send('test', {
      message: 'Mensaje de prueba desde el frontend',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
  
  /**
   * 🔍 VERIFICAR CONECTIVIDAD
   */
  async checkConnectivity(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      const originalHandler = this.eventHandlers['pong'];
      this.eventHandlers['pong'] = (_data) => {
        clearTimeout(timeout);
        resolve(true);
        if (originalHandler) {
          this.eventHandlers['pong'] = originalHandler;
        } else {
          delete this.eventHandlers['pong'];
        }
      };
      
      this.send('ping', { connectivity_test: true });
    });
  }
}

// ===== SINGLETON EXPORT =====
const webSocketService = new WebSocketService();
export default webSocketService;

// ===== HOOK PARA USAR EN COMPONENTES MEJORADO =====
import { useState, useEffect } from 'react';

export const useWebSocket = () => {
  const [connectionInfo, setConnectionInfo] = useState(
    webSocketService.getConnectionInfo()
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      const info = webSocketService.getConnectionInfo();
      setConnectionInfo(prev => 
        JSON.stringify(prev) !== JSON.stringify(info) ? info : prev
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    ...connectionInfo,
    connect: webSocketService.connect.bind(webSocketService),
    disconnect: webSocketService.disconnect.bind(webSocketService),
    send: webSocketService.send.bind(webSocketService),
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
    forceReconnect: webSocketService.forceReconnect.bind(webSocketService),
    subscribeToRoom: webSocketService.subscribeToRoom.bind(webSocketService),
    unsubscribeFromRoom: webSocketService.unsubscribeFromRoom.bind(webSocketService),
    updateUserStatus: webSocketService.updateUserStatus.bind(webSocketService),
    getDebugInfo: webSocketService.getDebugInfo.bind(webSocketService),
    sendTestMessage: webSocketService.sendTestMessage.bind(webSocketService),
    checkConnectivity: webSocketService.checkConnectivity.bind(webSocketService)
  };
};