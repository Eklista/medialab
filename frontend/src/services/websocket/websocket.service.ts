// frontend/src/services/websocket/websocket.service.ts
// 🚀 SERVICIO WEBSOCKET PARA ACTUALIZACIONES EN TIEMPO REAL - VERSIÓN CORREGIDA

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
  
  // 🔧 NUEVA FUNCIÓN: Obtener token desde cookies
  private getAccessToken(): string | null {
    try {
      // Buscar la cookie access_token
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
          return value;
        }
      }
      return null;
    } catch (error) {
      console.error('💥 Error obteniendo token desde cookies:', error);
      return null;
    }
  }
  
  /**
   * 🚀 CONECTAR AL WEBSOCKET - VERSIÓN CORREGIDA CON AUTENTICACIÓN
   */
  async connect(userId?: number): Promise<void> {
    if (this.isConnected || this.connectionState === 'connecting') {
      console.log('🔌 WebSocket ya conectado o conectando');
      return;
    }
    
    try {
      this.connectionState = 'connecting';
      console.log('🔌 Conectando WebSocket...', this.config.url);
      
      // 🔧 NUEVA LÓGICA: Construir URL con token y userId
      let wsUrl = this.config.url;
      const urlParams = new URLSearchParams();
      
      // Agregar userId si se proporciona
      if (userId) {
        urlParams.append('user_id', userId.toString());
      }
      
      // 🔧 AGREGAR TOKEN DESDE COOKIES
      const accessToken = this.getAccessToken();
      if (accessToken) {
        urlParams.append('token', accessToken);
        console.log('🔑 Token agregado a la conexión WebSocket');
      } else {
        console.warn('⚠️ No se encontró token - conectando sin autenticación');
      }
      
      // Construir URL final
      if (urlParams.toString()) {
        wsUrl += '?' + urlParams.toString();
      }
      
      console.log('🔗 URL WebSocket final:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      
      this.ws = new WebSocket(wsUrl);
      
      this.setupEventListeners();
      
      // Promesa para esperar la conexión
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout conectando WebSocket'));
        }, 10000);
        
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
   * 🔧 CONFIGURAR EVENT LISTENERS
   */
  private setupEventListeners(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
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
      
      // 🔧 MEJORADA LÓGICA DE RECONEXIÓN
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        // No reconectar inmediatamente si es por autenticación (403)
        if (event.code === 1008) {
          console.log('🔐 Desconexión por autenticación - esperando más tiempo para reconectar');
          setTimeout(() => this.scheduleReconnect(), 5000);
        } else {
          this.scheduleReconnect();
        }
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('💥 Error WebSocket:', error);
      this.connectionState = 'disconnected';
    };
  }
  
  // ===== RECONEXIÓN AUTOMÁTICA =====
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    console.log(`🔄 Programando reconexión... (intento ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.config.reconnectInterval);
  }
  
  // ===== HEARTBEAT =====
  
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected) {
        this.send('ping', {});
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // ===== MANEJO DE MENSAJES =====
  
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
    if (message.type === 'connected') {
      console.log('🎉 Conexión WebSocket confirmada por el servidor:', message.data);
    } else if (message.type === 'heartbeat') {
      console.log('💓 Heartbeat recibido del servidor');
    } else if (message.type === 'pong') {
      console.log('🏓 Pong recibido del servidor');
    }
  }
  
  /**
   * 📤 ENVIAR MENSAJE
   */
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Mensaje enviado:', type, data);
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
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      this.ws!.send(JSON.stringify(message));
      console.log('📤 Mensaje de cola enviado:', message.type);
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
   * 📝 SUSCRIBIRSE A ACTUALIZACIONES DE SOLICITUDES
   */
  onRequestUpdate(handler: (requestData: any) => void): void {
    this.on('request_updated', handler);
  }
  
  /**
   * 🔔 SUSCRIBIRSE A NOTIFICACIONES
   */
  onNotification(handler: (notification: any) => void): void {
    this.on('notification', handler);
  }
  
  // ===== NUEVOS MÉTODOS PARA SUSCRIPCIONES =====
  
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
      queuedMessages: this.messageQueue.length,
      url: this.config.url,
      hasToken: this.getAccessToken() !== null
    };
  }
  
  /**
   * 🔄 FORZAR RECONEXIÓN
   */
  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
  
  // ===== NUEVOS MÉTODOS DE DEBUGGING =====
  
  /**
   * 🔍 INFORMACIÓN DE DEBUG
   */
  getDebugInfo() {
    return {
      ...this.getConnectionInfo(),
      config: this.config,
      handlers: Object.keys(this.eventHandlers),
      messageQueue: this.messageQueue.length,
      token: this.getAccessToken() ? 'Present' : 'Missing'
    };
  }
  
  /**
   * 🧪 ENVIAR MENSAJE DE PRUEBA
   */
  sendTestMessage(): void {
    this.send('test', {
      message: 'Mensaje de prueba desde el frontend',
      timestamp: new Date().toISOString()
    });
  }
}

// ===== SINGLETON EXPORT =====
const webSocketService = new WebSocketService();
export default webSocketService;

// ===== HOOK PARA USAR EN COMPONENTES =====
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
    sendTestMessage: webSocketService.sendTestMessage.bind(webSocketService)
  };
};