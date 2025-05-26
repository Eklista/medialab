# backend/app/api/v1/permissions.py
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.database import get_db
from app.models.auth.users import User
from app.models.auth.permissions import Permission
from app.schemas.auth.permissions import PermissionResponse, PermissionCategory
from app.api.deps import get_current_active_user, has_permission
from app.utils.error_handler import ErrorHandler

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[PermissionResponse])
def read_permissions(
    skip: int = Query(0, ge=0, description="Número de permisos a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de permisos a devolver"),
    category: str = Query(None, description="Filtrar por categoría (ej: user, role, area)"),
    search: str = Query(None, description="Buscar permisos por nombre o descripción"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene todos los permisos disponibles en el sistema (solo para administradores)
    
    - **skip**: Número de permisos a omitir para paginación
    - **limit**: Máximo número de permisos a devolver
    - **category**: Filtrar por categoría (user, role, area, etc.)
    - **search**: Buscar en nombre o descripción del permiso
    """
    try:
        query = db.query(Permission)
        
        # Filtro por categoría
        if category:
            query = query.filter(Permission.name.like(f"{category}_%"))
        
        # Filtro por búsqueda
        if search:
            search_filter = f"%{search.lower()}%"
            query = query.filter(
                Permission.name.ilike(search_filter) |
                Permission.description.ilike(search_filter)
            )
        
        # Aplicar paginación y orden
        permissions = query.order_by(Permission.name).offset(skip).limit(limit).all()
        
        logger.info(f"Usuario {current_user.email} consultó {len(permissions)} permisos")
        return permissions
        
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener permisos: {e}")
        raise ErrorHandler.handle_db_error(e, "obtener", "permisos")

@router.get("/me", response_model=List[str])
def get_my_permissions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene los permisos del usuario actual
    
    Cualquier usuario autenticado puede ver sus propios permisos.
    """
    try:
        # Extraer permisos únicos de todos los roles del usuario
        permissions = set()
        
        for role in current_user.roles:
            for permission in role.permissions:
                permissions.add(permission.name)
        
        permissions_list = sorted(list(permissions))
        
        logger.debug(f"Usuario {current_user.email} tiene {len(permissions_list)} permisos")
        return permissions_list
        
    except Exception as e:
        logger.error(f"Error al obtener permisos del usuario {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener permisos del usuario"
        )

@router.get("/categories", response_model=List[PermissionCategory])
def get_permission_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene permisos agrupados por categorías (solo para administradores)
    """
    try:
        permissions = db.query(Permission).order_by(Permission.name).all()
        
        # Agrupar por categoría
        categories_dict: Dict[str, List[Permission]] = {}
        
        for permission in permissions:
            # Extraer categoría del nombre del permiso (ej: "user_view" -> "user")
            category = permission.name.split('_')[0] if '_' in permission.name else 'other'
            
            if category not in categories_dict:
                categories_dict[category] = []
            
            categories_dict[category].append(permission)
        
        # Convertir a formato de respuesta
        categories = []
        for category_name, category_permissions in categories_dict.items():
            categories.append(PermissionCategory(
                name=category_name,
                display_name=_get_category_display_name(category_name),
                permissions=[
                    PermissionResponse(
                        id=p.id,
                        name=p.name,
                        description=p.description
                    ) for p in category_permissions
                ]
            ))
        
        # Ordenar categorías por nombre de visualización
        categories.sort(key=lambda x: x.display_name)
        
        logger.info(f"Usuario {current_user.email} consultó {len(categories)} categorías de permisos")
        return categories
        
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener categorías de permisos: {e}")
        raise ErrorHandler.handle_db_error(e, "obtener", "categorías de permisos")

@router.get("/check/{permission_name}", response_model=bool)
def check_permission(
    permission_name: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Verifica si el usuario actual tiene un permiso específico
    
    - **permission_name**: Nombre del permiso a verificar (ej: user_view, role_create)
    """
    try:
        # Verificar si es administrador
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        if is_admin:
            return True
        
        # Verificar permiso específico
        user_permissions = set()
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.add(permission.name)
        
        has_permission = permission_name in user_permissions
        
        logger.debug(f"Usuario {current_user.email} {'tiene' if has_permission else 'NO tiene'} permiso '{permission_name}'")
        return has_permission
        
    except Exception as e:
        logger.error(f"Error al verificar permiso '{permission_name}' para usuario {current_user.email}: {e}")
        return False

@router.get("/stats", response_model=Dict[str, Any])
def get_permissions_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene estadísticas de permisos del sistema (solo para administradores)
    """
    try:
        total_permissions = db.query(Permission).count()
        
        # Contar permisos por categoría
        permissions = db.query(Permission).all()
        categories_count = {}
        
        for permission in permissions:
            category = permission.name.split('_')[0] if '_' in permission.name else 'other'
            categories_count[category] = categories_count.get(category, 0) + 1
        
        stats = {
            "total_permissions": total_permissions,
            "categories_count": len(categories_count),
            "permissions_by_category": categories_count,
            "most_common_category": max(categories_count.items(), key=lambda x: x[1])[0] if categories_count else None
        }
        
        logger.info(f"Usuario {current_user.email} consultó estadísticas de permisos")
        return stats
        
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener estadísticas de permisos: {e}")
        raise ErrorHandler.handle_db_error(e, "obtener", "estadísticas de permisos")

def _get_category_display_name(category: str) -> str:
    """
    Convierte nombres de categoría en nombres más amigables
    """
    category_names = {
        'user': 'Usuarios',
        'role': 'Roles',
        'area': 'Áreas',
        'service': 'Servicios',
        'template': 'Plantillas',
        'request': 'Solicitudes', 
        'department': 'Departamentos',
        'department_type': 'Tipos de Departamentos',
        'smtp_config': 'Configuración SMTP',
        'email_template': 'Plantillas de Email',
        'profile': 'Perfil',
        'other': 'Otros'
    }
    
    return category_names.get(category, category.title())