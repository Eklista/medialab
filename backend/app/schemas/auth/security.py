# backend/app/schemas/auth/security.py
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class SecurityStatusResponse(BaseModel):
    """Schema para estado de seguridad del sistema"""
    user_id: int = Field(..., description="ID del usuario actual")
    environment: str = Field(..., description="Ambiente actual")
    security_features: Dict[str, bool] = Field(..., description="Características de seguridad habilitadas")
    session_info: Dict[str, Any] = Field(..., description="Información de la sesión")
    system_health: Dict[str, bool] = Field(..., description="Estado de salud del sistema")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "environment": "development",
                "security_features": {
                    "httponly_cookies": True,
                    "secure_cookies": False,
                    "token_blacklist": True,
                    "rate_limiting": True,
                    "hybrid_blacklist": True,
                    "jwe_encryption": True
                },
                "session_info": {
                    "expires_in": 3600,
                    "refresh_expires_in": 604800,
                    "secure_transport": False
                },
                "system_health": {
                    "redis_available": True,
                    "blacklist_operational": True
                }
            }
        }

class SecurityStatsResponse(BaseModel):
    """Schema para estadísticas de seguridad"""
    token_blacklist: Dict[str, Any] = Field(..., description="Estadísticas de blacklist de tokens")
    rate_limiting: Dict[str, Any] = Field(..., description="Estadísticas de rate limiting")
    hybrid_system_available: bool = Field(default=True, description="Sistema híbrido disponible")
    security_features: Dict[str, bool] = Field(..., description="Características de seguridad")
    
    class Config:
        json_schema_extra = {
            "example": {
                "token_blacklist": {
                    "enabled": True,
                    "total_blacklisted": 150,
                    "redis_available": True
                },
                "rate_limiting": {
                    "enabled": True,
                    "requests_blocked": 25,
                    "redis_available": True
                },
                "hybrid_system_available": True,
                "security_features": {
                    "hybrid_token_blacklist": True,
                    "robust_jti_extraction": True,
                    "jwe_encryption_support": True,
                    "rate_limiting_enabled": True,
                    "failed_attempts_tracking": True,
                    "global_user_invalidation": True,
                    "automatic_cleanup": True
                }
            }
        }

class SecurityEvent(BaseModel):
    """Schema para eventos de seguridad"""
    event_type: str = Field(..., description="Tipo de evento")
    user_id: Optional[int] = Field(None, description="ID del usuario involucrado")
    ip_address: Optional[str] = Field(None, description="Dirección IP")
    timestamp: datetime = Field(..., description="Timestamp del evento")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detalles del evento")
    severity: str = Field(..., description="Severidad del evento")
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "failed_login",
                "user_id": 123,
                "ip_address": "192.168.1.100",
                "timestamp": "2024-01-15T10:30:00Z",
                "details": {"attempts": 3, "endpoint": "/auth/login"},
                "severity": "warning"
            }
        }

class RateLimitInfo(BaseModel):
    """Schema para información de rate limiting"""
    allowed: bool = Field(..., description="Si la request está permitida")
    current_requests: int = Field(..., description="Número actual de requests")
    max_requests: int = Field(..., description="Máximo de requests permitidas")
    remaining: int = Field(..., description="Requests restantes")
    reset_time: int = Field(..., description="Tiempo hasta el reset")
    retry_after: int = Field(..., description="Segundos para reintento")
    
    class Config:
        json_schema_extra = {
            "example": {
                "allowed": True,
                "current_requests": 15,
                "max_requests": 60,
                "remaining": 45,
                "reset_time": 1642248600,
                "retry_after": 0
            }
        }

class TokenBlacklistInfo(BaseModel):
    """Schema para información de blacklist de tokens"""
    is_blacklisted: bool = Field(..., description="Si el token está en blacklist")
    blacklist_type: Optional[str] = Field(None, description="Tipo de blacklist")
    blacklisted_at: Optional[datetime] = Field(None, description="Cuando fue añadido a blacklist")
    reason: Optional[str] = Field(None, description="Razón del blacklist")
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_blacklisted": False,
                "blacklist_type": None,
                "blacklisted_at": None,
                "reason": None
            }
        }

class UserSecurityInfo(BaseModel):
    """Schema para información de seguridad del usuario"""
    user_id: int = Field(..., description="ID del usuario")
    failed_attempts: int = Field(default=0, description="Intentos fallidos recientes")
    last_successful_login: Optional[datetime] = Field(None, description="Último login exitoso")
    is_locked_out: bool = Field(default=False, description="Si está bloqueado temporalmente")
    lockout_until: Optional[datetime] = Field(None, description="Bloqueado hasta")
    active_sessions: int = Field(default=0, description="Sesiones activas")
    password_changed_at: Optional[datetime] = Field(None, description="Última vez que cambió contraseña")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "failed_attempts": 0,
                "last_successful_login": "2024-01-15T10:30:00Z",
                "is_locked_out": False,
                "lockout_until": None,
                "active_sessions": 2,
                "password_changed_at": "2024-01-10T15:20:00Z"
            }
        }

class SecurityCleanupResponse(BaseModel):
    """Schema para respuesta de limpieza de seguridad"""
    blacklist_entries_cleaned: int = Field(..., description="Entradas de blacklist limpiadas")
    rate_limit_entries_cleaned: int = Field(..., description="Entradas de rate limit limpiadas")
    hybrid_system_cleanup: bool = Field(default=True, description="Limpieza del sistema híbrido")
    cleanup_timestamp: datetime = Field(..., description="Timestamp de la limpieza")
    
    class Config:
        json_schema_extra = {
            "example": {
                "blacklist_entries_cleaned": 25,
                "rate_limit_entries_cleaned": 10,
                "hybrid_system_cleanup": True,
                "cleanup_timestamp": "2024-01-15T10:30:00Z"
            }
        }

class EmergencyResetResponse(BaseModel):
    """Schema para respuesta de reset de emergencia"""
    success: bool = Field(..., description="Si el reset fue exitoso")
    user_id: int = Field(..., description="ID del usuario afectado")
    admin_user: str = Field(..., description="Email del administrador que ejecutó el reset")
    message: str = Field(..., description="Mensaje descriptivo")
    actions_taken: List[str] = Field(default_factory=list, description="Acciones ejecutadas")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "user_id": 123,
                "admin_user": "admin@ejemplo.com",
                "message": "Reset de seguridad ejecutado",
                "actions_taken": [
                    "Todas las sesiones invalidadas",
                    "Tokens añadidos a blacklist",
                    "Intentos fallidos limpiados"
                ]
            }
        }