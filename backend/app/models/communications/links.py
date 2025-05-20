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