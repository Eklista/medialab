# ============================================================================
# backend/app/utils/inventory_formatters.py
# ============================================================================

from typing import List, Dict, Any, Optional
from datetime import datetime

class InventoryFormatter:
    """
    Formateador para entidades de inventario
    """
    
    # ===== EQUIPMENT FORMATTING =====
    
    @staticmethod
    def format_equipment_list(equipment_list: List, format_type: str = "list") -> List[Dict[str, Any]]:
        """
        Formatea lista de equipos según el tipo requerido
        """
        if format_type == "minimal":
            return [InventoryFormatter._format_equipment_minimal(eq) for eq in equipment_list]
        elif format_type == "search":
            return [InventoryFormatter._format_equipment_search(eq) for eq in equipment_list]
        elif format_type == "dropdown":
            return [InventoryFormatter._format_equipment_dropdown(eq) for eq in equipment_list]
        else:  # "list" por defecto
            return [InventoryFormatter._format_equipment_list_item(eq) for eq in equipment_list]
    
    @staticmethod
    def format_equipment_details(equipment) -> Dict[str, Any]:
        """
        Formatea equipo con detalles completos
        """
        if not equipment:
            return None
        
        formatted = {
            "id": equipment.id,
            "codigo_ug": equipment.codigo_ug,
            "numero_serie": equipment.numero_serie,
            "service_tag": equipment.service_tag,
            "marca": equipment.marca,
            "modelo": equipment.modelo,
            "descripcion": equipment.descripcion,
            "observaciones": equipment.observaciones,
            "numero_hoja_envio": equipment.numero_hoja_envio,
            "fecha_entrega": equipment.fecha_entrega.isoformat() if equipment.fecha_entrega else None,
            "created_at": equipment.created_at.isoformat(),
            "updated_at": equipment.updated_at.isoformat(),
            
            # Relaciones
            "category": InventoryFormatter._format_category(equipment.category) if equipment.category else None,
            "state": InventoryFormatter._format_equipment_state(equipment.state) if equipment.state else None,
            "location": InventoryFormatter._format_location(equipment.location) if equipment.location else None,
            "supplier": InventoryFormatter._format_supplier(equipment.supplier) if equipment.supplier else None,
            "assigned_user": InventoryFormatter._format_assigned_user(equipment.assigned_user) if equipment.assigned_user else None,
            
            # Detalles de laboratorio si existen
            "lab_details": InventoryFormatter._format_lab_details(equipment.lab_details) if hasattr(equipment, 'lab_details') and equipment.lab_details else None,
            
            # Información calculada
            "display": {
                "title": f"{equipment.marca} {equipment.modelo}".strip() or "Sin especificar",
                "subtitle": equipment.codigo_ug or equipment.numero_serie or f"ID-{equipment.id}",
                "status_badge": equipment.state.name if equipment.state else "Sin estado",
                "status_color": equipment.state.color if equipment.state else "#6B7280",
                "location_badge": equipment.location.name if equipment.location else "Sin ubicación",
                "assignment_status": "Asignado" if equipment.assigned_user_id else "Disponible",
                "assignment_color": "#10B981" if equipment.assigned_user_id else "#6B7280"
            }
        }
        
        return formatted
    
    @staticmethod
    def _format_equipment_minimal(equipment) -> Dict[str, Any]:
        """
        Formato mínimo para listas grandes
        """
        return {
            "id": equipment.id,
            "codigo_ug": equipment.codigo_ug,
            "title": f"{equipment.marca} {equipment.modelo}".strip(),
            "state": equipment.state.name if equipment.state else None,
            "state_color": equipment.state.color if equipment.state else "#6B7280"
        }
    
    @staticmethod
    def _format_equipment_list_item(equipment) -> Dict[str, Any]:
        """
        Formato para listado estándar
        """
        return {
            "id": equipment.id,
            "codigo_ug": equipment.codigo_ug,
            "numero_serie": equipment.numero_serie,
            "marca": equipment.marca,
            "modelo": equipment.modelo,
            "descripcion": equipment.descripcion,
            
            # Información de estado
            "state": {
                "id": equipment.state.id if equipment.state else None,
                "name": equipment.state.name if equipment.state else "Sin estado",
                "color": equipment.state.color if equipment.state else "#6B7280",
                "is_operational": equipment.state.is_operational if equipment.state else False
            },
            
            # Información de categoría
            "category": {
                "id": equipment.category.id if equipment.category else None,
                "name": equipment.category.name if equipment.category else "Sin categoría"
            },
            
            # Información de ubicación
            "location": {
                "id": equipment.location.id if equipment.location else None,
                "name": equipment.location.name if equipment.location else "Sin ubicación",
                "is_external": equipment.location.is_external if equipment.location else False
            },
            
            # Usuario asignado
            "assigned_user": InventoryFormatter._format_assigned_user(equipment.assigned_user) if equipment.assigned_user else None,
            
            # Display helpers
            "display": {
                "title": f"{equipment.marca} {equipment.modelo}".strip() or "Sin especificar",
                "subtitle": equipment.codigo_ug or f"ID-{equipment.id}",
                "status_badge": equipment.state.name if equipment.state else "Sin estado",
                "assignment_status": "Asignado" if equipment.assigned_user_id else "Disponible"
            }
        }
    
    @staticmethod
    def _format_equipment_search(equipment) -> Dict[str, Any]:
        """
        Formato optimizado para resultados de búsqueda
        """
        return {
            "id": equipment.id,
            "type": "equipment",
            "codigo_ug": equipment.codigo_ug,
            "title": f"{equipment.marca} {equipment.modelo}".strip(),
            "subtitle": equipment.codigo_ug or equipment.numero_serie,
            "description": equipment.descripcion,
            "category": equipment.category.name if equipment.category else None,
            "state": {
                "name": equipment.state.name if equipment.state else "Sin estado",
                "color": equipment.state.color if equipment.state else "#6B7280",
                "is_operational": equipment.state.is_operational if equipment.state else False
            },
            "location": equipment.location.name if equipment.location else None,
            "assigned": equipment.assigned_user_id is not None,
            "match_score": 1.0  # Podría calcularse basado en relevancia
        }
    
    @staticmethod
    def _format_equipment_dropdown(equipment) -> Dict[str, Any]:
        """
        Formato para dropdowns/selectores
        """
        return {
            "id": equipment.id,
            "label": f"{equipment.codigo_ug} - {equipment.marca} {equipment.modelo}".strip(),
            "value": equipment.id,
            "disabled": not (equipment.state.is_operational if equipment.state else False),
            "meta": {
                "state": equipment.state.name if equipment.state else None,
                "location": equipment.location.name if equipment.location else None
            }
        }
    
    # ===== SUPPLIES FORMATTING =====
    
    @staticmethod
    def format_supplies_list(supplies_list: List, format_type: str = "list") -> List[Dict[str, Any]]:
        """
        Formatea lista de suministros
        """
        if format_type == "search":
            return [InventoryFormatter._format_supply_search(supply) for supply in supplies_list]
        else:  # "list" por defecto
            return [InventoryFormatter._format_supply_list_item(supply) for supply in supplies_list]
    
    @staticmethod
    def _format_supply_list_item(supply) -> Dict[str, Any]:
        """
        Formato para listado de suministros
        """
        # Determinar estado del stock
        if supply.stock_actual == 0:
            stock_status = "out"
            stock_color = "#EF4444"
        elif supply.stock_actual <= supply.stock_minimo * 0.5:
            stock_status = "critical"
            stock_color = "#F59E0B"
        elif supply.stock_actual <= supply.stock_minimo:
            stock_status = "low" 
            stock_color = "#F97316"
        else:
            stock_status = "ok"
            stock_color = "#10B981"
        
        return {
            "id": supply.id,
            "codigo": supply.codigo,
            "nombre_producto": supply.nombre_producto,
            "presentacion": supply.presentacion,
            "descripcion": supply.descripcion,
            "stock_actual": supply.stock_actual,
            "stock_minimo": supply.stock_minimo,
            "stock_status": stock_status,
            "stock_color": stock_color,
            
            # Información de categoría
            "category": {
                "id": supply.category.id if supply.category else None,
                "name": supply.category.name if supply.category else "Sin categoría"
            },
            
            # Información de ubicación
            "location": {
                "id": supply.location.id if supply.location else None,
                "name": supply.location.name if supply.location else "Sin ubicación"
            },
            
            # Display helpers
            "display": {
                "title": supply.nombre_producto,
                "subtitle": supply.codigo or f"ID-{supply.id}",
                "stock_badge": f"{supply.stock_actual} / {supply.stock_minimo}",
                "stock_percentage": min(100, (supply.stock_actual / supply.stock_minimo * 100)) if supply.stock_minimo > 0 else 100
            }
        }
    
    @staticmethod
    def _format_supply_search(supply) -> Dict[str, Any]:
        """
        Formato para resultados de búsqueda de suministros
        """
        return {
            "id": supply.id,
            "type": "supply",
            "codigo": supply.codigo,
            "title": supply.nombre_producto,
            "subtitle": supply.codigo or supply.presentacion,
            "description": supply.presentacion,
            "category": supply.category.name if supply.category else None,
            "stock": supply.stock_actual,
            "stock_status": "low" if supply.stock_actual <= supply.stock_minimo else "ok"
        }
    
    @staticmethod
    def format_supply_movement(movement) -> Dict[str, Any]:
        """
        Formatea movimiento de suministro
        """
        if not movement:
            return None
        
        return {
            "id": movement.id,
            "cantidad": movement.cantidad,
            "numero_envio": movement.numero_envio,
            "observaciones": movement.observaciones,
            "fecha_movimiento": movement.fecha_movimiento.isoformat(),
            "created_at": movement.created_at.isoformat(),
            
            # Tipo de movimiento
            "movement_type": {
                "id": movement.movement_type.id if movement.movement_type else None,
                "name": movement.movement_type.name if movement.movement_type else "Sin tipo",
                "affects_stock": movement.movement_type.affects_stock if movement.movement_type else 0
            },
            
            # Usuarios involucrados
            "user_receives": InventoryFormatter._format_assigned_user(movement.user_receives) if movement.user_receives else None,
            "user_delivers_to": InventoryFormatter._format_assigned_user(movement.user_delivers_to) if movement.user_delivers_to else None,
            
            # Display helpers
            "display": {
                "title": f"{movement.movement_type.name if movement.movement_type else 'Movimiento'}: {movement.cantidad}",
                "subtitle": movement.numero_envio or movement.fecha_movimiento.strftime("%d/%m/%Y %H:%M"),
                "type_badge": movement.movement_type.name if movement.movement_type else "Sin tipo",
                "amount_display": f"+{movement.cantidad}" if (movement.movement_type.affects_stock if movement.movement_type else 0) > 0 else f"-{movement.cantidad}"
            }
        }
    
    # ===== HELPER FORMATTERS =====
    
    @staticmethod
    def _format_category(category) -> Dict[str, Any]:
        """
        Formatea categoría
        """
        if not category:
            return None
        
        return {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "is_equipment": category.is_equipment
        }
    
    @staticmethod
    def _format_location(location) -> Dict[str, Any]:
        """
        Formatea ubicación
        """
        if not location:
            return None
        
        return {
            "id": location.id,
            "name": location.name,
            "description": location.description,
            "is_external": location.is_external
        }
    
    @staticmethod
    def _format_equipment_state(state) -> Dict[str, Any]:
        """
        Formatea estado de equipo
        """
        if not state:
            return None
        
        return {
            "id": state.id,
            "name": state.name,
            "description": state.description,
            "color": state.color,
            "is_operational": state.is_operational
        }
    
    @staticmethod
    def _format_supplier(supplier) -> Dict[str, Any]:
        """
        Formatea proveedor
        """
        if not supplier:
            return None
        
        return {
            "id": supplier.id,
            "name": supplier.name,
            "contact_person": supplier.contact_person,
            "phone": supplier.phone,
            "email": supplier.email
        }
    
    @staticmethod
    def _format_assigned_user(user) -> Dict[str, Any]:
        """
        Formatea usuario asignado
        """
        if not user:
            return None
        
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            full_name = user.email.split('@')[0] if hasattr(user, 'email') and user.email else f"Usuario {user.id}"
        
        initials = ""
        if first_name and last_name:
            initials = f"{first_name[0]}{last_name[0]}".upper()
        elif first_name:
            initials = first_name[0].upper()
        elif hasattr(user, 'email') and user.email:
            initials = user.email[0].upper()
        else:
            initials = "U"
        
        return {
            "id": user.id,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "email": getattr(user, 'email', None),
            "initials": initials,
            "profile_image": getattr(user, 'profile_image', None)
        }
    
    @staticmethod
    def _format_lab_details(lab_details) -> Dict[str, Any]:
        """
        Formatea detalles de laboratorio
        """
        if not lab_details:
            return None
        
        return {
            "id": lab_details.id,
            "numero_pc": lab_details.numero_pc,
            "procesador": lab_details.procesador,
            "memoria_ram": lab_details.memoria_ram,
            "capacidad_hdd": lab_details.capacidad_hdd,
            "monitor_serie": lab_details.monitor_serie,
            "monitor_codigo_ug": lab_details.monitor_codigo_ug,
            "fecha_recepcion_sega": lab_details.fecha_recepcion_sega.isoformat() if lab_details.fecha_recepcion_sega else None,
            "fecha_entrega_medialab": lab_details.fecha_entrega_medialab.isoformat() if lab_details.fecha_entrega_medialab else None,
            "supplier": InventoryFormatter._format_supplier(lab_details.supplier) if lab_details.supplier else None
        }