from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.auth.roles import Role
from app.models.auth.permissions import Permission


class RoleRepository:
    """
    Repositorio para operaciones de acceso a datos de roles
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        """
        Obtiene todos los roles con paginación
        """
        return db.query(Role).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, role_id: int) -> Optional[Role]:
        """
        Obtiene un rol por su ID
        """
        return db.query(Role).filter(Role.id == role_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Role]:
        """
        Obtiene un rol por su nombre
        """
        return db.query(Role).filter(Role.name == name).first()
    
    @staticmethod
    def get_with_permissions(db: Session, role_id: int) -> Optional[Role]:
        """
        Obtiene un rol con sus permisos cargados (eager loading)
        """
        return db.query(Role).options(joinedload(Role.permissions)).filter(Role.id == role_id).first()
    
    @staticmethod
    def create(db: Session, role_data: dict) -> Role:
        """
        Crea un nuevo rol en la base de datos
        """
        db_role = Role(**role_data)
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role
    
    @staticmethod
    def update(db: Session, role: Role, role_data: dict) -> Role:
        """
        Actualiza un rol existente
        """
        for field, value in role_data.items():
            # Si el campo es 'permissions', tratarlo de forma especial
            if field == 'permissions' and isinstance(value, list):
                # Asumimos que value es una lista de IDs de permisos
                permissions = db.query(Permission).filter(Permission.id.in_(value)).all()
                role.permissions = permissions
            else:
                setattr(role, field, value)
        
        db.commit()
        db.refresh(role)
        return role
    
    @staticmethod
    def delete(db: Session, role: Role) -> Role:
        """
        Elimina un rol
        """
        db.delete(role)
        db.commit()
        return role
    
    @staticmethod
    def assign_permissions(db: Session, role_id: int, permission_ids: List[int]) -> bool:
        """
        Asigna permisos a un rol
        """
        try:
            role = db.query(Role).filter(Role.id == role_id).first()
            if not role:
                return False
            
            permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
            role.permissions = permissions
            
            db.commit()
            return True
        except SQLAlchemyError:
            db.rollback()
            return False