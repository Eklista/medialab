from sqlalchemy import Column, Integer, ForeignKey, Table, DateTime
from datetime import datetime

from app.models.base import Base

# Tabla de asociación para usuarios y roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('area_id', Integer, ForeignKey('areas.id'), primary_key=True),
    Column('assigned_at', DateTime, default=datetime.utcnow, nullable=False)
)

# Tabla de asociación para roles y permisos
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)