// frontend/src/components/debug/WebSocketDebug.tsx
// 🔍 Componente de debugging para WebSocket

import React, { useState, useEffect } from 'react';
import { useWebSocketStatus } from '../../context/AppDataContext';
import webSocketService from '../../services/websocket/websocket.service';

interface WebSocketDebugProps {
  onClose?: () => void;
}

const WebSocketDebug: React.FC<WebSocketDebugProps> = ({ onClose }) => {
  const wsStatus = useWebSocketStatus();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo(webSocketService.getDebugInfo());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleConnect = async () => {
    try {
      addLog('Intentando conectar...');
      await wsStatus.connect();
      addLog('Conexión iniciada');
    } catch (error) {
      addLog(`Error conectando: ${error}`);
    }
  };
  
  const handleDisconnect = () => {
    addLog('Desconectando...');
    wsStatus.disconnect();
  };
  
  const handleTestMessage = () => {
    addLog('Enviando mensaje de prueba...');
    webSocketService.sendTestMessage();
  };
  
  const handleForceReconnect = () => {
    addLog('Forzando reconexión...');
    webSocketService.forceReconnect();
  };
  
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'reconnecting': return 'text-orange-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected': return '✅';
      case 'connecting': return '🔄';
      case 'reconnecting': return '🔁';
      case 'error': return '❌';
      default: return '⚪';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96 max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">🔍 WebSocket Debug</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Estado Principal */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">{getStatusIcon(wsStatus.connectionState)}</span>
          <span className={`font-semibold ${getStatusColor(wsStatus.connectionState)}`}>
            {wsStatus.connectionState.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm space-y-1">
          <div>Conectado: {wsStatus.isConnected ? '✅ Sí' : '❌ No'}</div>
          <div>Online: {wsStatus.isOnline ? '✅ Sí' : '❌ No'}</div>
          {wsStatus.lastUpdate && (
            <div>Última actualización: {new Date(wsStatus.lastUpdate).toLocaleTimeString()}</div>
          )}
        </div>
      </div>
      
      {/* Información Detallada */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold mb-2">📊 Info Detallada</h4>
          <div className="text-xs space-y-1">
            <div>URL: {debugInfo.url}</div>
            <div>Ready State: {debugInfo.readyStateText} ({debugInfo.readyState})</div>
            <div>Reintentos: {debugInfo.reconnectAttempts}/{debugInfo.maxReconnectAttempts}</div>
            <div>Cola: {debugInfo.queuedMessages} mensajes</div>
            <div>Token: {debugInfo.token}</div>
            <div>Handlers: {debugInfo.handlers?.join(', ')}</div>
          </div>
        </div>
      )}
      
      {/* Controles */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button 
          onClick={handleConnect}
          disabled={wsStatus.isConnected}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:bg-gray-300"
        >
          🔌 Conectar
        </button>
        
        <button 
          onClick={handleDisconnect}
          disabled={!wsStatus.isConnected}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-300"
        >
          🔌 Desconectar
        </button>
        
        <button 
          onClick={handleTestMessage}
          disabled={!wsStatus.isConnected}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
        >
          🧪 Test
        </button>
        
        <button 
          onClick={handleForceReconnect}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
        >
          🔄 Reconectar
        </button>
      </div>
      
      {/* Logs */}
      <div>
        <h4 className="font-semibold mb-2">📜 Logs Recientes</h4>
        <div className="bg-black text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <div>No hay logs aún...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDebug;