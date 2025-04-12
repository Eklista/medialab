from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from jose import jwt
from fastapi import HTTPException, status

from app.models.auth.users import User
from app.config.settings import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.config.security import verify_password, get_password_hash

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Autentica un usuario con email y contraseña
    """
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(password, user.password_hash):
        return None
    
    return user

def create_tokens(user_id: int) -> dict:
    """
    Crea tokens de acceso y refresco
    """
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Crear token de acceso
    access_token = create_token(
        data={"sub": str(user_id)},
        expires_delta=access_token_expires
    )
    
    # Crear token de refresco
    refresh_token = create_token(
        data={"sub": str(user_id), "refresh": True},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
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

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Obtiene un usuario por su email
    """
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """
    Obtiene un usuario por su ID
    """
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_data: dict) -> User:
    """
    Crea un nuevo usuario
    """
    # Verificar si el email ya existe
    if get_user_by_email(db, user_data["email"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )
    
    # Hashear la contraseña
    hashed_password = get_password_hash(user_data["password"])
    
    # Crear el objeto de usuario (sin la contraseña en texto plano)
    db_user = User(
        email=user_data["email"],
        username=user_data["username"],
        password_hash=hashed_password,
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
        phone=user_data.get("phone"),
        birth_date=user_data.get("birth_date"),
        join_date=user_data["join_date"],
        is_active=user_data.get("is_active", True)
    )
    
    # Guardar en la BD
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user_login(db: Session, user: User) -> None:
    """
    Actualiza los campos de último acceso y estado online
    """
    user.last_login = datetime.utcnow()
    user.is_online = True
    db.commit()