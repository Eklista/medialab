# backend/app/controllers/organization/department_controller.py
"""
Controlador para operaciones de departamentos
Mueve la lógica de los endpoints sin cambiar el comportamiento
"""

from typing import List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

from app.services.organization.department_service import DepartmentService
from app.schemas.organization.departments import (
    DepartmentCreate, DepartmentUpdate, DepartmentInDB, DepartmentWithType
)
from app.utils.error_handler import ErrorHandler

logger = logging.getLogger(__name__)

class DepartmentController:
    """
    Controlador para departamentos - mantiene la misma lógica que los endpoints
    """
    
    @staticmethod
    def get_departments_list(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        type_id: Optional[int] = None,
        current_user = None
    ) -> List[DepartmentWithType]:
        """
        Obtiene lista de departamentos, opcionalmente filtrados por tipo
        """
        try:
            if type_id:
                departments = DepartmentService.get_departments_by_type(
                    db=db, type_id=type_id, skip=skip, limit=limit
                )
            else:
                departments = DepartmentService.get_departments_with_type(
                    db=db, skip=skip, limit=limit
                )
            return departments
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "departamentos")
    
    @staticmethod
    def create_department(db: Session, department_in: DepartmentCreate, current_user) -> DepartmentInDB:
        """
        Crea un nuevo departamento
        """
        try:
            department = DepartmentService.create_department(
                db=db, 
                department_data=department_in.dict()
            )
            return department
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "crear", "departamento")
    
    @staticmethod
    def get_department_by_id(db: Session, department_id: int, current_user) -> DepartmentWithType:
        """
        Obtiene un departamento específico con su tipo
        """
        try:
            department = DepartmentService.get_department_by_id_with_type(
                db=db, 
                department_id=department_id
            )
            return department
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "departamento")
    
    @staticmethod
    def update_department(
        db: Session, 
        department_id: int, 
        department_in: DepartmentUpdate, 
        current_user
    ) -> DepartmentInDB:
        """
        Actualiza un departamento existente
        """
        try:
            department = DepartmentService.update_department(
                db=db,
                department_id=department_id,
                department_data=department_in.dict(exclude_unset=True)
            )
            return department
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "actualizar", "departamento")
    
    @staticmethod
    def delete_department(db: Session, department_id: int, current_user) -> DepartmentInDB:
        """
        Elimina un departamento
        """
        try:
            department = DepartmentService.delete_department(
                db=db, 
                department_id=department_id
            )
            return department
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "eliminar", "departamento")