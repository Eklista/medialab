# app/services/common/entity_service.py
from typing import List, Dict, Any, Type
from sqlalchemy.orm import Session

from app.models.base import Base

class EntityService:
    """
    Servicio genérico para operaciones comunes a todas las entidades
    """
    
    @staticmethod
    def get_related_entities(db: Session, entity: Base, relation_name: str) -> List[Base]:
        """
        Obtiene entidades relacionadas por nombre de relación
        """
        if hasattr(entity, relation_name):
            related = getattr(entity, relation_name)
            if isinstance(related, list):
                return related
            elif related is not None:
                return [related]
        return []
    
    @staticmethod
    def is_valid_entity(db: Session, model_class: Type[Base], entity_id: int) -> bool:
        """
        Verifica si existe una entidad con el ID dado
        """
        return db.query(model_class).filter(model_class.id == entity_id).first() is not None