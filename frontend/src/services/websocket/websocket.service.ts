// frontend/src/services/websocket/websocket.service.ts
// 🚀 SERVICIO WEBSOCKET PARA ACTUALIZACIONES EN TIEMPO REAL

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
      
      const wsUrl = userId ? `${this.config.url}?user_id=${userId}` : this.config.url;
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
        console.log('📨 WebSocket mensaje recibido:', message.type);
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
      
      // Reconexión automática si no fue cierre intencional
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
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
      url: this.config.url
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
    forceReconnect: webSocketService.forceReconnect.bind(webSocketService)
  };
};