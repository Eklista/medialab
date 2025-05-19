# app/models/base.py
from typing import Any
from datetime import datetime
from sqlalchemy import Column, DateTime, MetaData
from sqlalchemy.ext.declarative import as_declarative, declared_attr

# Convención de nombres para las tablas y columnas
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Crea la metadata con la convención de nombres
metadata = MetaData(naming_convention=naming_convention)

@as_declarative(metadata=metadata)  # Aquí está el cambio: pasamos el objeto metadata
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