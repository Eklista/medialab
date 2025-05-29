// frontend/src/services/websocket/websocket.service.ts - CORRECCIÓN FINAL
// 🔧 VERSIÓN CORREGIDA QUE SOLUCIONA EL PROBLEMA DE DETECCIÓN DE COOKIES

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
  
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private lastUserId: number | null = null;
  
  constructor() {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    };
  }
  
  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const isProduction = import.meta.env.MODE === 'production';
    
    if (isProduction || isHttps) {
      return 'wss://medialab.eklista.com/ws';
    }
    
    return 'ws://localhost:8000/ws';
  }
  
  // 🔧 MÉTODO CORREGIDO: Detección confiable de cookies
  private getAccessToken(): string | null {
    try {
      console.log('🔍 Iniciando detección de access_token...');
      console.log('Raw cookies:', document.cookie);
      
      // Verificar si hay cookies
      if (!document.cookie || document.cookie.trim().length === 0) {
        console.log('❌ No hay cookies disponibles');
        return null;
      }
      
      // 🔧 MÉTODO PRINCIPAL: Usar indexOf (más confiable que regex)
      const accessTokenIndex = document.cookie.indexOf('access_token=');
      
      if (accessTokenIndex === -1) {
        console.log('❌ No se encontró access_token en cookies');
        this.debugAllCookies();
        return null;
      }
      
      // Extraer el valor del token
      const tokenStartIndex = accessTokenIndex + 'access_token='.length;
      let tokenEndIndex = document.cookie.indexOf(';', tokenStartIndex);
      
      // Si no hay ';' después del token, va hasta el final
      if (tokenEndIndex === -1) {
        tokenEndIndex = document.cookie.length;
      }
      
      const token = document.cookie.substring(tokenStartIndex, tokenEndIndex).trim();
      
      console.log('🔑 Token extraído:', {
        found: true,
        length: token.length,
        preview: token.substring(0, 50) + '...',
        method: 'indexOf',
        startIndex: tokenStartIndex,
        endIndex: tokenEndIndex
      });
      
      // Validación del token
      if (token.length < 50) {
        console.log('⚠️ Token muy corto, posiblemente inválido');
        return null;
      }
      
      if (token === 'undefined' || token === 'null' || token === '') {
        console.log('⚠️ Token tiene valor inválido:', token);
        return null;
      }
      
      console.log('✅ Token válido encontrado');
      return token;
      
    } catch (error) {
      console.error('💥 Error en detección de token:', error);
      return null;
    }
  }
  
  // 🔧 MÉTODO DE DEBUG MEJORADO
  private debugAllCookies(): void {
    console.log('🍪 === DEBUG DE TODAS LAS COOKIES ===');
    console.log('Raw cookie string:', `"${document.cookie}"`);
    console.log('Length:', document.cookie.length);
    console.log('Type:', typeof document.cookie);
    
    if (document.cookie.length > 0) {
      const cookies = document.cookie.split(';');
      console.log('Cookies split por ";":', cookies.length);
      
      cookies.forEach((cookie, index) => {
        const trimmed = cookie.trim();
        const equalIndex = trimmed.indexOf('=');
        
        if (equalIndex > 0) {
          const name = trimmed.substring(0, equalIndex);
          const value = trimmed.substring(equalIndex + 1);
          
          console.log(`Cookie ${index + 1}:`);
          console.log(`  Nombre: "${name}"`);
          console.log(`  Valor length: ${value.length}`);
          console.log(`  Preview: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
          
          if (name === 'access_token') {
            console.log('  ⭐ Esta es la cookie access_token!');
          }
        }
      });
    } else {
      console.log('❌ String de cookies está vacío');
    }
    console.log('=================================');
  }
  
  // 🔧 MÉTODO DE TEST PARA COOKIES
  debugCookies(): void {
    console.log('🧪 === TEST DE DETECCIÓN DE COOKIES ===');
    
    // Test básico
    console.log('1. Info básica:');
    console.log('   Cookies enabled:', navigator.cookieEnabled);
    console.log('   Document.cookie:', document.cookie);
    console.log('   Length:', document.cookie.length);
    
    // Test de detección
    console.log('\n2. Test de detección:');
    const token = this.getAccessToken();
    console.log('   Token detectado:', !!token);
    if (token) {
      console.log('   Token length:', token.length);
      console.log('   Token preview:', token.substring(0, 50) + '...');
    }
    
    // Test manual
    console.log('\n3. Test manual con indexOf:');
    const manualIndex = document.cookie.indexOf('access_token=');
    console.log('   indexOf result:', manualIndex);
    
    if (manualIndex !== -1) {
      const startPos = manualIndex + 'access_token='.length;
      const endPos = document.cookie.indexOf(';', startPos);
      const manualToken = document.cookie.substring(startPos, endPos === -1 ? undefined : endPos);
      console.log('   Manual token:', manualToken.substring(0, 50) + '...');
      console.log('   Manual token length:', manualToken.length);
    }
    
    console.log('=====================================');
  }
  
  // 🔧 MÉTODO DE CONEXIÓN CORREGIDO
  async connect(userId?: number): Promise<void> {
    if (userId) {
      this.lastUserId = userId;
    }
    
    if (this.isConnected || this.connectionState === 'connecting') {
      console.log('🔌 WebSocket ya conectado o conectando');
      return;
    }
    
    try {
      this.connectionState = 'connecting';
      console.log('🔌 Conectando WebSocket...', this.config.url);
      
      // 🔧 DETECCIÓN MEJORADA DE TOKEN
      const accessToken = this.getAccessToken();
      const hasValidToken = !!accessToken;
      const effectiveUserId = userId || this.lastUserId;
      
      console.log('🔍 Estado de autenticación:', {
        hasToken: hasValidToken,
        tokenLength: accessToken ? accessToken.length : 0,
        userId: effectiveUserId,
        cookiesEnabled: navigator.cookieEnabled,
        cookiesPresent: document.cookie.length > 0
      });
      
      // 🔧 CONSTRUCCIÓN DE URL SIMPLIFICADA
      const wsUrl = this.buildWebSocketUrl(accessToken, effectiveUserId);
      
      console.log('🔗 URL WebSocket final:', wsUrl.replace(/token=[^&]+/g, 'token=***'));
      
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
  
  // 🔧 CONSTRUCCIÓN DE URL SIMPLIFICADA
  private buildWebSocketUrl(accessToken: string | null, userId?: number | null): string {
    const baseUrl = new URL(this.config.url);
    baseUrl.pathname = '/ws/';
    
    // Siempre incluir userId si está disponible
    if (userId) {
      baseUrl.searchParams.append('user_id', userId.toString());
      console.log(`👤 Conectando como user_id: ${userId}`);
    } else {
      // Fallback: usar userId desde localStorage
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        baseUrl.searchParams.append('user_id', storedUserId);
        console.log(`👤 Usando userId desde localStorage: ${storedUserId}`);
      } else {
        console.warn('⚠️ No se encontró userId');
      }
    }
    
    // 🔧 INCLUIR TOKEN SI ESTÁ DISPONIBLE
    if (accessToken) {
      baseUrl.searchParams.append('token', accessToken);
      console.log('🔐 Token incluido en la conexión');
    } else {
      console.log('🔓 Conectando sin token (el backend debería aceptar esto)');
    }
    
    return baseUrl.toString();
  }
  
  // 🔧 EVENT LISTENERS (sin cambios significativos)
  private setupEventListeners(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado exitosamente');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      
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
      
      if (this.eventHandlers['disconnected']) {
        this.eventHandlers['disconnected']({ 
          code: event.code, 
          reason: event.reason 
        });
      }
      
      // Lógica de reconexión
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        if (event.code === 1006 || event.code === 1011 || event.code === 1012) {
          console.log('🔄 Desconexión temporal - intentando reconexión...');
          this.scheduleReconnect();
        } else if (event.code === 1008 || event.code === 4001 || event.code === 4003) {
          console.log('🔐 Desconexión por autenticación - no reconectar automáticamente');
        } else {
          console.log('🔄 Desconexión inesperada - programando reconexión...');
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
      
      if (this.eventHandlers['error']) {
        this.eventHandlers['error']({ error });
      }
    };
  }
  
  // ===== RESTO DE MÉTODOS (sin cambios significativos) =====
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`🔄 Programando reconexión en ${delay/1000}s... (intento ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.lastUserId || undefined);
    }, delay);
  }
  
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      } else {
        console.warn('⚠️ Heartbeat detectó conexión inválida');
        this.stopHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  private handleMessage(message: WebSocketMessage): void {
    const handler = this.eventHandlers[message.type];
    if (handler) {
      handler(message.data);
    } else {
      // 🔧 REDUCIR WARNINGS PARA MENSAJES COMUNES DEL SISTEMA
      if (!['heartbeat', 'pong', 'room_joined'].includes(message.type)) {
        console.warn(`⚠️ No hay handler para mensaje tipo: ${message.type}`);
      }
    }
    
    // Manejar mensajes del sistema
    switch (message.type) {
      case 'connected':
        console.log('🎉 Conexión WebSocket confirmada por el servidor:', message.data);
        break;
        
      case 'room_joined':
        console.log('🏠 Unido a sala:', message.data);
        break;
        
      case 'error':
        console.error('❌ Error del servidor:', message.data);
        break;
        
      case 'notification':
        console.log('🔔 Notificación recibida:', message.data);
        break;
        
      case 'test_response':
        console.log('🧪 Respuesta de test:', message.data);
        break;
        
      // Mensajes silenciosos (no logear)
      case 'heartbeat':
      case 'pong':
        break;
        
      default:
        if (!['heartbeat', 'pong', 'room_joined'].includes(message.type)) {
          console.log('📨 Mensaje recibido:', message.type, message.data);
        }
    }
  }
  
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };
    
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        if (type !== 'ping' && type !== 'heartbeat') {
          console.log('📤 Mensaje enviado:', type, data);
        }
      } catch (error) {
        console.error('💥 Error enviando mensaje:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      if (type !== 'ping' && type !== 'heartbeat') {
        console.log('📥 Mensaje encolado (no conectado):', type);
      }
    }
  }
  
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
        this.messageQueue.unshift(message);
        break;
      }
    }
    
    if (processed > 0) {
      console.log(`📤 Procesados ${processed} mensajes de la cola`);
    }
  }
  
  // ===== API PÚBLICA =====
  
  on(eventType: string, handler: (data: any) => void): void {
    this.eventHandlers[eventType] = handler;
    console.log(`👂 Suscrito a evento: ${eventType}`);
  }
  
  off(eventType: string): void {
    delete this.eventHandlers[eventType];
    console.log(`🚫 Desuscrito de evento: ${eventType}`);
  }
  
  onUserUpdate(handler: (userData: any) => void): void {
    this.on('user_updated', handler);
  }
  
  onSystemDataUpdate(handler: (data: { type: string; data: any }) => void): void {
    this.on('system_data_updated', handler);
  }
  
  onNotification(handler: (notification: any) => void): void {
    this.on('notification', handler);
  }
  
  onConnectionChange(handler: (status: { connected: boolean; state: string }) => void): void {
    this.on('connected', () => handler({ connected: true, state: 'connected' }));
    this.on('disconnected', () => handler({ connected: false, state: 'disconnected' }));
    this.on('error', () => handler({ connected: false, state: 'error' }));
  }
  
  subscribeToRoom(roomType: string, roomId?: number): void {
    this.send('subscribe', {
      room_type: roomType,
      room_id: roomId
    });
  }
  
  unsubscribeFromRoom(roomType: string, roomId?: number): void {
    this.send('unsubscribe', {
      room_type: roomType,
      room_id: roomId
    });
  }
  
  updateUserStatus(status: string): void {
    this.send('user_status', {
      status: status
    });
  }
  
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
    this.lastUserId = null;
  }
  
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      queuedMessages: this.messageQueue.length,
      url: this.config.url,
      hasToken: this.getAccessToken() !== null,
      userId: this.lastUserId,
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
  
  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.disconnect();
    setTimeout(() => this.connect(this.lastUserId || undefined), 1000);
  }
  
  getDebugInfo() {
    const token = this.getAccessToken();
    return {
      connection: this.getConnectionInfo(),
      config: this.config,
      handlers: Object.keys(this.eventHandlers),
      messageQueue: this.messageQueue.map(msg => ({ type: msg.type, timestamp: msg.timestamp })),
      token: {
        present: !!token,
        length: token ? token.length : 0,
        preview: token ? `${token.substring(0, 20)}...` : 'No token'
      },
      cookies: {
        present: !!document.cookie,
        length: document.cookie.length,
        count: document.cookie.split(';').length,
        names: document.cookie.split(';').map(c => c.trim().split('=')[0])
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
  
  sendTestMessage(): void {
    this.send('test', {
      message: 'Mensaje de prueba desde el frontend',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.lastUserId,
      hasToken: !!this.getAccessToken()
    });
  }
  
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

// 🔧 EXPONER EL SERVICIO EN WINDOW PARA DEBUGGING
if (typeof window !== 'undefined') {
  (window as any).webSocketService = webSocketService;
}

export default webSocketService;

// ===== HOOK PARA USAR EN COMPONENTES (ACTUALIZADO) =====
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
    }, 2000);
    
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
    checkConnectivity: webSocketService.checkConnectivity.bind(webSocketService),
    debugCookies: webSocketService.debugCookies.bind(webSocketService)
  };
};