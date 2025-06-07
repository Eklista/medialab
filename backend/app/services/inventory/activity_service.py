# ============================================================================
# backend/app/services/inventory/activity_service.py
# ============================================================================

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.repositories.inventory.activity_repository import ActivityRepository

class ActivityService:
    """
    Servicio para lógica de negocio de actividades de inventario
    """
    
    @staticmethod
    def get_activity_feed(
        db: Session,
        limit: int = 50,
        activity_types: List[str] = None,
        user_id: int = None,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Obtiene feed de actividades con filtros
        """
        # Validar límite
        if limit > 100:
            limit = 100
        elif limit < 1:
            limit = 10
        
        # Validar días hacia atrás
        if days_back > 90:
            days_back = 90
        elif days_back < 1:
            days_back = 1
        
        # Obtener actividades
        activities = ActivityRepository.get_recent_activities(
            db=db,
            limit=limit,
            activity_types=activity_types,
            user_id=user_id,
            days_back=days_back
        )
        
        # Obtener estadísticas
        stats = ActivityRepository.get_activity_stats(db, days_back=7)
        
        # Procesar y enriquecer actividades
        processed_activities = ActivityService._process_activities(activities)
        
        return {
            'activities': processed_activities,
            'total': len(processed_activities),
            'stats': stats,
            'filters': {
                'days_back': days_back,
                'activity_types': activity_types or 'all',
                'user_id': user_id
            },
            'pagination': {
                'limit': limit,
                'has_more': len(processed_activities) >= limit
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_activity_types(db: Session) -> List[Dict[str, Any]]:
        """
        Obtiene tipos de actividades disponibles
        """
        return [
            {
                'value': 'equipment_created',
                'label': 'Equipos creados',
                'category': 'equipment',
                'icon': 'plus',
                'color': '#10B981'
            },
            {
                'value': 'equipment_updated',
                'label': 'Equipos actualizados',
                'category': 'equipment',
                'icon': 'pencil',
                'color': '#F59E0B'
            },
            {
                'value': 'equipment_assigned',
                'label': 'Equipos asignados',
                'category': 'equipment',
                'icon': 'user-plus',
                'color': '#3B82F6'
            },
            {
                'value': 'equipment_unassigned',
                'label': 'Equipos desasignados',
                'category': 'equipment',
                'icon': 'user-minus',
                'color': '#EF4444'
            },
            {
                'value': 'supply_created',
                'label': 'Suministros creados',
                'category': 'supply',
                'icon': 'cube',
                'color': '#8B5CF6'
            },
            {
                'value': 'supply_movement',
                'label': 'Movimientos de stock',
                'category': 'supply',
                'icon': 'arrow-path',
                'color': '#06B6D4'
            },
            {
                'value': 'supply_low_stock',
                'label': 'Alertas de stock bajo',
                'category': 'supply',
                'icon': 'exclamation-triangle',
                'color': '#F97316'
            }
        ]
    
    @staticmethod
    def get_recent_activity_summary(db: Session) -> Dict[str, Any]:
        """
        Resumen de actividad reciente para dashboard
        """
        # Actividades de las últimas 24 horas
        today_stats = ActivityRepository.get_activity_stats(db, days_back=1)
        
        # Actividades de la última semana
        week_stats = ActivityRepository.get_activity_stats(db, days_back=7)
        
        # Obtener algunas actividades destacadas
        recent_activities = ActivityRepository.get_recent_activities(
            db=db,
            limit=5,
            days_back=7
        )
        
        return {
            'today': {
                'equipment_created': today_stats['equipment_created'],
                'equipment_assigned': today_stats['equipment_assigned'],
                'stock_movements': today_stats['stock_movements']
            },
            'this_week': {
                'equipment_created': week_stats['equipment_created'],
                'equipment_assigned': week_stats['equipment_assigned'],
                'stock_movements': week_stats['stock_movements']
            },
            'alerts': {
                'low_stock_count': today_stats['low_stock_alerts']
            },
            'recent_highlights': ActivityService._get_activity_highlights(recent_activities),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def mark_activity_as_read(
        db: Session,
        activity_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Marca una actividad como leída (para futuras implementaciones)
        """
        # Por ahora solo retornamos confirmación
        # En el futuro se podría agregar una tabla de actividades leídas
        return {
            'activity_id': activity_id,
            'user_id': user_id,
            'marked_at': datetime.utcnow().isoformat(),
            'status': 'success'
        }
    
    # ===== MÉTODOS PRIVADOS =====
    
    @staticmethod
    def _process_activities(activities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Procesa y enriquece las actividades
        """
        processed = []
        
        for activity in activities:
            # Agregar información de display
            activity['display'] = ActivityService._generate_display_info(activity)
            
            # Agregar tiempo relativo
            activity['relative_time'] = ActivityService._get_relative_time(activity['timestamp'])
            
            # Agregar configuración de UI
            activity['ui'] = ActivityService._get_ui_config(activity)
            
            processed.append(activity)
        
        return processed
    
    @staticmethod
    def _generate_display_info(activity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Genera información de display para la actividad
        """
        activity_type = activity.get('type', '')
        action = activity.get('action', '')
        
        # Configurar iconos
        icon_map = {
            ('equipment', 'created'): 'plus',
            ('equipment', 'updated'): 'pencil',
            ('equipment', 'assigned'): 'user-plus',
            ('equipment', 'unassigned'): 'user-minus',
            ('equipment', 'deleted'): 'trash',
            ('supply', 'created'): 'cube',
            ('supply', 'low_stock'): 'exclamation-triangle',
            ('movement', 'stock_in'): 'arrow-down',
            ('movement', 'stock_out'): 'arrow-up',
            ('movement', 'stock_adjusted'): 'adjustments'
        }
        
        icon = icon_map.get((activity_type, action), 'clock')
        
        # Configurar colores
        color_map = {
            'equipment': '#3B82F6',  # blue
            'supply': '#8B5CF6',     # purple
            'movement': '#06B6D4'    # cyan
        }
        
        status_colors = {
            'success': '#10B981',   # green
            'warning': '#F59E0B',   # amber
            'error': '#EF4444',     # red
            'pending': '#6B7280'    # gray
        }
        
        primary_color = color_map.get(activity_type, '#6B7280')
        status_color = status_colors.get(activity.get('status', 'success'), primary_color)
        
        return {
            'icon': icon,
            'primary_color': primary_color,
            'status_color': status_color,
            'badge_text': ActivityService._get_badge_text(activity),
            'summary': activity.get('title', 'Actividad'),
            'details': activity.get('description', '')
        }
    
    @staticmethod
    def _get_relative_time(timestamp: str) -> str:
        """
        Convierte timestamp a tiempo relativo
        """
        try:
            activity_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            now = datetime.utcnow()
            diff = now - activity_time.replace(tzinfo=None)
            
            if diff.total_seconds() < 60:
                return "Hace un momento"
            elif diff.total_seconds() < 3600:
                minutes = int(diff.total_seconds() / 60)
                return f"Hace {minutes} min"
            elif diff.total_seconds() < 86400:
                hours = int(diff.total_seconds() / 3600)
                return f"Hace {hours} hora{'s' if hours > 1 else ''}"
            elif diff.days < 7:
                return f"Hace {diff.days} día{'s' if diff.days > 1 else ''}"
            else:
                return activity_time.strftime("%d/%m/%Y")
        except:
            return "Tiempo desconocido"
    
    @staticmethod
    def _get_badge_text(activity: Dict[str, Any]) -> str:
        """
        Genera texto para badge de la actividad
        """
        activity_type = activity.get('type', '')
        action = activity.get('action', '')
        priority = activity.get('priority', 'medium')
        
        if priority == 'critical':
            return 'CRÍTICO'
        elif priority == 'high':
            return 'IMPORTANTE'
        elif action == 'created':
            return 'NUEVO'
        elif action in ['assigned', 'stock_in']:
            return 'ASIGNADO'
        elif action in ['low_stock']:
            return 'ALERTA'
        else:
            return activity_type.upper()
    
    @staticmethod
    def _get_ui_config(activity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Configuración de UI para la actividad
        """
        priority = activity.get('priority', 'medium')
        status = activity.get('status', 'success')
        
        return {
            'priority_class': f"priority-{priority}",
            'status_class': f"status-{status}",
            'clickable': True,
            'show_metadata': activity.get('metadata') is not None,
            'show_user': activity.get('user') is not None,
            'compact_mode': False
        }
    
    @staticmethod
    def _get_activity_highlights(activities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extrae highlights de las actividades recientes
        """
        highlights = []
        
        for activity in activities[:3]:  # Solo los primeros 3
            if activity.get('priority') in ['high', 'critical']:
                highlights.append({
                    'title': activity.get('title', ''),
                    'type': activity.get('type', ''),
                    'priority': activity.get('priority', 'medium'),
                    'timestamp': activity.get('timestamp', '')
                })
        
        return highlights