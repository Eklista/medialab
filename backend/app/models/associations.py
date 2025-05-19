from sqlalchemy import Column, Integer, ForeignKey, Table, DateTime, UniqueConstraint, Index
from datetime import datetime

from app.models.base import Base

# Tabla de asociación para usuarios y roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('user_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('role_id', Integer, ForeignKey('roles.id'), nullable=False),
    Column('area_id', Integer, ForeignKey('areas.id'), nullable=False),
    Column('assigned_at', DateTime, default=datetime.utcnow, nullable=False),
    UniqueConstraint('user_id', 'role_id', 'area_id', name='uix_user_role_area'),
    Index('idx_user_roles_user', 'user_id'),
    Index('idx_user_roles_role', 'role_id'),
    Index('idx_user_roles_area', 'area_id')
)

# Tabla de asociación para roles y permisos
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True),
    Index('idx_role_permissions_role', 'role_id'),
    Index('idx_role_permissions_permission', 'permission_id')
)