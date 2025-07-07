"""
Modelo para índices de búsqueda.
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON, TSVECTOR

from ..base import BaseModel
from enum import Enum


class EntityType(Enum):
    """Tipos de entidad indexados."""
    PROJECT = "PROJECT"
    TASK = "TASK"
    USER = "USER"
    REQUEST = "REQUEST"
    EQUIPMENT = "EQUIPMENT"
    EVENT = "EVENT"
    NOTIFICATION = "NOTIFICATION"


class SearchIndex(BaseModel):
    """
    Modelo para índices de búsqueda del sistema.
    """
    __tablename__ = "search_indexes"
    
    entity_type = Column(SQLEnum(EntityType), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    search_vector = Column(TSVECTOR, nullable=True)
    indexed_at = Column(DateTime(timezone=True), nullable=False)
    
    def __repr__(self):
        return f"<SearchIndex(id={self.id}, entity_type='{self.entity_type.value}', title='{self.title[:50]}')>"
