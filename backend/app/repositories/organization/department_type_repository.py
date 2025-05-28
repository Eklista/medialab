# app/repositories/department_type_repository.py
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.organization.departments import DepartmentType

class DepartmentTypeRepository:
    """
    Repositorio para operaciones de acceso a datos de tipos de departamentos
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[DepartmentType]:
        """
        Obtiene todos los tipos de departamentos con paginación
        """
        return db.query(DepartmentType).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, type_id: int) -> Optional[DepartmentType]:
        """
        Obtiene un tipo de departamento por su ID
        """
        return db.query(DepartmentType).filter(DepartmentType.id == type_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[DepartmentType]:
        """
        Obtiene un tipo de departamento por su nombre
        """
        return db.query(DepartmentType).filter(DepartmentType.name == name).first()
    
    @staticmethod
    def create(db: Session, type_data: dict) -> DepartmentType:
        """
        Crea un nuevo tipo de departamento en la base de datos
        """
        db_type = DepartmentType(**type_data)
        db.add(db_type)
        db.commit()
        db.refresh(db_type)
        return db_type
    
    @staticmethod
    def update(db: Session, dept_type: DepartmentType, type_data: dict) -> DepartmentType:
        """
        Actualiza un tipo de departamento existente
        """
        for field, value in type_data.items():
            setattr(dept_type, field, value)
        
        db.commit()
        db.refresh(dept_type)
        return dept_type
    
    @staticmethod
    def delete(db: Session, dept_type: DepartmentType) -> DepartmentType:
        """
        Elimina un tipo de departamento
        """
        db.delete(dept_type)
        db.commit()
        return dept_type