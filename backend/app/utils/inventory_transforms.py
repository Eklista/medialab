# ============================================================================
# backend/app/utils/inventory_transforms.py
# ============================================================================

from typing import Dict, Any, List, Optional
from datetime import datetime

class InventoryTransforms:
    """
    Transformaciones y conversiones para datos de inventario
    """
    
    @staticmethod
    def equipment_to_export_format(equipment_list: List) -> List[Dict[str, Any]]:
        """
        Transforma equipos a formato de exportación (Excel/CSV)
        """
        export_data = []
        
        for equipment in equipment_list:
            export_row = {
                "ID": equipment.id,
                "Código UG": equipment.codigo_ug or "",
                "Número de Serie": equipment.numero_serie or "",
                "Service Tag": equipment.service_tag or "",
                "Marca": equipment.marca or "",
                "Modelo": equipment.modelo or "",
                "Descripción": equipment.descripcion or "",
                "Categoría": equipment.category.name if equipment.category else "",
                "Estado": equipment.state.name if equipment.state else "",
                "Ubicación": equipment.location.name if equipment.location else "",
                "Usuario Asignado": InventoryTransforms._get_user_full_name(equipment.assigned_user) if equipment.assigned_user else "",
                "Proveedor": equipment.supplier.name if equipment.supplier else "",
                "Fecha de Entrega": equipment.fecha_entrega.strftime("%d/%m/%Y") if equipment.fecha_entrega else "",
                "Número de Hoja": equipment.numero_hoja_envio or "",
                "Observaciones": equipment.observaciones or "",
                "Fecha de Creación": equipment.created_at.strftime("%d/%m/%Y %H:%M")
            }
            
            # Agregar detalles de laboratorio si existen
            if hasattr(equipment, 'lab_details') and equipment.lab_details:
                lab = equipment.lab_details
                export_row.update({
                    "Número PC": lab.numero_pc or "",
                    "Procesador": lab.procesador or "",
                    "Memoria RAM": lab.memoria_ram or "",
                    "Capacidad HDD": lab.capacidad_hdd or "",
                    "Monitor Serie": lab.monitor_serie or "",
                    "Monitor Código": lab.monitor_codigo_ug or ""
                })
            
            export_data.append(export_row)
        
        return export_data
    
    @staticmethod
    def supplies_to_export_format(supplies_list: List) -> List[Dict[str, Any]]:
        """
        Transforma suministros a formato de exportación
        """
        export_data = []
        
        for supply in supplies_list:
            export_row = {
                "ID": supply.id,
                "Código": supply.codigo or "",
                "Nombre del Producto": supply.nombre_producto,
                "Presentación": supply.presentacion or "",
                "Descripción": supply.descripcion or "",
                "Categoría": supply.category.name if supply.category else "",
                "Ubicación": supply.location.name if supply.location else "",
                "Stock Actual": supply.stock_actual,
                "Stock Mínimo": supply.stock_minimo,
                "Estado del Stock": InventoryTransforms._get_stock_status_text(supply),
                "Observaciones": supply.observaciones or "",
                "Fecha de Creación": supply.created_at.strftime("%d/%m/%Y %H:%M")
            }
            
            export_data.append(export_row)
        
        return export_data
    
    @staticmethod
    def dashboard_to_report_format(dashboard_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforma datos del dashboard a formato de reporte
        """
        metrics = dashboard_data.get("metrics", {})
        
        report = {
            "titulo": "Reporte de Inventario",
            "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
            
            "resumen_ejecutivo": {
                "total_equipos": metrics.get("total_equipment", 0),
                "equipos_activos": metrics.get("active_equipment", 0),
                "equipos_danados": metrics.get("damaged_equipment", 0),
                "equipos_asignados": metrics.get("assigned_equipment", 0),
                "total_suministros": metrics.get("total_supplies", 0),
                "suministros_stock_bajo": metrics.get("low_stock_supplies", 0),
                
                "porcentajes": {
                    "equipos_operativos": round(
                        (metrics.get("active_equipment", 0) / metrics.get("total_equipment", 1)) * 100, 1
                    ) if metrics.get("total_equipment", 0) > 0 else 0,
                    "tasa_asignacion": round(
                        (metrics.get("assigned_equipment", 0) / metrics.get("total_equipment", 1)) * 100, 1
                    ) if metrics.get("total_equipment", 0) > 0 else 0
                }
            },
            
            "por_categoria": dashboard_data.get("categories_summary", []),
            "por_ubicacion": dashboard_data.get("locations_summary", []),
            "actividad_reciente": dashboard_data.get("recent_activity", []),
            "alertas": dashboard_data.get("alerts", [])
        }
        
        return report
    
    # ===== HELPER METHODS =====
    
    @staticmethod
    def _get_user_full_name(user) -> str:
        """
        Obtiene nombre completo del usuario
        """
        if not user:
            return ""
        
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            return user.email.split('@')[0] if hasattr(user, 'email') and user.email else f"Usuario {user.id}"
        
        return full_name
    
    @staticmethod
    def _get_stock_status_text(supply) -> str:
        """
        Obtiene texto del estado del stock
        """
        if supply.stock_actual == 0:
            return "Agotado"
        elif supply.stock_actual <= supply.stock_minimo * 0.5:
            return "Crítico"
        elif supply.stock_actual <= supply.stock_minimo:
            return "Bajo"
        else:
            return "Normal"