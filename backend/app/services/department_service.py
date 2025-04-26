from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.department_repository import DepartmentRepository
from app.models.organization.departments import Department


class DepartmentService:
    """
    Servicio para gestionar lógica de negocio relacionada con departamentos
    """
    
    @staticmethod
    def get_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
        """
        Obtiene lista de departamentos
        """
        return DepartmentRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_department_by_id(db: Session, department_id: int) -> Department:
        """
        Obtiene departamento por ID, lanza excepción si no existe
        """
        department = DepartmentRepository.get_by_id(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departamento no encontrado"
            )
        return department
    
    @staticmethod
    def get_department_by_name(db: Session, name: str) -> Department:
        """
        Obtiene departamento por nombre, lanza excepción si no existe
        """
        department = DepartmentRepository.get_by_name(db, name)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departamento no encontrado"
            )
        return department
    
    @staticmethod
    def get_departments_by_type(db: Session, type_value: str) -> List[Department]:
        """
        Obtiene departamentos por tipo
        """
        return DepartmentRepository.get_by_type(db, type_value)
    
    @staticmethod
    def create_department(db: Session, department_data: Dict[str, Any]) -> Department:
        """
        Crea un nuevo departamento
        """
        # Verificar si el nombre ya existe
        existing_name = DepartmentRepository.get_by_name(db, department_data["name"])
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un departamento con este nombre"
            )
        
        # Verificar si la abreviatura ya existe
        existing_abbr = DepartmentRepository.get_by_abbreviation(db, department_data["abbreviation"])
        if existing_abbr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un departamento con esta abreviatura"
            )
        
        return DepartmentRepository.create(db, department_data)
    
    @staticmethod
    def update_department(db: Session, department_id: int, department_data: Dict[str, Any]) -> Department:
        """
        Actualiza un departamento existente
        """
        department = DepartmentRepository.get_by_id(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departamento no encontrado"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in department_data and department_data["name"] != department.name:
            existing_name = DepartmentRepository.get_by_name(db, department_data["name"])
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un departamento con este nombre"
                )
        
        # Si se actualiza la abreviatura, verificar que no exista
        if "abbreviation" in department_data and department_data["abbreviation"] != department.abbreviation:
            existing_abbr = DepartmentRepository.get_by_abbreviation(db, department_data["abbreviation"])
            if existing_abbr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un departamento con esta abreviatura"
                )
        
        return DepartmentRepository.update(db, department, department_data)
    
    @staticmethod
    def delete_department(db: Session, department_id: int) -> Department:
        """
        Elimina un departamento
        """
        department = DepartmentRepository.get_by_id(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departamento no encontrado"
            )
        
        return DepartmentRepository.delete(db, department)