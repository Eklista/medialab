# ===================================================================
# backend/app/utils/user_formatters.py - 🆕 NUEVO CENTRALIZADOR
# ===================================================================
"""
🎯 CENTRALIZADOR DE FORMATEO DE USUARIOS
Unifica todas las transformaciones de datos de usuario para frontend
Mantiene compatibilidad con endpoints existentes
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.auth.users import User
from app.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

class UserFormatter:
    """
    🎨 FORMATEADOR CENTRALIZADO DE USUARIOS
    Todas las transformaciones pasan por aquí
    """
    
    # ===== FORMATOS BASE =====
    
    @staticmethod
    def format_basic(user: User) -> Dict[str, Any]:
        """
        📋 FORMATO BÁSICO - Datos mínimos para listas
        """
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}",
            "avatar": user.profile_image,
            "is_active": user.is_active,
            "is_online": user.is_online
        }
    
    @staticmethod
    def format_detailed(user: User) -> Dict[str, Any]:
        """
        📄 FORMATO DETALLADO - Para perfiles y vistas individuales
        """
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": f"{user.first_name} {user.last_name}",
            "initials": f"{user.first_name[0]}{user.last_name[0]}" if user.first_name and user.last_name else "",
            
            # Imágenes
            "profile_image": user.profile_image,
            "banner_image": user.banner_image,
            "avatar": user.profile_image,  # Alias para frontend
            
            # Contacto
            "phone": user.phone,
            "birth_date": user.birth_date,
            
            # Estado y fechas
            "join_date": user.join_date,
            "last_login": user.last_login,
            "is_active": user.is_active,
            "is_online": user.is_online,
            
            # Metadatos calculados
            "account_age_days": UserFormatter._calculate_account_age(user),
            "last_seen_humanized": UserFormatter._humanize_last_seen(user.last_login),
            "status": UserFormatter._calculate_status(user)
        }
    
    @staticmethod
    def format_with_roles(user: User, include_permissions: bool = False) -> Dict[str, Any]:
        """
        👥 FORMATO CON ROLES - Incluye roles y áreas
        ACTUALIZADO: Reemplaza el transform_user_with_roles existente
        """
        # Datos base detallados
        user_data = UserFormatter.format_detailed(user)
        
        # Obtener áreas asociadas (usando lógica existente optimizada)
        areas = UserFormatter._get_user_areas(user.id)
        
        # Agregar roles y áreas
        user_data.update({
            "roles": [role.name for role in user.roles] if user.roles else [],
            "role_display": user.roles[0].name if user.roles else "Sin rol",
            "areas": areas,
            "area_display": areas[0]["name"] if areas else "Sin área",
            "primary_role": user.roles[0].name if user.roles else None,
            "primary_area": areas[0] if areas else None
        })
        
        # Incluir permisos si se solicita
        if include_permissions:
            permissions = []
            for role in user.roles:
                for permission in role.permissions:
                    if permission.name not in permissions:
                        permissions.append(permission.name)
            user_data["permissions"] = permissions
        
        return user_data
    
    @staticmethod
    def format_for_frontend_complete(user: User) -> Dict[str, Any]:
        """
        🎯 FORMATO COMPLETO PARA FRONTEND
        TODO lo que el frontend necesita en un objeto
        """
        # Base con roles
        user_data = UserFormatter.format_with_roles(user, include_permissions=True)
        
        # Agregar datos específicos para frontend
        user_data.update({
            # Estadísticas
            "stats": {
                "profile_completion": UserFormatter._calculate_profile_completion(user),
                "account_age_days": user_data["account_age_days"],
                "total_logins": getattr(user, 'login_count', 0),
                "last_activity": user.last_login
            },
            
            # Configuraciones (expandible)
            "preferences": {
                "theme": "light",  # Por defecto, luego desde BD
                "notifications": True,
                "language": "es"
            },
            
            # Información de seguridad (sin datos sensibles)
            "security": {
                "password_last_changed": getattr(user, 'password_changed_at', None),
                "two_factor_enabled": False,
                "active_sessions": 1  # Simplificado por ahora
            },
            
            # Datos pre-formateados para UI
            "display": {
                "full_name": user_data["full_name"],
                "initials": user_data["initials"],
                "avatar_url": user_data["avatar"],
                "role_badge": user_data["role_display"],
                "area_badge": user_data["area_display"],
                "status_icon": UserFormatter._get_status_icon(user),
                "status_color": UserFormatter._get_status_color(user)
            }
        })
        
        return user_data
    
    @staticmethod
    def format_for_active_users_menu(user: User) -> Dict[str, Any]:
        """
        👥 FORMATO PARA MENÚ DE USUARIOS ACTIVOS
        Optimizado para mostrar en sidebar/menú
        """
        areas = UserFormatter._get_user_areas(user.id)
        
        return {
            "id": user.id,
            "username": user.username,
            "full_name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "avatar": user.profile_image,
            
            # Estado específico para menú
            "status": UserFormatter._calculate_status(user),
            "status_icon": UserFormatter._get_status_icon(user),
            "status_color": UserFormatter._get_status_color(user),
            "last_seen": user.last_login,
            "last_seen_humanized": UserFormatter._humanize_last_seen(user.last_login),
            
            # Datos organizacionales
            "role": user.roles[0].name if user.roles else None,
            "area": areas[0]["name"] if areas else None,
            "role_color": UserFormatter._get_role_color(user.roles[0].name if user.roles else None),
            
            # Banderas booleanas para frontend
            "is_online": user.is_online,
            "is_available": UserFormatter._is_user_available(user),
            "can_message": user.is_online and user.is_active
        }
    
    @staticmethod
    def format_list_for_frontend(users: List[User], format_type: str = "basic") -> List[Dict[str, Any]]:
        """
        📋 FORMATEAR LISTA DE USUARIOS
        Aplica formato consistente a listas completas
        """
        formatters = {
            "basic": UserFormatter.format_basic,
            "detailed": UserFormatter.format_detailed,
            "with_roles": UserFormatter.format_with_roles,
            "complete": UserFormatter.format_for_frontend_complete,
            "active_menu": UserFormatter.format_for_active_users_menu
        }
        
        formatter = formatters.get(format_type, UserFormatter.format_basic)
        
        try:
            return [formatter(user) for user in users]
        except Exception as e:
            logger.error(f"💥 Error formateando lista de usuarios: {e}")
            # Fallback a formato básico si hay error
            return [UserFormatter.format_basic(user) for user in users]
    
    # ===== MÉTODOS AUXILIARES PRIVADOS =====
    
    @staticmethod
    def _get_user_areas(user_id: int) -> List[Dict[str, Any]]:
        """
        🏢 Obtiene áreas del usuario (optimizado)
        Mantiene la lógica existente pero centralizada
        """
        db = SessionLocal()
        try:
            query = text("""
                SELECT a.id, a.name, a.description
                FROM areas a 
                JOIN user_roles ur ON a.id = ur.area_id 
                WHERE ur.user_id = :user_id
            """)
            result = db.execute(query, {"user_id": user_id}).fetchall()
            
            if result:
                return [{"id": row[0], "name": row[1], "description": row[2]} for row in result]
            return []
        except Exception as e:
            logger.error(f"💥 Error obteniendo áreas para usuario {user_id}: {e}")
            return []
        finally:
            db.close()
    
    @staticmethod
    def _calculate_account_age(user: User) -> int:
        """📅 Calcula edad de la cuenta en días"""
        try:
            if user.join_date:
                return (datetime.utcnow().date() - user.join_date).days
            return 0
        except:
            return 0
    
    @staticmethod
    def _calculate_profile_completion(user: User) -> int:
        """📊 Calcula porcentaje de completitud del perfil"""
        total_fields = 10
        completed_fields = 0
        
        # Campos obligatorios
        if user.first_name and user.first_name.strip(): completed_fields += 1
        if user.last_name and user.last_name.strip(): completed_fields += 1
        if user.email and user.email.strip(): completed_fields += 1
        if user.username and user.username.strip(): completed_fields += 1
        
        # Campos opcionales pero importantes
        if user.phone: completed_fields += 1
        if user.birth_date: completed_fields += 1
        if user.profile_image: completed_fields += 1
        if user.banner_image: completed_fields += 1
        if user.roles: completed_fields += 1
        
        # Verificar si tiene área asignada
        areas = UserFormatter._get_user_areas(user.id)
        if areas: completed_fields += 1
        
        return int((completed_fields / total_fields) * 100)
    
    @staticmethod
    def _calculate_status(user: User) -> str:
        """🔍 Calcula estado del usuario"""
        if not user.is_active:
            return "inactive"
        
        if user.is_online:
            return "online"
        
        if user.last_login:
            # Si estuvo activo en los últimos 30 minutos
            time_diff = datetime.utcnow() - user.last_login
            if time_diff.total_seconds() < 1800:  # 30 minutos
                return "away"
            elif time_diff.total_seconds() < 86400:  # 24 horas
                return "offline"
        
        return "offline"
    
    @staticmethod
    def _humanize_last_seen(last_login: Optional[datetime]) -> str:
        """🕐 Humaniza el último acceso"""
        if not last_login:
            return "Nunca"
        
        try:
            diff = datetime.utcnow() - last_login
            
            if diff.total_seconds() < 60:
                return "Ahora mismo"
            elif diff.total_seconds() < 3600:
                minutes = int(diff.total_seconds() / 60)
                return f"Hace {minutes} min"
            elif diff.total_seconds() < 86400:
                hours = int(diff.total_seconds() / 3600)
                return f"Hace {hours} h"
            else:
                days = diff.days
                return f"Hace {days} días"
        except:
            return "Desconocido"
    
    @staticmethod
    def _get_status_icon(user: User) -> str:
        """🎨 Obtiene icono de estado"""
        status = UserFormatter._calculate_status(user)
        icons = {
            "online": "🟢",
            "away": "🟡", 
            "offline": "⚫",
            "inactive": "🔴"
        }
        return icons.get(status, "⚪")
    
    @staticmethod
    def _get_status_color(user: User) -> str:
        """🎨 Obtiene color de estado para CSS"""
        status = UserFormatter._calculate_status(user)
        colors = {
            "online": "#22c55e",    # green-500
            "away": "#eab308",      # yellow-500
            "offline": "#6b7280",   # gray-500
            "inactive": "#ef4444"   # red-500
        }
        return colors.get(status, "#9ca3af")  # gray-400
    
    @staticmethod
    def _get_role_color(role_name: Optional[str]) -> str:
        """🎨 Obtiene color de rol para badges"""
        if not role_name:
            return "#9ca3af"  # gray-400
        
        colors = {
            "ADMIN": "#dc2626",      # red-600
            "SUPER_ADMIN": "#7c2d12", # red-900
            "MANAGER": "#ea580c",     # orange-600
            "USER": "#2563eb",        # blue-600
            "VIEWER": "#059669"       # emerald-600
        }
        return colors.get(role_name.upper(), "#6366f1")  # indigo-500
    
    @staticmethod
    def _is_user_available(user: User) -> bool:
        """✅ Determina si usuario está disponible para interacción"""
        return user.is_active and user.is_online
