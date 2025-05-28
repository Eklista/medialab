# backend/app/schemas/auth/password.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class ForgotPasswordRequest(BaseModel):
    """Schema para solicitud de recuperación de contraseña"""
    email: EmailStr = Field(..., description="Email del usuario")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com"
            }
        }

class ForgotPasswordResponse(BaseModel):
    """Schema para respuesta de solicitud de recuperación"""
    message: str = Field(..., description="Mensaje de confirmación")
    details: str = Field(..., description="Detalles adicionales")
    expires_in_minutes: int = Field(default=10, description="Tiempo de expiración del código")
    environment: str = Field(..., description="Ambiente actual")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Si el correo existe, recibirás un código para restablecer tu contraseña",
                "details": "Código enviado si el email es válido",
                "expires_in_minutes": 10,
                "environment": "development"
            }
        }

class VerifyCodeRequest(BaseModel):
    """Schema para verificación de código de recuperación"""
    email: EmailStr = Field(..., description="Email del usuario")
    code: str = Field(..., min_length=6, max_length=6, pattern="^\\d{6}$", description="Código de 6 dígitos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com",
                "code": "123456"
            }
        }

class VerifyCodeResponse(BaseModel):
    """Schema para respuesta de verificación de código"""
    valid: bool = Field(..., description="Indica si el código es válido")
    message: str = Field(..., description="Mensaje descriptivo")
    email: str = Field(..., description="Email confirmado")
    next_step: str = Field(default="reset_password", description="Siguiente paso en el proceso")
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "message": "Código verificado correctamente",
                "email": "usuario@ejemplo.com",
                "next_step": "reset_password"
            }
        }

class ResetPasswordRequest(BaseModel):
    """Schema para restablecimiento de contraseña con código"""
    email: EmailStr = Field(..., description="Email del usuario")
    code: str = Field(..., min_length=6, max_length=6, pattern="^\\d{6}$", description="Código de verificación")
    new_password: str = Field(..., min_length=8, description="Nueva contraseña")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com",
                "code": "123456",
                "new_password": "nueva_contraseña_segura_123!"
            }
        }

class ResetPasswordResponse(BaseModel):
    """Schema para respuesta de restablecimiento de contraseña"""
    message: str = Field(..., description="Mensaje de confirmación")
    email: str = Field(..., description="Email del usuario")
    success: bool = Field(default=True, description="Indica si fue exitoso")
    next_step: str = Field(default="login", description="Siguiente paso recomendado")
    security_note: str = Field(..., description="Nota de seguridad")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Contraseña restablecida exitosamente",
                "email": "usuario@ejemplo.com",
                "success": True,
                "next_step": "login",
                "security_note": "Todas las sesiones activas han sido cerradas por seguridad"
            }
        }

class ChangePasswordRequest(BaseModel):
    """Schema para cambio de contraseña autenticado"""
    current_password: str = Field(..., min_length=1, description="Contraseña actual")
    new_password: str = Field(..., min_length=8, description="Nueva contraseña")
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "contraseña_actual",
                "new_password": "nueva_contraseña_segura_123!"
            }
        }

class ChangePasswordResponse(BaseModel):
    """Schema para respuesta de cambio de contraseña"""
    message: str = Field(..., description="Mensaje de confirmación")
    user_id: int = Field(..., description="ID del usuario")
    email: str = Field(..., description="Email del usuario")
    success: bool = Field(default=True, description="Indica si fue exitoso")
    security_actions: Dict[str, bool] = Field(..., description="Acciones de seguridad ejecutadas")
    recommendation: str = Field(..., description="Recomendación de seguridad")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Contraseña actualizada exitosamente",
                "user_id": 123,
                "email": "usuario@ejemplo.com",
                "success": True,
                "security_actions": {
                    "password_updated": True,
                    "sessions_invalidated": True,
                    "strength_validated": True
                },
                "recommendation": "Tu nueva contraseña es segura. Todas las demás sesiones han sido cerradas."
            }
        }

class PasswordStrengthRequest(BaseModel):
    """Schema para verificación de fortaleza de contraseña"""
    password: str = Field(..., min_length=1, description="Contraseña a evaluar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "password": "mi_nueva_contraseña_123!"
            }
        }

class PasswordStrengthResponse(BaseModel):
    """Schema para respuesta de evaluación de fortaleza"""
    password_length: int = Field(..., description="Longitud de la contraseña")
    score: int = Field(..., ge=0, le=5, description="Puntuación de fortaleza (0-5)")
    strength: str = Field(..., description="Nivel de fortaleza")
    is_strong: bool = Field(..., description="Indica si es considerada fuerte")
    feedback: List[str] = Field(..., description="Retroalimentación sobre la contraseña")
    recommendations: Dict[str, Any] = Field(..., description="Recomendaciones de mejora")
    
    class Config:
        json_schema_extra = {
            "example": {
                "password_length": 15,
                "score": 4,
                "strength": "fuerte",
                "is_strong": True,
                "feedback": ["Excelente longitud", "Contiene mayúsculas y minúsculas"],
                "recommendations": {
                    "min_length": 8,
                    "requires": [
                        "Al menos una letra mayúscula",
                        "Al menos una letra minúscula",
                        "Al menos un número",
                        "Al menos un símbolo especial"
                    ]
                }
            }
        }

class PasswordChangeRequestResponse(BaseModel):
    """Schema para respuesta de solicitud de cambio de contraseña"""
    message: str = Field(..., description="Mensaje de confirmación")
    user_id: int = Field(..., description="ID del usuario")
    email: str = Field(..., description="Email del usuario")
    next_steps: List[str] = Field(..., description="Pasos siguientes")
    security_note: str = Field(..., description="Nota de seguridad")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Solicitud de cambio de contraseña procesada",
                "user_id": 123,
                "email": "usuario@ejemplo.com",
                "next_steps": [
                    "Usa el endpoint /change-password con tu contraseña actual",
                    "Asegúrate de que la nueva contraseña sea segura"
                ],
                "security_note": "Por seguridad, te recomendamos cambiar tu contraseña regularmente"
            }
        }

class PasswordPolicyResponse(BaseModel):
    """Schema para respuesta de política de contraseñas"""
    policy: Dict[str, Any] = Field(..., description="Reglas de la política")
    strength_levels: Dict[str, Dict[str, str]] = Field(..., description="Niveles de fortaleza")
    recommendations: List[str] = Field(..., description="Recomendaciones generales")
    security_features: Dict[str, str] = Field(..., description="Características de seguridad")
    
    class Config:
        schema_extra = {
            "example": {
                "policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_lowercase": True,
                    "require_numbers": True,
                    "require_special_chars": True
                },
                "strength_levels": {
                    "muy_fuerte": {"score": "5", "color": "#388e3c"}
                },
                "recommendations": [
                    "Usa una combinación de letras mayúsculas y minúsculas"
                ],
                "security_features": {
                    "password_hashing": "bcrypt con salt"
                }
            }
        }