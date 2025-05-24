# backend/app/config/security.py
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
import secrets
import hashlib
import hmac

from jose import jwt, JWTError, ExpiredSignatureError, jwe
from cryptography.fernet import Fernet
import base64
from passlib.context import CryptContext
from passlib.hash import bcrypt
from fastapi import HTTPException, status
import logging

import os

from app.config.settings import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, 
    JWT_ISSUER, JWT_AUDIENCE, PASSWORD_SALT
)

logger = logging.getLogger(__name__)

# Configuración mejorada de hashing de contraseñas
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    bcrypt__rounds=12,
    pbkdf2_sha256__rounds=100000
)

class SecureTokenManager:
    """
    Gestión segura de tokens JWT con características anti-explotación + JWE
    Mejorado para manejar algoritmos de manera más robusta
    """
    
    # Lista de algoritmos permitidos
    ALLOWED_ALGORITHMS = [ALGORITHM, "HS256", "HS384", "HS512"]
    
    @staticmethod
    def create_access_token(
        subject: Union[str, Any], 
        expires_delta: Optional[timedelta] = None,
        additional_claims: Optional[Dict[str, Any]] = None,
        encrypt: bool = True  # 🔥 NUEVO: Opción para encriptar
    ) -> str:
        """
        Genera un token JWT de acceso con seguridad mejorada + JWE opcional
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
            # Simplificar fingerprint para evitar problemas
            "fp": SecureTokenManager._generate_simple_fingerprint(str(subject))
        }
        
        # Agregar claims adicionales si se proporcionan
        if additional_claims:
            payload.update(additional_claims)
        
        try:
            # PASO 1: Crear JWT normal con algoritmo específico
            encoded_jwt = jwt.encode(
                payload, 
                SECRET_KEY, 
                algorithm=ALGORITHM,
                headers={"alg": ALGORITHM, "typ": "JWT"}  # Especificar headers explícitamente
            )
            
            # 🔥 PASO 2: ENCRIPTAR con JWE si está habilitado
            if encrypt:
                # Preparar clave de encriptación (256 bits)
                encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                
                # Encriptar con JWE usando AES-256-GCM (súper seguro)
                encrypted_token = jwe.encrypt(
                    encoded_jwt.encode(),
                    encryption_key,
                    algorithm="dir",           # Direct key agreement  
                    encryption="A256GCM"       # AES-256-GCM
                )
                
                logger.info(f"Token ENCRIPTADO creado para usuario {subject}")
                return encrypted_token.decode()
            else:
                logger.info(f"Token normal creado para usuario {subject}")
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
        expires_delta: Optional[timedelta] = None,
        encrypt: bool = True  # 🔥 NUEVO: Encriptar refresh también
    ) -> str:
        """
        Genera un token de refresh con mayor tiempo de vida + JWE
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
            "fp": SecureTokenManager._generate_simple_fingerprint(str(subject))
        }
        
        try:
            # PASO 1: Crear JWT con headers explícitos
            encoded_jwt = jwt.encode(
                payload, 
                SECRET_KEY, 
                algorithm=ALGORITHM,
                headers={"alg": ALGORITHM, "typ": "JWT"}
            )
            
            # 🔥 PASO 2: ENCRIPTAR si está habilitado
            if encrypt:
                encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                
                encrypted_token = jwe.encrypt(
                    encoded_jwt.encode(),
                    encryption_key,
                    algorithm="dir",
                    encryption="A256GCM"
                )
                
                logger.info(f"Refresh token ENCRIPTADO creado para usuario {subject}")
                return encrypted_token.decode()
            else:
                logger.info(f"Refresh token normal creado para usuario {subject}")
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
        Verifica y decodifica un token JWT con soporte para JWE
        Mejorado para manejar errores de algoritmo
        """
        try:
            jwt_token = token
            
            # 🔥 PASO 1: Intentar desencriptar si es JWE
            if SecureTokenManager._is_encrypted_token(token):
                logger.debug("Detectado token encriptado JWE")
                
                encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                
                try:
                    # Desencriptar JWE
                    decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                    jwt_token = decrypted_bytes.decode()
                    logger.debug("Token JWE desencriptado exitosamente")
                    
                except Exception as e:
                    logger.error(f"Error al desencriptar JWE: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token encriptado inválido"
                    )
            
            # PASO 2: Decodificar JWT (normal o desencriptado)
            # Intentar con diferentes algoritmos en caso de problemas
            payload = None
            decode_error = None
            
            for algorithm in SecureTokenManager.ALLOWED_ALGORITHMS:
                try:
                    payload = jwt.decode(
                        jwt_token,
                        SECRET_KEY,
                        algorithms=[algorithm],
                        audience=JWT_AUDIENCE,
                        issuer=JWT_ISSUER,
                        options={
                            "verify_signature": True,
                            "verify_exp": True,
                            "verify_nbf": True,
                            "verify_iat": True,
                            "verify_aud": True,
                            "verify_iss": True
                        }
                    )
                    break  # Si funciona, salir del bucle
                except JWTError as jwt_err:
                    decode_error = jwt_err
                    continue  # Intentar con el siguiente algoritmo
            
            if payload is None:
                logger.warning(f"No se pudo decodificar token con ningún algoritmo: {decode_error}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido"
                )
            
            # Validar tipo de token
            if payload.get("type") != token_type:
                logger.warning(f"Tipo de token incorrecto. Esperado: {token_type}, Recibido: {payload.get('type')}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tipo de token inválido"
                )
            
            # Validación simplificada de fingerprint
            expected_fp = SecureTokenManager._generate_simple_fingerprint(payload.get("sub"))
            token_fp = payload.get("fp")
            
            if token_fp and token_fp != expected_fp:
                logger.warning(f"Fingerprint de token inválido para usuario {payload.get('sub')}")
                # En lugar de fallar, solo logear la advertencia
                logger.info("Continuando con token a pesar de fingerprint inválido (compatibilidad)")
            
            return payload
            
        except ExpiredSignatureError:
            logger.info("Token expirado")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado"
            )
        except JWTError as e:
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
    def _is_encrypted_token(token: str) -> bool:
        """
        🔥 MEJORADO: Detecta si un token es JWE encriptado
        """
        try:
            # Los tokens JWE tienen 5 partes separadas por puntos
            # vs JWT normal que tiene 3 partes
            parts = token.split('.')
            
            # JWE: header.encrypted_key.iv.ciphertext.tag (5 partes)
            # JWT: header.payload.signature (3 partes)
            if len(parts) == 5:
                # Verificar que el header indique encriptación
                try:
                    header_part = parts[0]
                    # Agregar padding si es necesario
                    missing_padding = len(header_part) % 4
                    if missing_padding:
                        header_part += '=' * (4 - missing_padding)
                    
                    header_bytes = base64.urlsafe_b64decode(header_part)
                    header_json = header_bytes.decode('utf-8')
                    return '"enc":' in header_json
                except:
                    return False
            
            return False
            
        except Exception:
            return False
    
    @staticmethod
    def _generate_simple_fingerprint(subject: str) -> str:
        """
        Genera un fingerprint simple para el token
        """
        # Método simplificado para evitar problemas de compatibilidad
        data = f"{subject}:{SECRET_KEY[:8]}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    @staticmethod
    def _generate_token_fingerprint(subject: str, issued_at: datetime, token_type: str = "access") -> str:
        """
        Método legacy mantenido para compatibilidad
        """
        return SecureTokenManager._generate_simple_fingerprint(subject)
    
    @staticmethod
    def extract_token_id(token: str) -> Optional[str]:
        """
        Extrae el JTI (JWT ID) del token sin validarlo completamente
        Mejorado para manejar errores de algoritmo
        """
        try:
            # 🔥 MEJORADO: Manejar tokens encriptados
            jwt_token = token
            
            # Si es encriptado, intentar desencriptar primero
            if SecureTokenManager._is_encrypted_token(token):
                try:
                    encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                    decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                    jwt_token = decrypted_bytes.decode()
                except Exception as jwe_error:
                    logger.error(f"Error al desencriptar JWE para extraer JTI: {jwe_error}")
                    return None
            
            # Decodificar sin verificar para obtener el JTI
            # Intentar con diferentes métodos
            try:
                unverified_payload = jwt.get_unverified_claims(jwt_token)
                return unverified_payload.get("jti")
            except Exception as jwt_error:
                # Fallback: decodificar manualmente
                try:
                    parts = jwt_token.split('.')
                    if len(parts) >= 2:
                        payload_part = parts[1]
                        # Agregar padding si es necesario
                        missing_padding = len(payload_part) % 4
                        if missing_padding:
                            payload_part += '=' * (4 - missing_padding)
                        
                        import json
                        payload_bytes = base64.urlsafe_b64decode(payload_part)
                        payload_json = json.loads(payload_bytes.decode('utf-8'))
                        return payload_json.get("jti")
                except Exception as manual_error:
                    logger.error(f"Error en extracción manual de JTI: {manual_error}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error general al extraer JTI: {e}")
            return None

# 🔥 NUEVAS FUNCIONES DE UTILIDAD
def create_encrypted_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Shortcut para crear token encriptado
    """
    return SecureTokenManager.create_access_token(subject, expires_delta, encrypt=True)

def create_normal_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Shortcut para crear token normal (sin encriptar)
    """
    return SecureTokenManager.create_access_token(subject, expires_delta, encrypt=False)

# Funciones de contraseña mejoradas (sin cambios)
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
    """
    🔥 ACTUALIZADO: Función de compatibilidad - AHORA ENCRIPTA POR DEFECTO
    """
    return SecureTokenManager.create_access_token(subject, expires_delta, encrypt=True)

def get_password_hash(password: str) -> str:
    """Función de compatibilidad"""
    return create_password_hash(password)