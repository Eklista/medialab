# app/models/requests/associations.py
from sqlalchemy import Column, Integer, ForeignKey, Table, UniqueConstraint, Index

from app.models.base import Base

# Tabla de asociación para requests y servicios principales
request_services = Table(
    'request_services',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('request_id', Integer, ForeignKey('requests.id'), nullable=False),
    Column('service_id', Integer, ForeignKey('services.id'), nullable=False),
    UniqueConstraint('request_id', 'service_id', name='uix_request_service'),
    Index('idx_request_services_request', 'request_id'),
    Index('idx_request_services_service', 'service_id')
)

# Tabla de asociación para requests y subservicios
request_sub_services = Table(
    'request_sub_services',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('request_id', Integer, ForeignKey('requests.id'), nullable=False),
    Column('sub_service_id', Integer, ForeignKey('sub_services.id'), nullable=False),
    Column('main_service_id', Integer, ForeignKey('services.id'), nullable=True),  # Para referencia al servicio principal
    UniqueConstraint('request_id', 'sub_service_id', name='uix_request_subservice'),
    Index('idx_request_sub_services_request', 'request_id'),
    Index('idx_request_sub_services_subservice', 'sub_service_id'),
    Index('idx_request_sub_services_mainservice', 'main_service_id')
)