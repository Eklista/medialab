# app/services/department_type_service.py
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.department_type_repository import DepartmentTypeRepository
from app.models.organization.departments import DepartmentType

class DepartmentTypeService:
    """
    Servicio para gestionar lógica de negocio relacionada con tipos de departamentos
    """
    
    @staticmethod
    def get_department_types(db: Session, skip: int = 0, limit: int = 100) -> List[DepartmentType]:
        """
        Obtiene lista de tipos de departamentos
        """
        return DepartmentTypeRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_department_type_by_id(db: Session, type_id: int) -> DepartmentType:
        """
        Obtiene tipo de departamento por ID, lanza excepción si no existe
        """
        dept_type = DepartmentTypeRepository.get_by_id(db, type_id)
        if not dept_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de departamento no encontrado"
            )
        return dept_type
    
    @staticmethod
    def create_department_type(db: Session, type_data: Dict[str, Any]) -> DepartmentType:
        """
        Crea un nuevo tipo de departamento
        """
        # Verificar si el nombre ya existe
        existing_type = DepartmentTypeRepository.get_by_name(db, type_data["name"])
        if existing_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del tipo de departamento ya está registrado"
            )
        
        return DepartmentTypeRepository.create(db, type_data)
    
    @staticmethod
    def update_department_type(db: Session, type_id: int, type_data: Dict[str, Any]) -> DepartmentType:
        """
        Actualiza un tipo de departamento existente
        """
        dept_type = DepartmentTypeRepository.get_by_id(db, type_id)
        if not dept_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de departamento no encontrado"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in type_data and type_data["name"] != dept_type.name:
            existing_type = DepartmentTypeRepository.get_by_name(db, type_data["name"])
            if existing_type and existing_type.id != dept_type.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del tipo de departamento ya está registrado"
                )
        
        return DepartmentTypeRepository.update(db, dept_type, type_data)
    
    @staticmethod
    def delete_department_type(db: Session, type_id: int) -> DepartmentType:
        """
        Elimina un tipo de departamento
        """
        dept_type = DepartmentTypeRepository.get_by_id(db, type_id)
        if not dept_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de departamento no encontrado"
            )
        
        # Verificar si hay departamentos asociados a este tipo
        if dept_type.departments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar el tipo de departamento porque tiene departamentos asociados"
            )
        
        return DepartmentTypeRepository.delete(db, dept_type)