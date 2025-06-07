# ==========================================
# app/models/inventory/equipment.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
from app.models.base import Base

class Equipment(Base):
    """
    Inventario general de equipos
    """
    __tablename__ = 'equipment'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Clasificación
    category_id = Column(Integer, ForeignKey('inventory_categories.id'), nullable=False)
    
    # Identificación
    codigo_ug = Column(String(100), nullable=True)
    numero_serie = Column(String(255), nullable=True)
    service_tag = Column(String(255), nullable=True)
    
    # Especificaciones
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    
    # Estado y ubicación
    state_id = Column(Integer, ForeignKey('equipment_states.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('inventory_locations.id'), nullable=False)
    
    # Asignación
    assigned_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Proveedor
    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=True)
    
    # Fechas y documentación
    fecha_entrega = Column(DateTime, nullable=True)
    numero_hoja_envio = Column(String(100), nullable=True)
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    category = relationship("InventoryCategory", back_populates="equipment")
    state = relationship("EquipmentState", back_populates="equipment")
    location = relationship("InventoryLocation", back_populates="equipment")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    supplier = relationship("Supplier", back_populates="equipment")
    
    # Relación con detalles de laboratorio
    lab_details = relationship("EquipmentLab", back_populates="equipment", uselist=False)
    
    # Índices
    __table_args__ = (
        sa.Index('idx_equipment_category', 'category_id'),
        sa.Index('idx_equipment_state', 'state_id'),
        sa.Index('idx_equipment_location', 'location_id'),
        sa.Index('idx_equipment_assigned_user', 'assigned_user_id'),
        sa.Index('idx_equipment_supplier', 'supplier_id'),
        sa.Index('idx_equipment_codigo_ug', 'codigo_ug'),
        sa.Index('idx_equipment_service_tag', 'service_tag')
    )
    
    def __repr__(self):
        return f"<Equipment(id={self.id}, codigo_ug='{self.codigo_ug}', marca='{self.marca}')>"


class EquipmentLab(Base):
    """
    Detalles específicos para equipos de laboratorio (principalmente PCs)
    """
    __tablename__ = 'equipment_lab'
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey('equipment.id'), nullable=False, unique=True)
    
    # Detalles técnicos específicos
    numero_pc = Column(String(50), nullable=True)
    procesador = Column(String(255), nullable=True)
    memoria_ram = Column(String(100), nullable=True)
    capacidad_hdd = Column(String(100), nullable=True)
    
    # Monitor asociado
    monitor_serie = Column(String(255), nullable=True)
    monitor_codigo_ug = Column(String(100), nullable=True)
    
    # Flujo SEGA → laboratorio → medialab
    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=True)
    fecha_recepcion_sega = Column(DateTime, nullable=True)
    fecha_entrega_medialab = Column(DateTime, nullable=True)
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="lab_details")
    supplier = relationship("Supplier", back_populates="equipment_lab")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_equipment_lab_equipment', 'equipment_id'),
        sa.Index('idx_equipment_lab_supplier', 'supplier_id'),
        sa.Index('idx_equipment_lab_numero_pc', 'numero_pc')
    )
    
    def __repr__(self):
        return f"<EquipmentLab(equipment_id={self.equipment_id}, numero_pc='{self.numero_pc}')>"
