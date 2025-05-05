# app/services/department_service.py
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.department_repository import DepartmentRepository
from app.repositories.department_type_repository import DepartmentTypeRepository
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
    def get_departments_with_type(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
        """
        Obtiene lista de departamentos con sus tipos cargados
        """
        return DepartmentRepository.get_with_type(db, skip, limit)
    
    @staticmethod
    def get_departments_by_type(db: Session, type_id: int, skip: int = 0, limit: int = 100) -> List[Department]:
        """
        Obtiene lista de departamentos por tipo
        """
        return DepartmentRepository.get_by_type_id(db, type_id, skip, limit)
    
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
    def get_department_by_id_with_type(db: Session, department_id: int) -> Department:
        """
        Obtiene departamento por ID con su tipo cargado, lanza excepción si no existe
        """
        department = DepartmentRepository.get_by_id_with_type(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departamento no encontrado"
            )
        return department
    
    @staticmethod
    def create_department(db: Session, department_data: Dict[str, Any]) -> Department:
        """
        Crea un nuevo departamento
        """
        # Verificar si el nombre ya existe
        existing_department = DepartmentRepository.get_by_name(db, department_data["name"])
        if existing_department:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del departamento ya está registrado"
            )
        
        # Verificar si la abreviación ya existe
        existing_department = DepartmentRepository.get_by_abbreviation(db, department_data["abbreviation"])
        if existing_department:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La abreviación del departamento ya está registrada"
            )
        
        # Verificar si el tipo de departamento existe
        dept_type = DepartmentTypeRepository.get_by_id(db, department_data["type_id"])
        if not dept_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de departamento no encontrado"
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
            existing_department = DepartmentRepository.get_by_name(db, department_data["name"])
            if existing_department and existing_department.id != department.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del departamento ya está registrado"
                )
        
        # Si se actualiza la abreviación, verificar que no exista
        if "abbreviation" in department_data and department_data["abbreviation"] != department.abbreviation:
            existing_department = DepartmentRepository.get_by_abbreviation(db, department_data["abbreviation"])
            if existing_department and existing_department.id != department.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La abreviación del departamento ya está registrada"
                )
        
        # Si se actualiza el tipo, verificar que exista
        if "type_id" in department_data:
            dept_type = DepartmentTypeRepository.get_by_id(db, department_data["type_id"])
            if not dept_type:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tipo de departamento no encontrado"
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