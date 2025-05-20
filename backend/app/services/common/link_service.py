# app/services/common/link_service.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.communications.links import Link
from app.models.base import Base

class LinkService:
    """
    Servicio para gestionar enlaces asociados a entidades
    """
    
    @staticmethod
    def get_entity_links(db: Session, entity: Any, entity_type: str = None) -> List[Link]:
        """
        Obtiene los enlaces asociados a una entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad
            entity_type: Tipo de entidad. Si no se proporciona, se deriva del nombre de la tabla
                                     
        Returns:
            List[Link]: Lista de enlaces
            
        Raises:
            ValueError: Si no se proporciona una sesión válida
        """
        if not db:
            raise ValueError("Se requiere una sesión activa")
            
        if not entity_type:
            entity_type = entity.__tablename__
            if entity_type.endswith('s'):
                entity_type = entity_type[:-1]
                
        return db.query(Link).filter(
            Link.entity_type == entity_type,
            Link.entity_id == entity.id
        ).all()
    
    @staticmethod
    def get_all_related_links(db: Session, entity: Any, related_attributes: List[str]) -> List[Link]:
        """
        Obtiene todos los enlaces asociados a una entidad y sus entidades relacionadas
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad principal
            related_attributes: Lista de nombres de atributos de relaciones a incluir
            
        Returns:
            List[Link]: Lista combinada de enlaces
        """
        if not db:
            raise ValueError("Se requiere una sesión activa")
        
        entity_type = entity.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        # Enlaces directos de la entidad principal
        result = db.query(Link).filter(
            Link.entity_type == entity_type,
            Link.entity_id == entity.id
        ).all()
        
        # Enlaces de entidades relacionadas
        for attr_name in related_attributes:
            related_items = getattr(entity, attr_name, None)
            if related_items:
                # Si no es una lista, convertirlo en lista
                if not isinstance(related_items, list):
                    related_items = [related_items]
                
                for related_item in related_items:
                    related_type = related_item.__tablename__
                    if related_type.endswith('s'):
                        related_type = related_type[:-1]
                    
                    related_links = db.query(Link).filter(
                        Link.entity_type == related_type,
                        Link.entity_id == related_item.id
                    ).all()
                    
                    result.extend(related_links)
        
        return result
    
    @staticmethod
    def add_link(db: Session, entity: Any, url: str, platform_id: int = None, 
               title: str = None, description: str = None, created_by: int = None) -> Link:
        """
        Añade un enlace a una entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad
            url: URL del enlace
            platform_id: ID de la plataforma (opcional)
            title: Título del enlace (opcional)
            description: Descripción del enlace (opcional)
            created_by: ID del usuario que crea el enlace (opcional)
            
        Returns:
            Link: Instancia del enlace creado
        """
        if not db:
            raise ValueError("Se requiere una sesión activa")
        
        entity_type = entity.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        link = Link(
            url=url,
            title=title,
            description=description,
            platform_id=platform_id,
            entity_id=entity.id,
            entity_type=entity_type,
            created_by=created_by
        )
        
        db.add(link)
        db.commit()
        db.refresh(link)
        
        return link
    
    @staticmethod
    def delete_link(db: Session, link_id: int) -> bool:
        """
        Elimina un enlace
        
        Args:
            db: Sesión SQLAlchemy
            link_id: ID del enlace a eliminar
            
        Returns:
            bool: True si se eliminó correctamente, False si no se encontró
        """
        link = db.query(Link).filter(Link.id == link_id).first()
        if not link:
            return False
            
        db.delete(link)
        db.commit()
        return True