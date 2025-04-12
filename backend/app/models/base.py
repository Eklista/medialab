from typing import Any
from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    """
    Clase base para todos los modelos SQLAlchemy
    """
    id: Any
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @declared_attr
    def __tablename__(cls) -> str:
        """
        Genera el nombre de la tabla automáticamente
        """
        return cls.__name__.lower()