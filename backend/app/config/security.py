from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
import secrets
import hashlib
import hmac

from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.hash import bcrypt
from fastapi import HTTPException, status
import logging

from app.config.settings import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, 
    JWT_ISSUER, JWT_AUDIENCE, PASSWORD_SALT
)

logger = logging.getLogger(__name__)

# Configuración mejorada de hashing de contraseñas
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    bcrypt__rounds=12,  # Más rounds para mayor seguridad
    pbkdf2_sha256__rounds=100000  # Configuración explícita
)

class SecureTokenManager:
    """
    Gestión segura de tokens JWT con características anti-explotación
    """
    
    @staticmethod
    def create_access_token(
        subject: Union[str, Any], 
        expires_delta: Optional[timedelta] = None,
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Genera un token JWT de acceso con seguridad mejorada
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Timestamp de emisión para tracking
        issued_at = datetime.utcnow()
        
        # Payload base con claims estándar y de seguridad
        payload = {
            "sub": str(subject),
            "exp": expire,
            "iat": issued_at,
            "iss": JWT_ISSUER,
            "aud": JWT_AUDIENCE,
            "type": "access",
            # Agregar nonce único para prevenir ataques de replay
            "jti": secrets.token_urlsafe(16),  # JWT ID único
            # Fingerprint del token para validación adicional
            "fp": SecureTokenManager._generate_token_fingerprint(str(subject), issued_at)
        }
        
        # Agregar claims adicionales si se proporcionan
        if additional_claims:
            payload.update(additional_claims)
        
        try:
            encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
            logger.info(f"Token de acceso creado para usuario {subject}")
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error al crear token de acceso: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al generar token"
            )
    
    @staticmethod
    def create_refresh_token(
        subject: Union[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Genera un token de refresh con mayor tiempo de vida
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        
        issued_at = datetime.utcnow()
        
        payload = {
            "sub": str(subject),
            "exp": expire,
            "iat": issued_at,
            "iss": JWT_ISSUER,
            "aud": JWT_AUDIENCE,
            "type": "refresh",
            "jti": secrets.token_urlsafe(16),
            "fp": SecureTokenManager._generate_token_fingerprint(str(subject), issued_at, "refresh")
        }
        
        try:
            encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
            logger.info(f"Token de refresh creado para usuario {subject}")
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error al crear token de refresh: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al generar token de refresh"
            )
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verifica y decodifica un token JWT con validaciones de seguridad
        """
        try:
            # Decodificar token con validación de audiencia e issuer
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                audience=JWT_AUDIENCE,
                issuer=JWT_ISSUER
            )
            
            # Validar tipo de token
            if payload.get("type") != token_type:
                logger.warning(f"Tipo de token incorrecto. Esperado: {token_type}, Recibido: {payload.get('type')}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tipo de token inválido"
                )
            
            # Validar fingerprint del token
            expected_fp = SecureTokenManager._generate_token_fingerprint(
                payload.get("sub"),
                datetime.fromtimestamp(payload.get("iat", 0)),
                token_type
            )
            
            if payload.get("fp") != expected_fp:
                logger.warning(f"Fingerprint de token inválido para usuario {payload.get('sub')}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token corrompido o inválido"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.info("Token expirado")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado"
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token inválido: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error inesperado al verificar token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar token"
            )
    
    @staticmethod
    def _generate_token_fingerprint(subject: str, issued_at: datetime, token_type: str = "access") -> str:
        """
        Genera un fingerprint único para el token basado en datos del usuario
        """
        # Combinar datos únicos del token
        data = f"{subject}:{issued_at.timestamp()}:{token_type}:{SECRET_KEY[:8]}"
        
        # Generar hash HMAC
        return hmac.new(
            SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()[:16]
    
    @staticmethod
    def extract_token_id(token: str) -> Optional[str]:
        """
        Extrae el JTI (JWT ID) del token sin validarlo completamente
        """
        try:
            # Decodificar sin verificar para obtener el JTI
            unverified_payload = jwt.get_unverified_claims(token)
            return unverified_payload.get("jti")
        except Exception:
            return None

# Funciones de contraseña mejoradas
def create_password_hash(password: str) -> str:
    """
    Genera un hash seguro para una contraseña con salt adicional
    """
    # Agregar salt personalizado antes del hashing
    salted_password = f"{PASSWORD_SALT}{password}"
    return pwd_context.hash(salted_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña coincide con su hash
    """
    # Agregar el mismo salt antes de verificar
    salted_password = f"{PASSWORD_SALT}{plain_password}"
    return pwd_context.verify(salted_password, hashed_password)

def generate_secure_password(length: int = 16) -> str:
    """
    Genera una contraseña segura aleatoria
    """
    return secrets.token_urlsafe(length)

def check_password_strength(password: str) -> Dict[str, Any]:
    """
    Evalúa la fortaleza de una contraseña
    """
    import re
    
    score = 0
    feedback = []
    
    # Longitud mínima
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("La contraseña debe tener al menos 8 caracteres")
    
    # Contiene mayúsculas
    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("Debe contener al menos una letra mayúscula")
    
    # Contiene minúsculas
    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("Debe contener al menos una letra minúscula")
    
    # Contiene números
    if re.search(r"\d", password):
        score += 1
    else:
        feedback.append("Debe contener al menos un número")
    
    # Contiene símbolos
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 1
    else:
        feedback.append("Debe contener al menos un símbolo especial")
    
    # Evaluar fortaleza
    if score >= 5:
        strength = "muy_fuerte"
    elif score >= 4:
        strength = "fuerte"
    elif score >= 3:
        strength = "media"
    elif score >= 2:
        strength = "débil"
    else:
        strength = "muy_débil"
    
    return {
        "score": score,
        "strength": strength,
        "feedback": feedback,
        "is_strong": score >= 4
    }

# Funciones de compatibilidad (mantener para no romper código existente)
def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Función de compatibilidad"""
    return SecureTokenManager.create_access_token(subject, expires_delta)

def get_password_hash(password: str) -> str:
    """Función de compatibilidad"""
    return create_password_hash(password)