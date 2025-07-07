"""
Enums para inventario
"""

import enum


class InventoryItemStatus(enum.Enum):
    """Estados de items de inventario"""
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    DAMAGED = "damaged"
    LOST = "lost"
    RETIRED = "retired"
