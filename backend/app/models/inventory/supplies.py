# ==========================================
# app/models/inventory/supplies.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
from app.models.base import Base

class Supply(Base):
    """
    Suministros/productos de proveeduría (stock)
    """
    __tablename__ = 'supplies'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Clasificación
    category_id = Column(Integer, ForeignKey('inventory_categories.id'), nullable=False)
    
    # Identificación
    codigo = Column(String(100), unique=True, nullable=True)
    nombre_producto = Column(String(255), nullable=False)
    presentacion = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    
    # Stock
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=0)
    
    # Ubicación principal
    location_id = Column(Integer, ForeignKey('inventory_locations.id'), nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True)
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    category = relationship("InventoryCategory", back_populates="supplies")
    location = relationship("InventoryLocation", back_populates="supplies")
    movements = relationship("SupplyMovement", back_populates="supply")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_supply_category', 'category_id'),
        sa.Index('idx_supply_location', 'location_id'),
        sa.Index('idx_supply_codigo', 'codigo'),
        sa.Index('idx_supply_stock_minimo', 'stock_minimo'),
        sa.Index('idx_supply_active', 'is_active')
    )
    
    def __repr__(self):
        return f"<Supply(codigo='{self.codigo}', nombre='{self.nombre_producto}')>"


class SupplyMovement(Base):
    """
    Movimientos de suministros (entradas/salidas)
    """
    __tablename__ = 'supply_movements'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Producto y tipo de movimiento
    supply_id = Column(Integer, ForeignKey('supplies.id'), nullable=False)
    movement_type_id = Column(Integer, ForeignKey('movement_types.id'), nullable=False)
    
    # Cantidad
    cantidad = Column(Integer, nullable=False)
    
    # Documentación
    numero_envio = Column(String(100), nullable=True)
    fecha_movimiento = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Personal involucrado
    user_receives_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Para entradas
    user_delivers_to_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Para salidas
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    supply = relationship("Supply", back_populates="movements")
    movement_type = relationship("MovementType", back_populates="movements")
    user_receives = relationship("User", foreign_keys=[user_receives_id])
    user_delivers_to = relationship("User", foreign_keys=[user_delivers_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    # Índices
    __table_args__ = (
        sa.Index('idx_supply_movement_supply', 'supply_id'),
        sa.Index('idx_supply_movement_type', 'movement_type_id'),
        sa.Index('idx_supply_movement_date', 'fecha_movimiento'),
        sa.Index('idx_supply_movement_receives', 'user_receives_id'),
        sa.Index('idx_supply_movement_delivers', 'user_delivers_to_id')
    )
    
    def __repr__(self):
        return f"<SupplyMovement(supply_id={self.supply_id}, cantidad={self.cantidad})>"
