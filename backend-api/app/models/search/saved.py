"""
Modelo para búsquedas guardadas.
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class SortDirection(Enum):
    """Dirección de ordenamiento."""
    ASC = "ASC"
    DESC = "DESC"


class SavedSearch(BaseModel):
    """
    Modelo para búsquedas guardadas por los usuarios.
    """
    __tablename__ = "saved_searches"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    search_query = Column(String(500), nullable=False)
    filters = Column(JSON, nullable=True)
    entity_types = Column(JSON, nullable=True)
    sort_by = Column(String(100), nullable=True)
    sort_direction = Column(SQLEnum(SortDirection), default=SortDirection.DESC, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones    user = relationship("User", back_populates="saved_searches")
    
    def __repr__(self):
        return f"<SavedSearch(id={self.id}, name='{self.name}', user_id='{self.user_id}')>"
