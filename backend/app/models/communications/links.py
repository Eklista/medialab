# app/models/communications/links.py
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Link(Base):
    """
    Enlaces a contenidos en plataformas externas
    """
    __tablename__ = 'links'
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(512), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Plataforma relacionada
    platform_id = Column(Integer, ForeignKey('platforms.id'), nullable=True)
    
    # Entidad relacionada (polimórfica)
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Índices
    __table_args__ = (
        Index('idx_links_entity', 'entity_type', 'entity_id'),
        Index('idx_links_platform', 'platform_id')
    )
    
    # Relaciones
    platform = relationship("Platform")
    
    def __repr__(self):
        return f"<Link(url='{self.url}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"
    
    @classmethod
    def create_for_entity(cls, session, entity, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Crea un nuevo enlace para una entidad específica
        
        Args:
            session: Sesión SQLAlchemy
            entity: Instancia de la entidad (Task, Project, etc.)
            url: URL del enlace
            platform_id: ID de la plataforma (opcional)
            title: Título del enlace (opcional)
            description: Descripción del enlace (opcional)
            created_by: ID del usuario que crea el enlace (opcional)
            
        Returns:
            Link: Instancia del enlace creado
        """
        entity_type = entity.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]  # Convertir plural a singular (tasks -> task)
        
        link = cls(
            url=url,
            title=title,
            description=description,
            platform_id=platform_id,
            entity_id=entity.id,
            entity_type=entity_type,
            created_by=created_by
        )
        
        session.add(link)
        return link

    # Métodos de clase para obtener enlaces
    @classmethod
    def get_for_task(cls, session, task_id):
        """
        Obtiene todos los enlaces asociados a una tarea específica
        
        Args:
            session: Sesión SQLAlchemy
            task_id: ID de la tarea
            
        Returns:
            list: Lista de enlaces asociados a la tarea
        """
        return session.query(cls).filter(
            cls.entity_type == 'task',
            cls.entity_id == task_id
        ).all()
    
    @classmethod
    def get_for_entity(cls, session, entity):
        """
        Obtiene todos los enlaces para una entidad específica
        
        Args:
            session: Sesión SQLAlchemy
            entity: Instancia de la entidad (Task, Project, etc.)
            
        Returns:
            list: Lista de enlaces asociados a la entidad
        """
        entity_type = entity.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        return session.query(cls).filter(
            cls.entity_type == entity_type,
            cls.entity_id == entity.id
        ).all()
    
    def get_platform_name(self):
        """
        Obtiene el nombre de la plataforma asociada
        
        Returns:
            str: Nombre de la plataforma o 'Desconocida' si no hay plataforma
        """
        if self.platform:
            return self.platform.name
        return "Desconocida"