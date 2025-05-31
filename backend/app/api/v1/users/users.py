# backend/app/api/v1/users/users.py

from typing import List, Any, Dict
from fastapi import APIRouter, Depends, status, Body, UploadFile, File, Form, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.schemas.users.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.controllers.users.user_controller import UserController
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_user, 
    get_current_active_user,
    has_permission,
    is_self_or_has_permission
)

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

# 🆕 NUEVO: ENDPOINT FORMATTED QUE FALTABA
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
        # Log del error pero devolver respuesta HTTP válida
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"💥 Error en /users/formatted: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios formateados: {str(e)}"
        )

# 🆕 NUEVO: USUARIOS ACTIVOS PARA MENÚ
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 OBTIENE USUARIOS ONLINE - VERSIÓN CORREGIDA
    Para dashboards y monitores de actividad
    """
    try:
        from sqlalchemy import and_, or_, text
        from datetime import datetime, timedelta
        
        logger.info(f"📊 Obteniendo usuarios online para {current_user.email}")
        
        # Threshold para considerar usuario como "recientemente activo"
        recent_threshold = datetime.utcnow() - timedelta(minutes=5)
        
        # 🔧 QUERY MÁS ROBUSTA - Verificar que las columnas existan
        try:
            # Intentar query con is_online primero
            online_users = db.query(User).filter(
                and_(
                    User.is_active == True,
                    or_(
                        # Usuarios explícitamente online (si la columna existe)
                        User.is_online == True,
                        # O usuarios con login reciente
                        and_(
                            User.last_login.isnot(None),
                            User.last_login >= recent_threshold
                        )
                    )
                )
            ).order_by(
                User.last_login.desc().nullslast()
            ).limit(50).all()  # Limitar resultados
            
        except Exception as db_error:
            logger.warning(f"⚠️ Error con columna is_online, usando solo last_login: {db_error}")
            
            # Fallback: Solo usar last_login si is_online no existe
            online_users = db.query(User).filter(
                and_(
                    User.is_active == True,
                    User.last_login.isnot(None),
                    User.last_login >= recent_threshold
                )
            ).order_by(
                User.last_login.desc()
            ).limit(50).all()
        
        # Formatear respuesta de forma segura
        formatted_users = []
        for user in online_users:
            try:
                # Verificar si is_online existe como atributo
                is_online_attr = getattr(user, 'is_online', None)
                is_currently_online = False
                
                if is_online_attr is not None:
                    is_currently_online = bool(is_online_attr)
                elif user.last_login:
                    # Fallback: considerar online si login fue reciente
                    is_currently_online = user.last_login >= recent_threshold
                
                # Determinar status
                if is_currently_online:
                    status = "online"
                elif user.last_login and user.last_login >= datetime.utcnow() - timedelta(hours=1):
                    status = "away"
                else:
                    status = "offline"
                
                # Construir objeto usuario de forma segura
                formatted_user = {
                    "id": user.id,
                    "name": UserController._get_full_name(user),
                    "fullName": UserController._get_full_name(user),
                    "initials": UserController._get_initials(user),
                    "email": user.email,
                    "profileImage": getattr(user, 'profile_image', None),
                    "status": status,
                    "isOnline": is_currently_online,
                    "lastSeen": user.last_login.isoformat() if user.last_login else None,
                    "lastLogin": user.last_login.isoformat() if user.last_login else None
                }
                
                formatted_users.append(formatted_user)
                
            except Exception as format_error:
                logger.error(f"💥 Error formateando usuario {user.id}: {format_error}")
                continue
        
        # Construir respuesta final
        response_data = {
            "users": formatted_users,
            "total": len(formatted_users),
            "timestamp": datetime.utcnow().isoformat(),
            "debug": {
                "query_threshold": recent_threshold.isoformat(),
                "total_found": len(online_users),
                "total_formatted": len(formatted_users)
            }
        }
        
        logger.info(f"✅ Devolviendo {len(formatted_users)} usuarios online")
        return response_data
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo usuarios online: {e}")
        logger.error(f"💥 Error type: {type(e).__name__}")
        logger.error(f"💥 Error details: {str(e)}")
        
        # Respuesta de error estructurada
        error_response = {
            "users": [],
            "total": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "error_type": type(e).__name__
        }
        
        return error_response

@router.post("/heartbeat")
def user_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    💓 HEARTBEAT SIMPLIFICADO Y ROBUSTO
    """
    try:
        from datetime import datetime
        
        logger.info(f"💓 Heartbeat de usuario {current_user.id}")
        
        # Actualizar last_login (este campo seguro existe)
        current_user.last_login = datetime.utcnow()
        
        # Intentar actualizar is_online si existe
        try:
            if hasattr(current_user, 'is_online'):
                current_user.is_online = True
                logger.debug(f"✅ is_online actualizado para usuario {current_user.id}")
            else:
                logger.warning(f"⚠️ Campo is_online no existe en modelo User")
        except Exception as online_error:
            logger.warning(f"⚠️ No se pudo actualizar is_online: {online_error}")
        
        # Commit cambios
        db.commit()
        db.refresh(current_user)
        
        response = {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online",
            "userId": current_user.id,
            "message": "Heartbeat registrado correctamente"
        }
        
        logger.info(f"✅ Heartbeat exitoso para usuario {current_user.id}")
        return response
        
    except Exception as e:
        db.rollback()
        logger.error(f"💥 Error en heartbeat para usuario {current_user.id}: {e}")
        
        return {
            "success": False,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "userId": current_user.id,
            "message": "Error en heartbeat"
        }

# 🔧 ENDPOINT PARA CAMBIAR ESTADO MANUAL
@router.patch("/online-status")
def update_online_status(
    status_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 ACTUALIZAR ESTADO ONLINE MANUALMENTE
    Permite al usuario establecer su estado
    """
    try:
        from datetime import datetime
        
        is_online = status_data.get('isOnline', True)
        status = status_data.get('status', 'online')  # online, away, busy, offline
        
        # Actualizar estado
        current_user.is_online = is_online
        if is_online:
            current_user.last_login = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "status": status,
            "isOnline": is_online,
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"Estado actualizado a {status}"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"💥 Error actualizando estado online: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar estado online"
        )

@router.patch("/profile/online-status")
def update_online_status(
    is_online: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 ACTUALIZA ESTADO ONLINE DEL USUARIO
    Para tracking de presencia
    """
    try:
        current_user.is_online = is_online
        if is_online:
            from datetime import datetime
            current_user.last_login = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": f"Estado actualizado a {'online' if is_online else 'offline'}"}
        
    except Exception as e:
        db.rollback()
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"💥 Error actualizando estado online: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar estado online"
        )

@router.post("/presence/heartbeat")
def send_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 HEARTBEAT PARA MANTENER USUARIO ACTIVO
    Llamado periódicamente por el frontend
    """
    try:
        from datetime import datetime
        
        current_user.last_login = datetime.utcnow()
        current_user.is_online = True
        db.commit()
        
        return {"success": True, "timestamp": datetime.utcnow().isoformat()}
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

# ===== ENDPOINTS DE BÚSQUEDA =====

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
    🆕 BÚSQUEDA AVANZADA DE USUARIOS
    Busca por nombre, email y aplica filtros
    """
    try:
        from sqlalchemy import or_, and_
        
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
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"💥 Error en búsqueda de usuarios: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en la búsqueda de usuarios"
        )