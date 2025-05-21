# app/models/common/metadata.py
from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship, validates
import sqlalchemy as sa

from app.models.base import Base

class Priority(Base):
    """
    Prioridades para elementos del sistema (alta, media, baja, crítica)
    """
    __tablename__ = 'priorities'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=False)
    order = Column(Integer, default=0) 

    # Relacion para tareas, proyectos, etc.
    work_items = relationship("WorkItem", back_populates="priority")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_priority_order', 'order'),
    )
    
    def __repr__(self):
        return f"<Priority(name='{self.name}', order={self.order})>"


class Tag(Base):
    """
    Etiquetas reutilizables para clasificar elementos
    """
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(20), nullable=False, default="#E5E7EB")
    description = Column(Text, nullable=True)
    
    # Relaciones
    assignments = relationship("TagAssignment", back_populates="tag", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tag(name='{self.name}')>"


class TagAssignment(Base):
    """
    Asignación de etiquetas a cualquier entidad
    """
    __tablename__ = 'tag_assignments'
    
    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey('tags.id'), nullable=False)
    
    # Entidad a la que se asigna la etiqueta
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)
    
    # Índices y restricciones
    __table_args__ = (
        UniqueConstraint('tag_id', 'entity_id', 'entity_type', name='uix_tag_entity'),
        sa.Index('idx_tag_assignment_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_tag_assignment_tag', 'tag_id')
    )
    
    # Relación
    tag = relationship("Tag", back_populates="assignments")
    
    def __repr__(self):
        return f"<TagAssignment(tag_id={self.tag_id}, entity_type='{self.entity_type}', entity_id={self.entity_id})>"


class ActivityType(Base):
    """
    Tipos de actividades en el sistema (edición, grabación, etc.)
    """
    __tablename__ = 'activity_types'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=False, default="#E5E7EB")
    
    # Campos para organización y UI
    category = Column(String(50), nullable=True)  # Para agrupar tipos relacionados
    icon = Column(String(50), nullable=True)
    
    # Índices
    __table_args__ = (
        sa.Index('idx_activity_type_category', 'category'),
    )
    
    def __repr__(self):
        return f"<ActivityType(name='{self.name}')>"