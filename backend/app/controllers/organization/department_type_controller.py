# backend/app/controllers/organization/department_type_controller.py
"""
Controlador para tipos de departamento
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

from app.services.organization.department_type_service import DepartmentTypeService
from app.schemas.organization.departments import (
    DepartmentTypeCreate, DepartmentTypeUpdate, DepartmentTypeInDB
)
from app.utils.error_handler import ErrorHandler

logger = logging.getLogger(__name__)

class DepartmentTypeController:
    """
    Controlador para tipos de departamento
    """
    
    @staticmethod
    def get_department_types_list(db: Session, skip: int = 0, limit: int = 100, current_user = None) -> List[DepartmentTypeInDB]:
        """
        Obtiene lista de tipos de departamentos
        """
        try:
            department_types = DepartmentTypeService.get_department_types(db=db, skip=skip, limit=limit)
            return department_types
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "tipos de departamentos")
    
    @staticmethod
    def create_department_type(db: Session, type_in: DepartmentTypeCreate, current_user) -> DepartmentTypeInDB:
        """
        Crea un nuevo tipo de departamento
        """
        try:
            department_type = DepartmentTypeService.create_department_type(
                db=db, 
                type_data=type_in.dict()
            )
            return department_type
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "crear", "tipo de departamento")
    
    @staticmethod
    def get_department_type_by_id(db: Session, type_id: int, current_user) -> DepartmentTypeInDB:
        """
        Obtiene un tipo de departamento por ID
        """
        try:
            department_type = DepartmentTypeService.get_department_type_by_id(
                db=db, 
                type_id=type_id
            )
            return department_type
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "tipo de departamento")
    
    @staticmethod
    def update_department_type(
        db: Session, 
        type_id: int, 
        type_in: DepartmentTypeUpdate, 
        current_user
    ) -> DepartmentTypeInDB:
        """
        Actualiza un tipo de departamento
        """
        try:
            department_type = DepartmentTypeService.update_department_type(
                db=db,
                type_id=type_id,
                type_data=type_in.dict(exclude_unset=True)
            )
            return department_type
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "actualizar", "tipo de departamento")
    
    @staticmethod
    def delete_department_type(db: Session, type_id: int, current_user) -> DepartmentTypeInDB:
        """
        Elimina un tipo de departamento
        """
        try:
            department_type = DepartmentTypeService.delete_department_type(
                db=db, 
                type_id=type_id
            )
            return department_type
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "eliminar", "tipo de departamento")