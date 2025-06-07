# ============================================================================
# backend/app/utils/inventory_validators.py
# ============================================================================

from typing import Dict, Any, List
from fastapi import HTTPException, status

class InventoryValidator:
    """
    Validadores para operaciones de inventario
    """
    
    @staticmethod
    def validate_equipment_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida datos de equipo
        """
        errors = []
        
        # Validar campos requeridos según el contexto
        if data.get("category_id") and data["category_id"] <= 0:
            errors.append("category_id debe ser un número positivo")
        
        if data.get("state_id") and data["state_id"] <= 0:
            errors.append("state_id debe ser un número positivo")
        
        if data.get("location_id") and data["location_id"] <= 0:
            errors.append("location_id debe ser un número positivo")
        
        # Validar longitudes de campos
        if data.get("codigo_ug") and len(data["codigo_ug"]) > 100:
            errors.append("codigo_ug no puede exceder 100 caracteres")
        
        if data.get("numero_serie") and len(data["numero_serie"]) > 255:
            errors.append("numero_serie no puede exceder 255 caracteres")
        
        if data.get("marca") and len(data["marca"]) > 100:
            errors.append("marca no puede exceder 100 caracteres")
        
        if data.get("modelo") and len(data["modelo"]) > 100:
            errors.append("modelo no puede exceder 100 caracteres")
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": errors, "message": "Datos de equipo inválidos"}
            )
        
        return data
    
    @staticmethod
    def validate_supply_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida datos de suministro
        """
        errors = []
        
        # Validar campos requeridos
        if not data.get("nombre_producto") or not data["nombre_producto"].strip():
            errors.append("nombre_producto es requerido")
        
        if data.get("category_id") and data["category_id"] <= 0:
            errors.append("category_id debe ser un número positivo")
        
        # Validar stocks
        if data.get("stock_actual") is not None and data["stock_actual"] < 0:
            errors.append("stock_actual no puede ser negativo")
        
        if data.get("stock_minimo") is not None and data["stock_minimo"] < 0:
            errors.append("stock_minimo no puede ser negativo")
        
        # Validar longitudes
        if data.get("nombre_producto") and len(data["nombre_producto"]) > 255:
            errors.append("nombre_producto no puede exceder 255 caracteres")
        
        if data.get("codigo") and len(data["codigo"]) > 100:
            errors.append("codigo no puede exceder 100 caracteres")
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": errors, "message": "Datos de suministro inválidos"}
            )
        
        return data
    
    @staticmethod
    def validate_movement_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida datos de movimiento de suministro
        """
        errors = []
        
        # Validar cantidad
        if not data.get("cantidad") or data["cantidad"] <= 0:
            errors.append("cantidad debe ser mayor a 0")
        
        if data.get("supply_id") and data["supply_id"] <= 0:
            errors.append("supply_id debe ser un número positivo")
        
        if data.get("movement_type_id") and data["movement_type_id"] <= 0:
            errors.append("movement_type_id debe ser un número positivo")
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": errors, "message": "Datos de movimiento inválidos"}
            )
        
        return data
    
    @staticmethod
    def validate_search_params(params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida parámetros de búsqueda
        """
        errors = []
        
        # Validar query de búsqueda
        if params.get("search_query") and len(params["search_query"]) < 2:
            errors.append("La búsqueda debe tener al menos 2 caracteres")
        
        # Validar límites
        if params.get("limit"):
            if params["limit"] <= 0:
                errors.append("limit debe ser mayor a 0")
            elif params["limit"] > 100:
                errors.append("limit no puede exceder 100")
        
        # Validar cursor
        if params.get("cursor") and params["cursor"] < 0:
            errors.append("cursor no puede ser negativo")
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": errors, "message": "Parámetros de búsqueda inválidos"}
            )
        
        return params