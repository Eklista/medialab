from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config.settings import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.config.security import verify_password, get_password_hash
from app.repositories.user_repository import UserRepository
from app.models.auth.users import User
from app.schemas.auth.token import TokenPayload


class AuthService:
    """
    Servicio para gestionar la autenticación y tokens
    """
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Autentica un usuario con email y contraseña
        """
        user = UserRepository.get_by_email(db, email)
        
        if not user or not verify_password(password, user.password_hash):
            return None
        
        return user
    
    @staticmethod
    def create_tokens(user_id: int) -> Dict[str, str]:
        """
        Crea tokens de acceso y refresco
        """
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Crear token de acceso
        access_token = AuthService.create_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        
        # Crear token de refresco
        refresh_token = AuthService.create_token(
            data={"sub": str(user_id), "refresh": True},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def create_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crea un token JWT
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return encoded_jwt
    
    @staticmethod
    def update_user_login(db: Session, user: User) -> None:
        """
        Actualiza los campos de último acceso y estado online
        """
        UserRepository.update_last_login(db, user)
    
    @staticmethod
    def verify_token(token: str) -> TokenPayload:
        """
        Verifica y decodifica un token JWT
        """
        try:
            payload = jwt.decode(
                token, SECRET_KEY, algorithms=[ALGORITHM]
            )
            token_data = TokenPayload(**payload)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return token_data
    
    @staticmethod
    def generate_password_reset_code(db: Session, email: str, reset_code: str, expires_at: datetime) -> Optional[Dict[str, Any]]:
        """
        Genera un código para restablecer contraseña
        """
        user = UserRepository.get_by_email(db, email)
        
        # Siempre responder positivamente para evitar enumeración de usuarios
        if not user or not user.is_active:
            return None
        
        # Guardar código en BD
        user_data = {
            "reset_token": reset_code,  # Usamos el campo reset_token para guardar el código
            "reset_token_expires": expires_at
        }
        
        UserRepository.update(db, user, user_data)
        
        return {
            "email": user.email,
            "reset_code": reset_code,
            "user_data": {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }
    
    @staticmethod
    def verify_reset_code(db: Session, email: str, code: str) -> bool:
        """
        Verifica si un código de recuperación es válido y no ha expirado
        """
        user = UserRepository.get_by_email(db, email)
        
        if not user or not user.is_active:
            return False
        
        # Verificar que el código coincida y no haya expirado
        if (user.reset_token != code or 
            not user.reset_token_expires or 
            user.reset_token_expires < datetime.utcnow()):
            return False
        
        return True
    
    @staticmethod
    def reset_password_with_code(db: Session, email: str, code: str, new_password: str) -> bool:
        """
        Restablece la contraseña mediante código de verificación
        """
        # Verificar que el código sea válido
        if not AuthService.verify_reset_code(db, email, code):
            return False
        
        user = UserRepository.get_by_email(db, email)
        
        # Actualizar contraseña
        user_data = {
            "password_hash": get_password_hash(new_password),
            "reset_token": None,
            "reset_token_expires": None
        }
        
        UserRepository.update(db, user, user_data)
        
        return True
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """
        Restablece la contraseña mediante token
        (Método mantenido para compatibilidad con versiones anteriores)
        """
        # Buscar usuario con este token
        user = db.query(User).filter(User.reset_token == token).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de recuperación inválido"
            )
        
        # Verificar que el token no haya expirado
        if not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de recuperación expirado"
            )
        
        # Actualizar contraseña
        user_data = {
            "password_hash": get_password_hash(new_password),
            "reset_token": None,
            "reset_token_expires": None
        }
        
        UserRepository.update(db, user, user_data)
        
        return True