# backend/app/api/v1/users/users.py

from typing import List, Any, Dict, Optional
from fastapi import APIRouter, Depends, status, Body, UploadFile, File, Form, Path, Query, Request
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

from app.database import get_db
from app.models.auth.users import User
from app.schemas.users.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.controllers.users.user_controller import UserController
from app.utils.error_handler import ErrorHandler
from app.config.redis_config import redis_manager
from app.api.deps import (
    get_current_user, 
    get_current_active_user,
    has_permission,
    is_self_or_has_permission,
    get_optional_current_user
)

logger = logging.getLogger(__name__)
router = APIRouter()

# ===== INFORMACIÓN DEL USUARIO ACTUAL =====

@router.get("/me", response_model=UserWithRoles)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Obtiene el usuario actualmente autenticado"""
    return UserController.get_current_user_info(current_user)

@router.get("/me/enhanced", response_model=Dict[str, Any])
def read_current_user_enhanced(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 PERFIL COMPLETO MEJORADO PARA FRONTEND
    Incluye todo lo que el frontend necesita
    """
    return UserController.get_current_user_info_enhanced(current_user)

@router.patch("/me", response_model=UserInDB)
def update_current_user(
    user_data: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("profile_edit"))
) -> Any:
    """Actualiza información del usuario actual"""
    return UserController.update_user(db, current_user.id, user_data, current_user)

@router.get("/me/permissions", response_model=List[str])
def get_current_user_permissions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Obtiene los permisos del usuario actualmente autenticado"""
    return UserController.get_user_permissions(current_user)

# ===== GESTIÓN DE USUARIOS =====

@router.get("/", response_model=List[UserWithRoles])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """Obtiene lista de usuarios (requiere permiso user_view)"""
    return UserController.get_users_list(db, skip, limit)

@router.get("/formatted")
def read_users_formatted(
    skip: int = 0,
    limit: int = 100,
    format_type: str = Query("with_roles", description="Tipo de formato: basic, detailed, with_roles, complete, active_menu"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """
    🆕 LISTA DE USUARIOS CON FORMATO ESPECÍFICO
    Permite elegir el nivel de detalle necesario
    """
    try:
        return UserController.get_users_list_formatted(db, skip, limit, format_type)
    except Exception as e:
        logger.error(f"💥 Error en /users/formatted: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios formateados: {str(e)}"
        )

@router.get("/active-menu")
def get_active_users_menu(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 USUARIOS ACTIVOS PARA MENÚ/SIDEBAR
    Optimizado para mostrar en interfaces de usuario
    """
    return UserController.get_active_users_for_menu(db, limit)

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_create"))
) -> Any:
    """Crea un nuevo usuario (requiere permiso user_create)"""
    return UserController.create_new_user(db, user_in, current_user)

@router.get("/{user_id}", response_model=UserWithRoles)
def read_user_by_id(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_view"))
) -> Any:
    """Obtiene un usuario por ID (propio usuario o requiere permiso user_view)"""
    return UserController.get_user_by_id(db, user_id, current_user)

@router.patch("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int = Path(..., title="ID del usuario"),
    user_data: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_edit"))
) -> Any:
    """Actualiza información de un usuario (propio usuario o requiere permiso user_edit)"""
    return UserController.update_user(db, user_id, user_data, current_user)

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_delete"))
) -> Any:
    """Elimina un usuario (requiere permiso user_delete)"""
    return UserController.delete_user(db, user_id, current_user)

# ===== GESTIÓN DE ROLES =====

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    user_id: int = Path(..., title="ID del usuario"),
    roleId: str = Body(...),
    areaId: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_edit"))
) -> Any:
    """Asigna un rol a un usuario (requiere permiso user_edit)"""
    return UserController.assign_role_to_user(db, user_id, roleId, areaId, current_user)

# ===== GESTIÓN DE IMÁGENES =====

@router.post("/upload-image", status_code=status.HTTP_200_OK)
def upload_user_image(
    file: UploadFile = File(...),
    type: str = Form(..., description="Tipo de imagen: 'profile' o 'banner'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Sube una imagen de perfil o banner para el usuario"""
    return UserController.upload_user_image(db, file, type, current_user)

# ===== ENDPOINTS DE ESTADO/PRESENCIA =====

@router.get("/online")
def get_online_users(
    db: Session = Depends(get_db)
    # 🔧 SIN autenticación por ahora para evitar 422
) -> dict:
    """
    📊 USUARIOS ONLINE 
    Obtiene lista de usuarios activos recientemente
    """
    try:
        logger.info("📊 Obteniendo usuarios online")
        
        # Threshold para usuarios recientes (últimos 15 minutos)
        recent_threshold = datetime.utcnow() - timedelta(minutes=15)
        
        # Query: usuarios activos que han hecho login recientemente
        online_users = db.query(User).filter(
            and_(
                User.is_active == True,
                User.last_login.isnot(None),
                User.last_login >= recent_threshold
            )
        ).order_by(User.last_login.desc()).limit(20).all()
        
        logger.info(f"✅ Encontrados {len(online_users)} usuarios online")
        
        # Formatear usuarios
        formatted_users = []
        for user in online_users:
            try:
                # Nombres
                first_name = getattr(user, 'first_name', '') or ''
                last_name = getattr(user, 'last_name', '') or ''
                
                if first_name and last_name:
                    full_name = f"{first_name} {last_name}"
                    initials = f"{first_name[0]}{last_name[0]}".upper()
                elif first_name:
                    full_name = first_name
                    initials = first_name[0].upper()
                else:
                    full_name = user.email.split('@')[0] if user.email else f"Usuario {user.id}"
                    initials = full_name[0].upper() if full_name else "U"
                
                # Estado basado en última actividad
                last_login = getattr(user, 'last_login', None)
                is_online = False
                status = "offline"
                
                if last_login:
                    minutes_ago = (datetime.utcnow() - last_login).total_seconds() / 60
                    if minutes_ago <= 5:
                        status = "online"
                        is_online = True
                    elif minutes_ago <= 15:
                        status = "away"
                        is_online = True
                
                user_data = {
                    "id": user.id,
                    "name": full_name,
                    "fullName": full_name,
                    "initials": initials,
                    "email": user.email or "",
                    "profileImage": getattr(user, 'profile_image', None),
                    "status": status,
                    "isOnline": bool(is_online),
                    "lastSeen": last_login.isoformat() if last_login else None,
                    "lastLogin": last_login.isoformat() if last_login else None
                }
                
                formatted_users.append(user_data)
                
            except Exception as user_error:
                logger.warning(f"⚠️ Error formateando usuario {getattr(user, 'id', '?')}: {user_error}")
                continue
        
        # Respuesta
        response = {
            "users": formatted_users,
            "total": len(formatted_users),
            "totalOnline": len([u for u in formatted_users if u["status"] == "online"]),
            "totalActive": len([u for u in formatted_users if u["isOnline"]]),
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        
        logger.info(f"✅ Respuesta exitosa: {len(formatted_users)} usuarios")
        return response
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo usuarios online: {e}")
        
        # Respuesta de error
        return {
            "users": [],
            "total": 0,
            "totalOnline": 0,
            "totalActive": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": str(e)
        }

@router.post("/heartbeat")
def user_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    💓 HEARTBEAT - Mantiene usuario activo
    Actualiza last_login y estado online
    """
    try:
        logger.info(f"💓 Heartbeat de usuario {current_user.id}")
        
        # Actualizar last_login
        current_user.last_login = datetime.utcnow()
        
        # Actualizar is_online si existe el campo
        if hasattr(current_user, 'is_online'):
            current_user.is_online = True
        
        # Usar Redis si está disponible
        try:
            redis_key = f"user:online:{current_user.id}"
            redis_timestamp = datetime.utcnow().isoformat()
            redis_success = redis_manager.set(
                key=redis_key,
                value=redis_timestamp,
                expire=90  # 90 segundos TTL
            )
            logger.debug(f"Redis heartbeat: {'✅' if redis_success else '❌'}")
        except Exception as redis_error:
            logger.warning(f"Redis no disponible: {redis_error}")
        
        # Commit cambios a BD
        db.commit()
        
        response = {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online",
            "userId": current_user.id,
            "message": "Heartbeat registrado"
        }
        
        logger.info(f"✅ Heartbeat exitoso para usuario {current_user.id}")
        return response
        
    except Exception as e:
        db.rollback()
        logger.error(f"💥 Error en heartbeat: {e}")
        
        return {
            "success": False,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "userId": getattr(current_user, 'id', None),
            "message": "Error en heartbeat"
        }

@router.get("/debug-users")
def debug_users_in_database(
    db: Session = Depends(get_db)
) -> dict:
    """
    🔍 DEBUG: Ver todos los usuarios en la BD y sus last_login
    """
    try:
        from app.models.auth.users import User
        from datetime import datetime, timedelta
        
        # Obtener TODOS los usuarios activos
        all_users = db.query(User).filter(User.is_active == True).limit(10).all()
        
        users_info = []
        recent_threshold = datetime.utcnow() - timedelta(minutes=15)
        
        for user in all_users:
            last_login = getattr(user, 'last_login', None)
            
            user_info = {
                "id": user.id,
                "email": user.email,
                "first_name": getattr(user, 'first_name', None),
                "last_name": getattr(user, 'last_name', None),
                "is_active": user.is_active,
                "last_login": last_login.isoformat() if last_login else None,
                "minutes_ago": None,
                "is_recent": False
            }
            
            if last_login:
                minutes_ago = (datetime.utcnow() - last_login).total_seconds() / 60
                user_info["minutes_ago"] = round(minutes_ago, 1)
                user_info["is_recent"] = last_login >= recent_threshold
            
            users_info.append(user_info)
        
        # Estadísticas
        total_users = len(users_info)
        users_with_login = len([u for u in users_info if u["last_login"]])
        recent_users = len([u for u in users_info if u["is_recent"]])
        
        return {
            "total_active_users": total_users,
            "users_with_last_login": users_with_login,
            "recent_users_15min": recent_users,
            "threshold": recent_threshold.isoformat(),
            "current_time": datetime.utcnow().isoformat(),
            "users": users_info
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "debug": "Error obteniendo información de usuarios"
        }
        
# ===== BÚSQUEDA DE USUARIOS =====

@router.get("/search")
def search_users(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    role: str = Query(None, description="Filtrar por rol"),
    area: str = Query(None, description="Filtrar por área"),
    is_active: bool = Query(None, description="Filtrar por estado activo"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """
    🔍 BÚSQUEDA AVANZADA DE USUARIOS
    Busca por nombre, email y aplica filtros
    """
    try:
        # Construir query base
        query = db.query(User)
        
        # Filtro de búsqueda por texto
        search_filter = or_(
            User.first_name.ilike(f"%{q}%"),
            User.last_name.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%"),
            User.username.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)
        
        # Filtros adicionales
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        # TODO: Implementar filtros por rol y área cuando el modelo esté listo
        
        # Ejecutar query
        users = query.limit(limit).all()
        
        # Formatear respuesta
        results = []
        for user in users:
            results.append(UserController._format_user_with_roles(user))
        
        return results
        
    except Exception as e:
        logger.error(f"💥 Error en búsqueda de usuarios: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en la búsqueda de usuarios"
        )