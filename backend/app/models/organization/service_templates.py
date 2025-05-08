# app/models/organization/service_templates.py
from sqlalchemy import Column, String, Integer, Text, Table, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base

# Tabla de relación muchos a muchos entre plantillas y servicios
template_services = Table(
    'template_services',
    Base.metadata,
    Column('template_id', Integer, ForeignKey('service_templates.id'), primary_key=True),
    Column('service_id', Integer, ForeignKey('services.id'), primary_key=True)
)

template_subservices = Table(
    'template_subservices',
    Base.metadata,
    Column('template_id', Integer, ForeignKey('service_templates.id'), primary_key=True),
    Column('subservice_id', Integer, ForeignKey('sub_services.id'), primary_key=True)
)

class ServiceTemplate(Base):
    """
    Modelo para plantillas de servicios
    """
    __tablename__ = 'service_templates'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False) 
    
    # Relación con servicios
    services = relationship("Service", secondary=template_services, backref="templates")

    # Relación con subservicios
    subservices = relationship("SubService", secondary=template_subservices, backref="templates")