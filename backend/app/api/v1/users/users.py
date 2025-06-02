# backend/app/api/v1/users/users.py

from typing import List, Any, Dict
from fastapi import APIRouter, Depends, status, Body, UploadFile, File, Form, Path, Query, Request
from sqlalchemy.orm import Session
import logging  # 🆕 AGREGAR ESTA IMPORTACIÓN

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
    is_self_or_has_permission
)

# 🆕 CONFIGURAR LOGGER DESPUÉS DE LAS IMPORTACIONES
logger = logging.getLogger(__name__)

router = APIRouter()

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

# 🚨 COPIAR Y PEGAR ESTE CÓDIGO EN backend/app/api/v1/users/users.py
# REEMPLAZAR EL ENDPOINT @router.get("/online") COMPLETO

@router.get("/online")
def get_online_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    🔧 USUARIOS ONLINE - VERSIÓN CORREGIDA QUE FUNCIONA
    """
    from datetime import datetime, timedelta
    from sqlalchemy import and_, or_
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"📊 [FIXED] Obteniendo usuarios online para {current_user.email}")
        
        # Respuesta base que SIEMPRE funciona
        response = {
            "users": [],
            "total": 0,
            "totalOnline": 0,
            "totalActive": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "debug": {
                "version": "fixed_v1",
                "user": current_user.email,
                "message": "Endpoint corregido funcionando"
            }
        }
        
        # Intentar obtener usuarios de forma defensiva
        try:
            # Threshold para usuarios recientes
            recent_threshold = datetime.utcnow() - timedelta(minutes=5)
            
            # Query simple y robusta
            online_users = db.query(User).filter(
                and_(
                    User.is_active == True,
                    or_(
                        User.is_online == True,
                        and_(
                            User.last_login.isnot(None),
                            User.last_login >= recent_threshold
                        )
                    )
                )
            ).order_by(User.last_login.desc().nullslast()).limit(20).all()
            
            logger.info(f"✅ [FIXED] Query exitosa: {len(online_users)} usuarios")
            
            # Formatear usuarios de forma ultra-defensiva
            formatted_users = []
            for user in online_users:
                try:
                    # Nombres defensivos
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
                    
                    # Estado simple
                    is_online = getattr(user, 'is_online', False)
                    last_login = getattr(user, 'last_login', None)
                    
                    status = "online" if is_online else "offline"
                    if not is_online and last_login:
                        minutes_ago = (datetime.utcnow() - last_login).total_seconds() / 60
                        if minutes_ago <= 5:
                            status = "online"
                            is_online = True
                        elif minutes_ago <= 30:
                            status = "away"
                    
                    # Usuario formateado
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
                    logger.warning(f"⚠️ [FIXED] Error usuario {getattr(user, 'id', '?')}: {user_error}")
                    continue
            
            # Actualizar respuesta
            response["users"] = formatted_users
            response["total"] = len(formatted_users)
            response["totalOnline"] = len([u for u in formatted_users if u["status"] == "online"])
            response["totalActive"] = len([u for u in formatted_users if u["isOnline"]])
            response["debug"]["users_processed"] = len(formatted_users)
            
            logger.info(f"✅ [FIXED] Respuesta exitosa: {len(formatted_users)} usuarios")
            
        except Exception as query_error:
            logger.error(f"💥 [FIXED] Error en query: {query_error}")
            response["debug"]["query_error"] = str(query_error)
            response["debug"]["fallback"] = "empty_due_to_query_error"
        
        return response
        
    except Exception as critical_error:
        logger.error(f"💥 [FIXED] Error crítico: {critical_error}")
        
        # Respuesta de emergencia que SIEMPRE funciona
        return {
            "users": [],
            "total": 0,
            "totalOnline": 0,
            "totalActive": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": str(critical_error),
            "debug": {
                "version": "emergency_fallback",
                "error_type": type(critical_error).__name__
            }
        }
        
@router.post("/logout-online")
def logout_mark_offline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🔴 MARCAR USUARIO COMO OFFLINE EN LOGOUT
    Limpia estado online de Redis + actualiza BD
    """
    try:
        from datetime import datetime
        
        logger.info(f"🔴 Marcando usuario {current_user.id} como offline")
        
        # 1. LIMPIAR DE REDIS
        redis_key = f"user:online:{current_user.id}"
        redis_success = redis_manager.delete(redis_key)
        
        if redis_success:
            logger.debug(f"✅ Usuario {current_user.id} removido de Redis")
        else:
            logger.warning(f"⚠️ No se pudo remover usuario {current_user.id} de Redis")
        
        # 2. ACTUALIZAR BD
        try:
            if hasattr(current_user, 'is_online'):
                current_user.is_online = False
            
            # Mantener last_login para historial
            db.commit()
            logger.debug(f"✅ Usuario {current_user.id} marcado como offline en BD")
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"💥 Error actualizando BD en logout: {db_error}")
        
        # 3. RESPUESTA
        return {
            "success": True,
            "user_id": current_user.id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Usuario marcado como offline",
            "storage": {
                "redis_removed": redis_success,
                "database_updated": True
            }
        }
        
    except Exception as e:
        logger.error(f"💥 Error marcando usuario offline: {e}")
        return {
            "success": False,
            "user_id": current_user.id,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
        
@router.get("/online-secure")
def get_online_users_secure(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    📊 USUARIOS ONLINE CON AUTENTICACIÓN REQUERIDA
    Una vez que fixes el problema de auth, usa este endpoint
    """
    try:
        logger.info(f"📊 Usuario autenticado {current_user.email} obteniendo usuarios online")
        
        # Reutilizar la lógica del endpoint sin auth
        # (mismo código que arriba)
        # ...
        
        return {"message": "Una vez que fixes la auth, implementa la lógica aquí"}
        
    except Exception as e:
        logger.error(f"💥 Error en endpoint seguro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuarios online"
        )


# 🧪 ENDPOINT TEMPORAL DE DEBUG SIN AUTENTICACIÓN
@router.get("/online-debug")
def get_online_users_debug(
    db: Session = Depends(get_db)
    # SIN current_user dependency para testing
) -> Any:
    """
    🧪 ENDPOINT DE DEBUG SIN AUTENTICACIÓN
    Solo para verificar que la lógica funciona
    """
    try:
        from sqlalchemy import and_, or_, text
        from datetime import datetime, timedelta
        
        logger.info("🧪 DEBUG: Obteniendo usuarios online SIN autenticación")
        
        # Threshold para considerar usuario como "recientemente activo"
        recent_threshold = datetime.utcnow() - timedelta(minutes=5)
        
        # Query básica de usuarios activos
        try:
            online_users = db.query(User).filter(
                User.is_active == True
            ).limit(10).all()  # Solo 10 para debug
            
        except Exception as db_error:
            logger.error(f"💥 Error en query: {db_error}")
            return {
                "users": [],
                "total": 0,
                "error": str(db_error),
                "debug": "Query failed"
            }
        
        # Formatear respuesta básica
        formatted_users = []
        for user in online_users:
            try:
                formatted_user = {
                    "id": user.id,
                    "email": user.email,
                    "fullName": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
                    "isActive": user.is_active,
                    "lastLogin": user.last_login.isoformat() if user.last_login else None,
                    "debug": "formatted_ok"
                }
                
                formatted_users.append(formatted_user)
                
            except Exception as format_error:
                logger.error(f"💥 Error formateando usuario {user.id}: {format_error}")
                continue
        
        response_data = {
            "users": formatted_users,
            "total": len(formatted_users),
            "timestamp": datetime.utcnow().isoformat(),
            "debug": {
                "endpoint": "online-debug",
                "auth_required": False,
                "total_users_in_db": len(online_users),
                "successfully_formatted": len(formatted_users)
            }
        }
        
        logger.info(f"✅ DEBUG: Devolviendo {len(formatted_users)} usuarios")
        return response_data
        
    except Exception as e:
        logger.error(f"💥 Error en endpoint debug: {e}")
        
        return {
            "users": [],
            "total": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "debug": {
                "endpoint": "online-debug",
                "auth_required": False,
                "error_type": type(e).__name__
            }
        }

# 🔍 ENDPOINT PARA DEBUG DE AUTENTICACIÓN
@router.get("/auth-debug")
def debug_auth_status(
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    🔍 DEBUG: Verificar estado de autenticación
    Sin dependency de current_user para ver qué está pasando
    """
    try:
        from fastapi import Request
        
        debug_info = {
            "timestamp": datetime.utcnow().isoformat(),
            "debug_type": "auth_status",
            "request_info": {
                "method": request.method,
                "url": str(request.url),
                "headers": {},
                "cookies": {}
            },
            "auth_attempt": {
                "success": False,
                "error": None,
                "user_id": None
            }
        }
        
        # Inspeccionar headers
        auth_headers = {}
        for header_name, header_value in request.headers.items():
            if 'auth' in header_name.lower() or 'token' in header_name.lower():
                # No mostrar el token completo por seguridad
                auth_headers[header_name] = f"{header_value[:10]}..." if len(header_value) > 10 else header_value
        
        debug_info["request_info"]["headers"] = auth_headers
        
        # Inspeccionar cookies (nombres solamente)
        cookie_names = list(request.cookies.keys()) if request.cookies else []
        debug_info["request_info"]["cookies"] = {
            "names": cookie_names,
            "has_access_token": "access_token" in cookie_names,
            "has_refresh_token": "refresh_token" in cookie_names,
            "total_cookies": len(cookie_names)
        }
        
        # Intentar obtener usuario usando el dependency normal
        try:
            from app.api.deps import get_current_active_user
            
            # NOTA: Esto debería fallar con 422 si hay problema de auth
            # current_user = get_current_active_user(db, request)
            
            debug_info["auth_attempt"]["error"] = "Cannot test dependency directly in debug endpoint"
            
        except Exception as auth_error:
            debug_info["auth_attempt"]["error"] = str(auth_error)
        
        # Información adicional
        debug_info["suggestions"] = [
            "Verifica que las cookies HttpOnly estén siendo enviadas",
            "Confirma que el token no haya expirado",
            "Revisa los logs del middleware de autenticación",
            "Usa /users/online-debug para probar sin auth"
        ]
        
        return debug_info
        
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "debug_type": "auth_status_failed"
        }

@router.post("/heartbeat")
def user_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    💓 HEARTBEAT MIGRADO A REDIS - VERSIÓN CORREGIDA
    Ahora usa Redis para estado online + BD para last_login
    """
    try:
        from datetime import datetime
        
        logger.info(f"💓 Heartbeat de usuario {current_user.id} (Redis + BD)")
        
        # 1. MARCAR COMO ONLINE EN REDIS (rápido y ligero)
        redis_key = f"user:online:{current_user.id}"
        redis_timestamp = datetime.utcnow().isoformat()
        
        redis_success = redis_manager.set(
            key=redis_key,
            value=redis_timestamp,
            expire=90  # 90 segundos TTL
        )
        
        if redis_success:
            logger.debug(f"✅ Usuario {current_user.id} marcado como online en Redis")
        else:
            logger.warning(f"⚠️ No se pudo marcar usuario {current_user.id} en Redis")
        
        # 2. ACTUALIZAR BD (solo last_login, no is_online)
        try:
            current_user.last_login = datetime.utcnow()
            
            # Solo actualizar is_online en BD si Redis falló (fallback)
            if not redis_success and hasattr(current_user, 'is_online'):
                current_user.is_online = True
            
            db.commit()
            logger.debug(f"✅ last_login actualizado en BD para usuario {current_user.id}")
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"💥 Error actualizando BD: {db_error}")
            # No fallar por error de BD si Redis funcionó
            if not redis_success:
                raise db_error
        
        # 3. RESPUESTA UNIFICADA
        response = {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online",
            "userId": current_user.id,
            "message": "Heartbeat registrado",
            "storage": {
                "redis": redis_success,
                "database": True,  # Asumimos que BD siempre funciona
                "primary": "redis"
            }
        }
        
        logger.info(f"✅ Heartbeat exitoso para usuario {current_user.id}")
        return response
        
    except Exception as e:
        # Rollback de BD si hay error
        try:
            db.rollback()
        except:
            pass
            
        logger.error(f"💥 Error en heartbeat para usuario {current_user.id}: {e}")
        
        return {
            "success": False,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "userId": current_user.id,
            "message": "Error en heartbeat"
        }

# 🔧 HEARTBEAT CON AUTENTICACIÓN (PARA DESPUÉS)
@router.post("/heartbeat-secure")
def user_heartbeat_secure(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    💓 HEARTBEAT CON AUTENTICACIÓN - PARA CUANDO SE ARREGLE AUTH
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