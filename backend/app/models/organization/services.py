from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base

class Service(Base):
    """
    Modelo para servicios ofrecidos por el MediaLab
    """
    __tablename__ = 'services'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(50), nullable=True)
    
    # Relaciones
    sub_services = relationship("SubService", back_populates="service", cascade="all, delete-orphan")


class SubService(Base):
    """
    Modelo para sub-servicios o servicios específicos dentro de una categoría
    """
    __tablename__ = 'sub_services'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=False)
    
    # Relaciones
    service = relationship("Service", back_populates="sub_services")