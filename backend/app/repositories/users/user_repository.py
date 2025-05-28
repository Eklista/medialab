from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.auth.users import User
from app.models.associations import user_roles
from app.schemas.users.users import UserCreate


class UserRepository:
    """
    Repositorio para operaciones de acceso a datos de usuarios
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Obtiene todos los usuarios con paginación
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """
        Obtiene un usuario por su ID
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """
        Obtiene un usuario por su email
        """
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """
        Obtiene un usuario por su nombre de usuario
        """
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_with_roles(db: Session, user_id: int) -> Optional[User]:
        """
        Obtiene un usuario con sus roles cargados (eager loading)
        """
        return db.query(User).options(joinedload(User.roles)).filter(User.id == user_id).first()
    
    @staticmethod
    def create(db: Session, user_data: dict) -> User:
        """
        Crea un nuevo usuario en la base de datos
        """
        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update(db: Session, user: User, user_data: dict) -> User:
        """
        Actualiza un usuario existente
        """
        for field, value in user_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete(db: Session, user: User) -> User:
        """
        Elimina un usuario
        """
        db.delete(user)
        db.commit()
        return user
    
    @staticmethod
    def update_last_login(db: Session, user: User) -> None:
        """
        Actualiza el último acceso del usuario
        """
        from datetime import datetime
        user.last_login = datetime.utcnow()
        user.is_online = True
        db.commit()
    
    @staticmethod
    def assign_role(db: Session, user_id: int, role_id: int, area_id: int) -> bool:
        """
        Asigna un rol a un usuario
        """
        from datetime import datetime
        from sqlalchemy import text, insert
        
        try:
            # Eliminar roles anteriores si existen
            db.execute(
                text("DELETE FROM user_roles WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            
            # Insertar nuevo rol
            db.execute(
                insert(user_roles).values(
                    user_id=user_id,
                    role_id=role_id,
                    area_id=area_id,
                    assigned_at=datetime.utcnow()
                )
            )
            
            db.commit()
            return True
        except SQLAlchemyError:
            db.rollback()
            return False