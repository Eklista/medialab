// frontend/src/services/websocket/websocket.service.ts - SOLUCIÓN PARA COOKIES HTTPONLY
// 🔧 VERSIÓN CORREGIDA QUE MANEJA COOKIES HTTPONLY CORRECTAMENTE

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
  
  // 🔧 NUEVA ESTRATEGIA: No intentar leer cookies HttpOnly desde JavaScript
  private async getAccessToken(): Promise<string | null> {
    console.log('🔍 === ESTRATEGIA COOKIES HTTPONLY ===');
    
    try {
      // Las cookies HttpOnly no son accesibles desde JavaScript (por seguridad)
      // Pero podemos verificar si hay una sesión activa haciendo una request rápida
      console.log('🔐 Verificando sesión activa con el backend...');
      
      const response = await fetch('/api/v1/auth/validate-token', {
        method: 'POST',
        credentials: 'include', // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Sesión activa confirmada por el backend');
        return 'session_active'; // Token dummy que indica sesión activa
      } else {
        console.log('❌ No hay sesión activa');
        return null;
      }
      
    } catch (error) {
      console.error('💥 Error verificando sesión:', error);
      return null;
    }
  }
  
  // 🔧 MÉTODO DE DEBUG ACTUALIZADO
  debugCookies(): void {
    console.log('🧪 === DEBUG COOKIES HTTPONLY ===');
    
    console.log('📋 Información importante:');
    console.log('  - Las cookies HttpOnly NO son accesibles desde JavaScript');
    console.log('  - Esto es CORRECTO por seguridad');
    console.log('  - document.cookie no mostrará access_token ni refresh_token');
    console.log('  - El navegador las envía automáticamente en requests HTTP');
    
    // Verificar si tenemos cookies visibles
    console.log('\n🍪 Cookies visibles desde JavaScript:');
    console.log('  - String:', `"${document.cookie}"`);
    console.log('  - Longitud:', document.cookie.length);
    
    if (document.cookie.length === 0) {
      console.log('  ✅ Esto es NORMAL si todas las cookies son HttpOnly');
    }
    
    // Verificar DevTools
    console.log('\n🔍 Para ver las cookies HttpOnly:');
    console.log('  1. Abre DevTools (F12)');
    console.log('  2. Ve a Application/Storage > Cookies');
    console.log('  3. Busca access_token y refresh_token');
    console.log('  4. Deberían tener HttpOnly: true');
    
    // Test de sesión
    console.log('\n🧪 Probando verificación de sesión...');
    this.getAccessToken().then(result => {
      console.log('  - Resultado:', result ? 'Sesión activa' : 'Sin sesión');
    });
    
    console.log('========================================');
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
      console.log('🔌 Iniciando conexión WebSocket...', this.config.url);
      
      // 🔧 NUEVA ESTRATEGIA: Verificar sesión en lugar de intentar leer cookies
      const hasActiveSession = await this.getAccessToken();
      const effectiveUserId = userId || this.lastUserId;
      
      console.log('🔍 Estado de autenticación para WebSocket:', {
        hasActiveSession: !!hasActiveSession,
        sessionToken: hasActiveSession || 'N/A',
        userId: effectiveUserId,
        strategy: 'httpOnly_cookies'
      });
      
      // 🔧 CONSTRUCCIÓN DE URL SIN TOKEN (las cookies se envían automáticamente)
      const wsUrl = this.buildWebSocketUrl(effectiveUserId);
      console.log('🔗 URL WebSocket:', wsUrl);
      
      // Crear WebSocket
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
      
      // Promesa para esperar la conexión
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout conectando WebSocket (15s)'));
        }, 15000);
        
        const onOpen = () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket conectado exitosamente');
          resolve();
        };
        
        const onError = (error: Event) => {
          clearTimeout(timeout);
          console.error('❌ Error en conexión WebSocket:', error);
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
  
  // 🔧 CONSTRUCCIÓN DE URL SIMPLIFICADA (sin token, se usan cookies automáticamente)
  private buildWebSocketUrl(userId?: number | null): string {
    const baseUrl = new URL(this.config.url);
    baseUrl.pathname = '/ws/secure'; // 🔧 USAR ENDPOINT SEGURO que lee cookies automáticamente
    
    // Solo incluir userId si está disponible
    if (userId) {
      baseUrl.searchParams.append('user_id', userId.toString());
      console.log(`👤 Conectando como user_id: ${userId}`);
    } else {
      // Fallback: usar userId desde localStorage si está disponible
      try {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId && !isNaN(parseInt(storedUserId))) {
          baseUrl.searchParams.append('user_id', storedUserId);
          console.log(`👤 Usando userId desde localStorage: ${storedUserId}`);
        } else {
          console.warn('⚠️ No se encontró userId válido');
        }
      } catch (e) {
        console.warn('⚠️ Error accediendo localStorage para userId:', e);
      }
    }
    
    console.log('🔐 Las cookies HttpOnly se enviarán automáticamente con la request');
    
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
        if (message.type !== 'pong' && message.type !== 'heartbeat') {
          console.log('📨 WebSocket mensaje recibido:', message.type, message);
        }
        this.handleMessage(message);
      } catch (error) {
        console.error('💥 Error parseando mensaje WebSocket:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket desconectado:', {
        code: event.code,
        reason: event.reason || 'Sin razón específica',
        wasClean: event.wasClean
      });
      
      this.isConnected = false;
      this.connectionState = 'disconnected';
      this.stopHeartbeat();
      
      if (this.eventHandlers['disconnected']) {
        this.eventHandlers['disconnected']({ 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean
        });
      }
      
      // Lógica de reconexión
      this.handleReconnection(event.code);
    };
    
    this.ws.onerror = (error) => {
      console.error('💥 Error WebSocket:', error);
      this.connectionState = 'disconnected';
      
      if (this.eventHandlers['error']) {
        this.eventHandlers['error']({ error });
      }
    };
  }
  
  // 🔧 MANEJO INTELIGENTE DE RECONEXIÓN
  private handleReconnection(closeCode: number): void {
    console.log('🔄 Evaluando necesidad de reconexión para código:', closeCode);
    
    // No reconectar en estos casos
    const noReconnectCodes = [
      1000, // Normal closure
      1001, // Going away
      1008, // Policy violation (auth error)
      4001, // Custom: Authentication required
      4003  // Custom: Insufficient permissions
    ];
    
    if (noReconnectCodes.includes(closeCode)) {
      console.log('🛑 No se reintentará la conexión debido al código de cierre:', closeCode);
      return;
    }
    
    // Reconectar para otros códigos si no hemos excedido el límite
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      console.log('🔄 Programando reconexión automática...');
      this.scheduleReconnect();
    } else {
      console.error('❌ Máximo número de intentos de reconexión alcanzado');
      if (this.eventHandlers['max_reconnect_reached']) {
        this.eventHandlers['max_reconnect_reached']({ attempts: this.reconnectAttempts });
      }
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`🔄 Reconexión programada en ${delay/1000}s... (intento ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
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
    }
    
    // Manejar mensajes del sistema
    switch (message.type) {
      case 'connected':
        console.log('🎉 Conexión WebSocket confirmada por el servidor');
        break;
      case 'error':
        console.error('❌ Error del servidor:', message.data);
        break;
      case 'notification':
        console.log('🔔 Notificación:', message.data);
        break;
      case 'test_response':
        console.log('🧪 Respuesta de test:', message.data);
        break;
      case 'heartbeat':
      case 'pong':
      case 'room_joined':
        // Mensajes silenciosos
        break;
      default:
        if (!['heartbeat', 'pong', 'room_joined'].includes(message.type)) {
          console.log('📨 Mensaje:', message.type, message.data);
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
          console.log('📤 Mensaje enviado:', type);
        }
      } catch (error) {
        console.error('💥 Error enviando mensaje:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      if (type !== 'ping' && type !== 'heartbeat') {
        console.log('📥 Mensaje encolado:', type);
      }
    }
  }
  
  private processMessageQueue(): void {
    let processed = 0;
    while (this.messageQueue.length > 0 && this.isConnected && processed < 10) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws!.send(JSON.stringify(message));
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
  
  // API PÚBLICA (sin cambios)
  on(eventType: string, handler: (data: any) => void): void {
    this.eventHandlers[eventType] = handler;
  }
  
  off(eventType: string): void {
    delete this.eventHandlers[eventType];
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
      userId: this.lastUserId,
      readyState: this.ws ? this.ws.readyState : -1,
      strategy: 'httpOnly_cookies'
    };
  }
  
  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.disconnect();
    setTimeout(() => this.connect(this.lastUserId || undefined), 1000);
  }
  
  getDebugInfo() {
    return {
      connection: this.getConnectionInfo(),
      config: this.config,
      handlers: Object.keys(this.eventHandlers),
      messageQueue: this.messageQueue.map(msg => ({ type: msg.type, timestamp: msg.timestamp })),
      cookies: {
        strategy: 'httpOnly_cookies',
        accessible_from_js: false,
        sent_automatically: true,
        security_note: 'HttpOnly cookies are not accessible from JavaScript (correct behavior)'
      },
      timestamp: new Date().toISOString()
    };
  }
  
  sendTestMessage(): void {
    this.send('test', {
      message: 'Mensaje de prueba desde el frontend',
      timestamp: new Date().toISOString(),
      strategy: 'httpOnly_cookies',
      userId: this.lastUserId
    });
  }
}

// Singleton export
const webSocketService = new WebSocketService();

// Exponer en window para debugging
if (typeof window !== 'undefined') {
  (window as any).webSocketService = webSocketService;
}

export default webSocketService;