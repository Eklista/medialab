from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.role_repository import RoleRepository
from app.models.auth.roles import Role


class RoleService:
    """
    Servicio para gestionar lógica de negocio relacionada con roles
    """
    
    @staticmethod
    def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        """
        Obtiene lista de roles
        """
        return RoleRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_role_by_id(db: Session, role_id: int) -> Role:
        """
        Obtiene rol por ID, lanza excepción si no existe
        """
        role = RoleRepository.get_by_id(db, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        return role
    
    @staticmethod
    def get_role_by_name(db: Session, name: str) -> Role:
        """
        Obtiene rol por nombre, lanza excepción si no existe
        """
        role = RoleRepository.get_by_name(db, name)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        return role
    
    @staticmethod
    def get_role_with_permissions(db: Session, role_id: int) -> Role:
        """
        Obtiene rol con permisos cargados, lanza excepción si no existe
        """
        role = RoleRepository.get_with_permissions(db, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        return role
    
    @staticmethod
    def create_role(db: Session, role_data: Dict[str, Any]) -> Role:
        """
        Crea un nuevo rol
        """
        # Verificar si el nombre ya existe
        existing_role = RoleRepository.get_by_name(db, role_data["name"])
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del rol ya está registrado"
            )
        
        return RoleRepository.create(db, role_data)
    
    @staticmethod
    def update_role(db: Session, role_id: int, role_data: Dict[str, Any]) -> Role:
        """
        Actualiza un rol existente
        """
        role = RoleRepository.get_by_id(db, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in role_data and role_data["name"] != role.name:
            existing_role = RoleRepository.get_by_name(db, role_data["name"])
            if existing_role and existing_role.id != role.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del rol ya está registrado"
                )
        
        return RoleRepository.update(db, role, role_data)
    
    @staticmethod
    def delete_role(db: Session, role_id: int) -> Role:
        """
        Elimina un rol
        """
        role = RoleRepository.get_by_id(db, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        
        return RoleRepository.delete(db, role)
    
    @staticmethod
    def assign_permissions(db: Session, role_id: int, permission_ids: List[int]) -> bool:
        """
        Asigna permisos a un rol
        """
        role = RoleRepository.get_by_id(db, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        
        return RoleRepository.assign_permissions(db, role_id, permission_ids)