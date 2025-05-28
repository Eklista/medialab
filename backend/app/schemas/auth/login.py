# backend/app/schemas/auth/login.py
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class LoginRequest(BaseModel):
    """Schema para solicitud de login"""
    username: str = Field(..., description="Email o nombre de usuario")
    password: str = Field(..., min_length=1, description="Contraseña del usuario")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "usuario@ejemplo.com",
                "password": "mi_contraseña_segura"
            }
        }

class LoginResponse(BaseModel):
    """Schema para respuesta de login exitoso"""
    message: str = Field(default="Login successful")
    user_id: int = Field(..., description="ID del usuario autenticado")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    environment: str = Field(..., description="Ambiente actual")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Login successful",
                "user_id": 123,
                "expires_in": 3600,
                "environment": "development"
            }
        }

class RefreshTokenRequest(BaseModel):
    """Schema para solicitud de refresh token"""
    refresh_token: str = Field(..., description="Token de refresco válido")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }

class RefreshTokenResponse(BaseModel):
    """Schema para respuesta de refresh token"""
    message: str = Field(default="Token refreshed successfully")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Token refreshed successfully", 
                "expires_in": 3600
            }
        }

class LogoutRequest(BaseModel):
    """Schema para solicitud de logout"""
    refresh_token: Optional[str] = Field(None, description="Token de refresco opcional")
    logout_all_devices: bool = Field(default=False, description="Cerrar sesión en todos los dispositivos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "logout_all_devices": False
            }
        }

class LogoutResponse(BaseModel):
    """Schema para respuesta de logout"""
    message: str = Field(..., description="Mensaje de confirmación")
    user: str = Field(..., description="Email del usuario")
    tokens_blacklisted: int = Field(..., description="Número de tokens invalidados")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Logout exitoso",
                "user": "usuario@ejemplo.com",
                "tokens_blacklisted": 2
            }
        }

class LogoutAllResponse(BaseModel):
    """Schema para respuesta de logout global"""
    message: str = Field(..., description="Mensaje de confirmación")
    user: Dict[str, Any] = Field(..., description="Información del usuario")
    global_logout: bool = Field(default=True, description="Indica si fue logout global")
    cookies_cleared: bool = Field(default=True, description="Indica si se limpiaron las cookies")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Todas las sesiones han sido cerradas exitosamente",
                "user": {"id": 123, "email": "usuario@ejemplo.com"},
                "global_logout": True,
                "cookies_cleared": True
            }
        }

class TokenValidationResponse(BaseModel):
    """Schema para respuesta de validación de token"""
    valid: bool = Field(..., description="Indica si el token es válido")
    user_id: int = Field(..., description="ID del usuario")
    email: str = Field(..., description="Email del usuario")
    expires_in: int = Field(..., description="Tiempo restante de expiración")
    environment: str = Field(..., description="Ambiente actual")
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "user_id": 123,
                "email": "usuario@ejemplo.com",
                "expires_in": 3600,
                "environment": "development"
            }
        }

class PasswordVerifyRequest(BaseModel):
    """Schema para verificación de contraseña actual"""
    password: str = Field(..., min_length=1, description="Contraseña a verificar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "password": "mi_contraseña_actual"
            }
        }

class PasswordVerifyResponse(BaseModel):
    """Schema para respuesta de verificación de contraseña"""
    valid: bool = Field(..., description="Indica si la contraseña es válida")
    message: str = Field(..., description="Mensaje descriptivo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "message": "Contraseña verificada correctamente"
            }
        }