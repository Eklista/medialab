# app/services/common/metadata_service.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.common.metadata import Tag, Priority, ActivityType
from app.models.base import Base

class MetadataService:
    """
    Servicio para manejar metadatos como etiquetas, prioridades, etc.
    """
    
    @staticmethod
    def get_entity_tags(db: Session, entity: Base, entity_type: str = None) -> List[Tag]:
        """
        Obtiene todas las etiquetas asociadas a una entidad
        """
        if not entity_type:
            entity_type = entity.__tablename__
            if entity_type.endswith('s'):
                entity_type = entity_type[:-1]
                
        from app.models.common.metadata import TagAssignment
        
        # Obtener asignaciones
        assignments = db.query(TagAssignment).filter(
            TagAssignment.entity_type == entity_type,
            TagAssignment.entity_id == entity.id
        ).all()
        
        # Obtener etiquetas a partir de asignaciones
        tag_ids = [assignment.tag_id for assignment in assignments]
        return db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
    
    @staticmethod
    def add_tag_to_entity(db: Session, entity: Base, tag_id: int) -> bool:
        """
        Añade una etiqueta a una entidad
        """
        # Implementar lógica para añadir etiqueta
        pass