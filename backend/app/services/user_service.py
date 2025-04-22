from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.models.auth.users import User
from app.schemas.auth.users import UserCreate, UserUpdate
from app.config.security import get_password_hash, verify_password


class UserService:
    """
    Servicio para gestionar lógica de negocio relacionada con usuarios
    """
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Obtiene lista de usuarios
        """
        return UserRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """
        Obtiene usuario por ID, lanza excepción si no existe
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    @staticmethod
    def get_user_with_roles(db: Session, user_id: int) -> User:
        """
        Obtiene usuario con roles cargados, lanza excepción si no existe
        """
        user = UserRepository.get_with_roles(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    @staticmethod
    def create_user(db: Session, user_data: Dict[str, Any]) -> User:
        """
        Crea un nuevo usuario
        """
        # Verificar si el email ya existe
        if UserRepository.get_by_email(db, user_data["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )
        
        # Verificar si el username ya existe
        if UserRepository.get_by_username(db, user_data["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )
        
        # Hashear la contraseña
        if "password" in user_data:
            user_data["password_hash"] = get_password_hash(user_data["password"])
            del user_data["password"]
        
        # Si no se especifica fecha de ingreso, usar fecha actual
        if "join_date" not in user_data:
            user_data["join_date"] = date.today()
        
        # Si no se especifica estado activo, establecer como activo
        if "is_active" not in user_data:
            user_data["is_active"] = True
        
        return UserRepository.create(db, user_data)
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: Dict[str, Any]) -> User:
        """
        Actualiza un usuario existente
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Si se actualiza el email, verificar que no exista
        if "email" in user_data and user_data["email"] != user.email:
            existing_user = UserRepository.get_by_email(db, user_data["email"])
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya está registrado"
                )
        
        # Si se actualiza el username, verificar que no exista
        if "username" in user_data and user_data["username"] != user.username:
            existing_user = UserRepository.get_by_username(db, user_data["username"])
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de usuario ya está registrado"
                )
        
        return UserRepository.update(db, user, user_data)
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> User:
        """
        Elimina un usuario
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserRepository.delete(db, user)
    
    @staticmethod
    def assign_role(db: Session, user_id: int, role_id: int, area_id: int) -> bool:
        """
        Asigna un rol a un usuario
        """
        # Verificar que el usuario existe
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserRepository.assign_role(db, user_id, role_id, area_id)
    
    @staticmethod
    def verify_password(db: Session, user_id: int, password: str) -> bool:
        """
        Verifica la contraseña de un usuario
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            return False
        
        return verify_password(password, user.password_hash)
    
    @staticmethod
    def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> bool:
        """
        Cambia la contraseña de un usuario, verificando la contraseña actual
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual incorrecta"
            )
        
        user.password_hash = get_password_hash(new_password)
        db.commit()
        
        return True