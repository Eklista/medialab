from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.organization.departments import Department


class DepartmentRepository:
    """
    Repositorio para operaciones de acceso a datos de departamentos
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
        """
        Obtiene todos los departamentos con paginación
        """
        return db.query(Department).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, department_id: int) -> Optional[Department]:
        """
        Obtiene un departamento por su ID
        """
        return db.query(Department).filter(Department.id == department_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Department]:
        """
        Obtiene un departamento por su nombre
        """
        return db.query(Department).filter(Department.name == name).first()
    
    @staticmethod
    def get_by_abbreviation(db: Session, abbreviation: str) -> Optional[Department]:
        """
        Obtiene un departamento por su abreviatura
        """
        return db.query(Department).filter(Department.abbreviation == abbreviation).first()
    
    @staticmethod
    def get_by_type(db: Session, type_value: str) -> List[Department]:
        """
        Obtiene todos los departamentos de un tipo específico
        """
        return db.query(Department).filter(Department.type == type_value).all()
    
    @staticmethod
    def create(db: Session, department_data: dict) -> Department:
        """
        Crea un nuevo departamento en la base de datos
        """
        db_department = Department(**department_data)
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        return db_department
    
    @staticmethod
    def update(db: Session, department: Department, department_data: dict) -> Department:
        """
        Actualiza un departamento existente
        """
        for field, value in department_data.items():
            setattr(department, field, value)
        
        db.commit()
        db.refresh(department)
        return department
    
    @staticmethod
    def delete(db: Session, department: Department) -> Department:
        """
        Elimina un departamento
        """
        db.delete(department)
        db.commit()
        return department