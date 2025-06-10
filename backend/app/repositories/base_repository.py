# app/repositories/base_repository.py
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

# Usar tu Base personalizada
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

logger = logging.getLogger(__name__)

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType], db: Session):
        """
        Repositorio base con métodos CRUD para cualquier modelo
        
        **Parámetros:**
        * `model`: Un modelo SQLAlchemy
        * `db`: Una sesión de base de datos SQLAlchemy
        """
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[ModelType]:
        """Obtener un registro por ID"""
        try:
            return self.db.query(self.model).filter(self.model.id == id).first()
        except SQLAlchemyError as e:
            logger.error(f"Error obteniendo registro por ID {id}: {e}")
            return None

    def get_multi(
        self, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Obtener múltiples registros con paginación"""
        try:
            return self.db.query(self.model).offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Error obteniendo múltiples registros: {e}")
            return []

    def get_by_field(self, field_name: str, value: Any) -> Optional[ModelType]:
        """Obtener un registro por un campo específico"""
        try:
            field = getattr(self.model, field_name)
            return self.db.query(self.model).filter(field == value).first()
        except (SQLAlchemyError, AttributeError) as e:
            logger.error(f"Error obteniendo registro por {field_name}={value}: {e}")
            return None

    def get_multi_by_field(
        self, field_name: str, value: Any, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Obtener múltiples registros por un campo específico"""
        try:
            field = getattr(self.model, field_name)
            return self.db.query(self.model).filter(field == value).offset(skip).limit(limit).all()
        except (SQLAlchemyError, AttributeError) as e:
            logger.error(f"Error obteniendo múltiples registros por {field_name}={value}: {e}")
            return []

    def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        """Crear un nuevo registro"""
        try:
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = self.model(**obj_in_data)  # type: ignore
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creando registro: {e}")
            raise

    def update(
        self,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Actualizar un registro existente"""
        try:
            obj_data = jsonable_encoder(db_obj)
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.dict(exclude_unset=True)
            
            for field in obj_data:
                if field in update_data:
                    setattr(db_obj, field, update_data[field])
            
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error actualizando registro: {e}")
            raise

    def remove(self, *, id: int) -> bool:
        """Eliminar un registro por ID"""
        try:
            obj = self.db.query(self.model).get(id)
            if obj:
                self.db.delete(obj)
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error eliminando registro {id}: {e}")
            return False

    def soft_delete(self, *, id: int) -> bool:
        """Soft delete - marcar como eliminado sin borrar físicamente"""
        try:
            obj = self.db.query(self.model).get(id)
            if obj and hasattr(obj, 'is_active'):
                obj.is_active = False
                self.db.commit()
                return True
            elif obj and hasattr(obj, 'deleted_at'):
                from datetime import datetime
                obj.deleted_at = datetime.utcnow()
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error en soft delete {id}: {e}")
            return False

    def count(self) -> int:
        """Contar total de registros"""
        try:
            return self.db.query(self.model).count()
        except SQLAlchemyError as e:
            logger.error(f"Error contando registros: {e}")
            return 0

    def exists(self, *, id: int) -> bool:
        """Verificar si existe un registro por ID"""
        try:
            return self.db.query(self.model).filter(self.model.id == id).first() is not None
        except SQLAlchemyError as e:
            logger.error(f"Error verificando existencia {id}: {e}")
            return False

    def exists_by_field(self, field_name: str, value: Any) -> bool:
        """Verificar si existe un registro por campo específico"""
        try:
            field = getattr(self.model, field_name)
            return self.db.query(self.model).filter(field == value).first() is not None
        except (SQLAlchemyError, AttributeError) as e:
            logger.error(f"Error verificando existencia por {field_name}={value}: {e}")
            return False

    def get_active(self, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Obtener registros activos (si el modelo tiene campo is_active)"""
        try:
            if hasattr(self.model, 'is_active'):
                return self.db.query(self.model).filter(
                    self.model.is_active == True
                ).offset(skip).limit(limit).all()
            else:
                return self.get_multi(skip=skip, limit=limit)
        except SQLAlchemyError as e:
            logger.error(f"Error obteniendo registros activos: {e}")
            return []

    def search(
        self, 
        *, 
        query: str, 
        fields: List[str], 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """Búsqueda en múltiples campos"""
        try:
            search_term = f"%{query}%"
            filters = []
            
            for field_name in fields:
                if hasattr(self.model, field_name):
                    field = getattr(self.model, field_name)
                    filters.append(field.ilike(search_term))
            
            if not filters:
                return []
            
            from sqlalchemy import or_
            return self.db.query(self.model).filter(
                or_(*filters)
            ).offset(skip).limit(limit).all()
            
        except SQLAlchemyError as e:
            logger.error(f"Error en búsqueda: {e}")
            return []

    def bulk_create(self, *, objs_in: List[CreateSchemaType]) -> List[ModelType]:
        """Crear múltiples registros"""
        try:
            db_objs = []
            for obj_in in objs_in:
                obj_in_data = jsonable_encoder(obj_in)
                db_obj = self.model(**obj_in_data)
                db_objs.append(db_obj)
            
            self.db.add_all(db_objs)
            self.db.commit()
            
            for db_obj in db_objs:
                self.db.refresh(db_obj)
            
            return db_objs
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error en creación masiva: {e}")
            raise

    def bulk_update(
        self, 
        *, 
        updates: List[Dict[str, Any]]
    ) -> int:
        """Actualización masiva"""
        try:
            count = 0
            for update_data in updates:
                if 'id' not in update_data:
                    continue
                
                obj_id = update_data.pop('id')
                result = self.db.query(self.model).filter(
                    self.model.id == obj_id
                ).update(update_data)
                count += result
            
            self.db.commit()
            return count
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error en actualización masiva: {e}")
            return 0

    def get_or_create(
        self, 
        *, 
        defaults: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> tuple[ModelType, bool]:
        """Obtener o crear registro"""
        try:
            # Buscar existente
            instance = self.db.query(self.model).filter_by(**kwargs).first()
            
            if instance:
                return instance, False
            else:
                # Crear nuevo
                params = kwargs.copy()
                if defaults:
                    params.update(defaults)
                
                instance = self.model(**params)
                self.db.add(instance)
                self.db.commit()
                self.db.refresh(instance)
                return instance, True
                
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error en get_or_create: {e}")
            raise