# backend/config/websocket_config.py
"""
🔌 CONFIGURACIÓN WEBSOCKET
Configuración centralizada para WebSockets
"""

from typing import Dict, Any
import os
from pydantic import Field
from pydantic_settings import BaseSettings

class WebSocketConfig(BaseSettings):
    """
    Configuración para WebSocket
    """
    
    # ===== CONFIGURACIONES BÁSICAS =====
    websocket_enabled: bool = Field(
        default=True,
        description="Habilitar WebSocket"
    )
    
    websocket_host: str = Field(
        default="0.0.0.0",
        description="Host para WebSocket"
    )
    
    websocket_port: int = Field(
        default=8000,
        description="Puerto para WebSocket (mismo que FastAPI)"
    )
    
    # ===== CONFIGURACIONES DE CONEXIÓN =====
    max_connections_per_user: int = Field(
        default=5,
        description="Máximo conexiones por usuario"
    )
    
    max_total_connections: int = Field(
        default=1000,
        description="Máximo total de conexiones"
    )
    
    connection_timeout: int = Field(
        default=300,  # 5 minutos
        description="Timeout de conexión en segundos"
    )
    
    heartbeat_interval: int = Field(
        default=30,  # 30 segundos
        description="Intervalo de heartbeat en segundos"
    )
    
    # ===== CONFIGURACIONES DE MENSAJES =====
    max_message_size: int = Field(
        default=64 * 1024,  # 64KB
        description="Tamaño máximo de mensaje en bytes"
    )
    
    message_queue_size: int = Field(
        default=100,
        description="Tamaño de cola de mensajes por conexión"
    )
    
    # ===== CONFIGURACIONES DE SEGURIDAD =====
    require_authentication: bool = Field(
        default=True,
        description="Requerir autenticación para WebSocket"
    )
    
    allowed_origins: list = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://medialab.eklista.com"
        ],
        description="Orígenes permitidos para CORS"
    )
    
    # ===== CONFIGURACIONES DE LOGGING =====
    log_connections: bool = Field(
        default=True,
        description="Loggear conexiones/desconexiones"
    )
    
    log_messages: bool = Field(
        default=False,  # Por seguridad, deshabilitado por defecto
        description="Loggear mensajes (cuidado con datos sensibles)"
    )
    
    # ===== CONFIGURACIONES DE DESARROLLO =====
    debug_mode: bool = Field(
        default=False,
        description="Modo debug para desarrollo"
    )
    
    development_mode: bool = Field(
        default=os.getenv("ENVIRONMENT", "development") == "development",
        description="Modo desarrollo"
    )
    
    class Config:
        env_prefix = "WEBSOCKET_"
        case_sensitive = False

# ===== CONFIGURACIÓN GLOBAL =====
websocket_config = WebSocketConfig()

# ===== CONFIGURACIONES ESPECÍFICAS =====
WEBSOCKET_SETTINGS: Dict[str, Any] = {
    "enabled": websocket_config.websocket_enabled,
    "host": websocket_config.websocket_host,
    "port": websocket_config.websocket_port,
    "max_connections_per_user": websocket_config.max_connections_per_user,
    "max_total_connections": websocket_config.max_total_connections,
    "connection_timeout": websocket_config.connection_timeout,
    "heartbeat_interval": websocket_config.heartbeat_interval,
    "max_message_size": websocket_config.max_message_size,
    "message_queue_size": websocket_config.message_queue_size,
    "require_authentication": websocket_config.require_authentication,
    "allowed_origins": websocket_config.allowed_origins,
    "log_connections": websocket_config.log_connections,
    "log_messages": websocket_config.log_messages,
    "debug_mode": websocket_config.debug_mode,
    "development_mode": websocket_config.development_mode,
}

def get_websocket_config() -> WebSocketConfig:
    """
    Obtener configuración de WebSocket
    """
    return websocket_config

def is_websocket_enabled() -> bool:
    """
    Verificar si WebSocket está habilitado
    """
    return websocket_config.websocket_enabled