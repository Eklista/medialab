# backend/app/controllers/users/user_controller.py
"""
🆕 CONTROLADOR DE USUARIOS
Lógica de control pura, independiente de FastAPI
"""

from typing import List, Any, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from pathlib import Path
import shutil
import logging
from uuid import uuid4
import os

from app.services.users.user_service import UserService
from app.repositories.users.user_repository import UserRepository
from app.schemas.users.users import (
    UserCreate, UserUpdate, UserInDB, UserWithRoles
)
from app.utils.user_transforms import transform_user_with_roles

logger = logging.getLogger(__name__)

class UserController:
    """
    Controlador para operaciones de usuarios
    Separa la lógica de negocio del routing de FastAPI
    """
    
    # ===== OPERACIONES CRUD =====
    
    @staticmethod
    def get_current_user_info(current_user) -> UserWithRoles:
        """Obtiene información del usuario actual con roles"""
        try:
            return transform_user_with_roles(current_user)
        except Exception as e:
            logger.error(f"💥 Error obteniendo info del usuario {current_user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener información del usuario"
            )
    
    @staticmethod
    def get_users_list(db: Session, skip: int = 0, limit: int = 100) -> List[UserWithRoles]:
        """Obtiene lista de usuarios con roles"""
        try:
            users = UserService.get_users(db, skip, limit)
            return [transform_user_with_roles(user) for user in users]
        except Exception as e:
            logger.error(f"💥 Error obteniendo lista de usuarios: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener usuarios"
            )

    @staticmethod
    def get_users_list_formatted(db: Session, skip: int = 0, limit: int = 100, format_type: str = "with_roles") -> List[Dict[str, Any]]:
        """
        🎯 ENDPOINT FORMATTED IMPLEMENTADO
        Permite elegir el nivel de detalle necesario
        """
        try:
            logger.info(f"📋 Obteniendo usuarios formateados: {format_type}")
            
            # Obtener usuarios base
            users = UserService.get_users(db, skip, limit)
            
            # Formatear según el tipo solicitado
            formatted_users = []
            for user in users:
                if format_type == "basic":
                    formatted_user = UserController._format_user_basic(user)
                elif format_type == "detailed":
                    formatted_user = UserController._format_user_detailed(user)
                elif format_type == "with_roles":
                    formatted_user = UserController._format_user_with_roles(user)
                elif format_type == "complete":
                    formatted_user = UserController._format_user_complete(user)
                elif format_type == "active_menu":
                    formatted_user = UserController._format_user_active_menu(user)
                else:
                    # Default: with_roles
                    formatted_user = UserController._format_user_with_roles(user)
                
                formatted_users.append(formatted_user)
            
            logger.info(f"✅ Devolviendo {len(formatted_users)} usuarios formateados")
            return formatted_users
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuarios formateados: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener usuarios formateados: {str(e)}"
            )
    
    @staticmethod
    def get_active_users_for_menu(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        """
        🎯 USUARIOS ACTIVOS PARA MENÚ/SIDEBAR
        Optimizado para mostrar en interfaces de usuario
        """
        try:
            from sqlalchemy import and_, or_
            from datetime import datetime, timedelta
            from app.models.auth.users import User
            
            logger.info(f"👥 Obteniendo {limit} usuarios activos para menú")
            
            # Obtener usuarios activos (online + recientemente activos)
            recent_threshold = datetime.utcnow() - timedelta(minutes=30)
            
            users = db.query(User).filter(
                User.is_active == True,
                or_(
                    User.is_online == True,
                    and_(
                        User.is_online == False,
                        User.last_login >= recent_threshold
                    )
                )
            ).order_by(
                User.is_online.desc(),
                User.last_login.desc()
            ).limit(limit).all()
            
            # Formatear para menú
            menu_users = []
            for user in users:
                menu_user = UserController._format_user_active_menu(user)
                menu_users.append(menu_user)
            
            logger.info(f"✅ Devolviendo {len(menu_users)} usuarios activos")
            return menu_users
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuarios activos para menú: {e}")
            return []
    
    @staticmethod
    def get_current_user_info_enhanced(current_user) -> Dict[str, Any]:
        """
        🎯 PERFIL COMPLETO MEJORADO PARA FRONTEND
        Incluye todo lo que el frontend necesita
        """
        try:
            logger.info(f"🎯 Obteniendo perfil enhanced para {current_user.email}")
            
            # Obtener info básica con roles
            base_info = transform_user_with_roles(current_user)
            
            # Enhancer con información adicional
            enhanced_info = UserController._format_user_complete(current_user)
            
            logger.info("✅ Perfil enhanced generado")
            return enhanced_info
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo perfil enhanced: {e}")
            # Fallback al método original
            return transform_user_with_roles(current_user)

    # ===== MÉTODOS DE FORMATEO PRIVADOS =====
    
    @staticmethod
    def _format_user_basic(user) -> Dict[str, Any]:
        """Formato básico mínimo"""
        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name or "",
            "lastName": user.last_name or "",
            "fullName": UserController._get_full_name(user),
            "isActive": user.is_active
        }
    
    @staticmethod
    def _format_user_detailed(user) -> Dict[str, Any]:
        """Formato detallado sin roles"""
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username or "",
            "firstName": user.first_name or "",
            "lastName": user.last_name or "",
            "fullName": UserController._get_full_name(user),
            "initials": UserController._get_initials(user),
            "profileImage": user.profile_image,
            "bannerImage": user.banner_image,
            "phone": user.phone or "",
            "birthDate": str(user.birth_date) if user.birth_date else None,
            "joinDate": str(user.join_date) if user.join_date else None,
            "lastLogin": str(user.last_login) if user.last_login else None,
            "isActive": user.is_active,
            "isOnline": getattr(user, 'is_online', False)
        }
    
    @staticmethod
    def _format_user_with_roles(user) -> Dict[str, Any]:
        """Formato con roles y áreas"""
        base = UserController._format_user_detailed(user)
        
        # Agregar roles
        roles = []
        areas = []
        role_display = "Sin rol"
        area_display = "Sin área"
        
        if hasattr(user, 'roles') and user.roles:
            roles = [role.name for role in user.roles]
            role_display = ", ".join(roles) if roles else "Sin rol"
            
            # Obtener áreas de los roles
            for role in user.roles:
                if hasattr(role, 'area') and role.area:
                    area_info = {
                        "id": role.area.id,
                        "name": role.area.name
                    }
                    if area_info not in areas:
                        areas.append(area_info)
            
            area_display = ", ".join([area["name"] for area in areas]) if areas else "Sin área"
        
        base.update({
            "roles": roles,
            "areas": areas,
            "roleDisplay": role_display,
            "areaDisplay": area_display,
            "status": "online" if getattr(user, 'is_online', False) else ("offline" if user.is_active else "inactive")
        })
        
        return base
    
    @staticmethod
    def _format_user_complete(user) -> Dict[str, Any]:
        """Formato completo con toda la información"""
        base = UserController._format_user_with_roles(user)
        
        # Agregar estadísticas y información adicional
        stats = {
            "profileCompletion": UserController._calculate_profile_completion(user),
            "accountAgeDays": UserController._calculate_account_age(user),
            "totalLogins": getattr(user, 'login_count', 0)
        }
        
        display = {
            "fullName": base["fullName"],
            "initials": base["initials"],
            "avatarUrl": UserController._get_avatar_url(user),
            "roleBadge": base["roleDisplay"],
            "areaBadge": base["areaDisplay"]
        }
        
        base.update({
            "stats": stats,
            "display": display
        })
        
        return base
    
    @staticmethod
    def _format_user_active_menu(user) -> Dict[str, Any]:
        """Formato optimizado para menús y sidebars"""
        return {
            "id": user.id,
            "fullName": UserController._get_full_name(user),
            "initials": UserController._get_initials(user),
            "email": user.email,
            "profileImage": user.profile_image,
            "isOnline": getattr(user, 'is_online', False),
            "status": "online" if getattr(user, 'is_online', False) else "away",
            "lastSeen": str(user.last_login) if user.last_login else None
        }
    
    # ===== MÉTODOS AUXILIARES =====
    
    @staticmethod
    def _get_full_name(user) -> str:
        """Obtiene nombre completo del usuario"""
        first_name = user.first_name or ""
        last_name = user.last_name or ""
        
        if first_name and last_name:
            return f"{first_name} {last_name}"
        elif first_name:
            return first_name
        elif last_name:
            return last_name
        else:
            return user.email.split('@')[0] if user.email else "Usuario"
    
    @staticmethod
    def _get_initials(user) -> str:
        """Obtiene iniciales del usuario"""
        first_name = user.first_name or ""
        last_name = user.last_name or ""
        
        if first_name and last_name:
            return f"{first_name[0]}{last_name[0]}".upper()
        elif first_name:
            return first_name[0].upper()
        elif user.email:
            return user.email[0].upper()
        else:
            return "U"
    
    @staticmethod
    def _get_avatar_url(user) -> str:
        """Obtiene URL del avatar"""
        if user.profile_image:
            return user.profile_image
        
        # Generar avatar con iniciales
        initials = UserController._get_initials(user)
        return f"https://ui-avatars.com/api/?name={initials}&size=80&background=6366f1&color=ffffff&bold=true"
    
    @staticmethod
    def _calculate_profile_completion(user) -> int:
        """Calcula el porcentaje de completitud del perfil"""
        fields = [
            user.first_name,
            user.last_name,
            user.phone,
            user.birth_date,
            user.profile_image
        ]
        
        completed = sum(1 for field in fields if field)
        return int((completed / len(fields)) * 100)
    
    @staticmethod
    def _calculate_account_age(user) -> int:
        """Calcula la edad de la cuenta en días"""
        if not user.join_date:
            return 0
        
        from datetime import datetime
        now = datetime.utcnow()
        join_date = user.join_date if isinstance(user.join_date, datetime) else datetime.fromisoformat(str(user.join_date))
        
        return (now - join_date).days

    @staticmethod
    def create_new_user(db: Session, user_data: UserCreate, current_user) -> UserInDB:
        """
        Crea un nuevo usuario con validaciones
        """
        try:
            logger.info(f"👤 Creando usuario: {user_data.email} por {current_user.email}")
            
            # Extraer datos básicos de usuario
            user_dict = user_data.dict(exclude={"roleId", "areaId"})
            
            # Crear el usuario usando el servicio
            new_user = UserService.create_user(db, user_dict)
            
            # Si se proporcionaron roleId y areaId, asignar el rol
            if hasattr(user_data, "roleId") and hasattr(user_data, "areaId"):
                if user_data.roleId and user_data.areaId:
                    try:
                        UserService.assign_role(
                            db=db,
                            user_id=new_user.id,
                            role_id=int(user_data.roleId),
                            area_id=int(user_data.areaId)
                        )
                        logger.info(f"✅ Rol asignado al usuario {new_user.email}")
                    except Exception as role_error:
                        logger.warning(f"⚠️ Error asignando rol: {role_error}")
            
            logger.info(f"✅ Usuario creado exitosamente: {new_user.email}")
            return new_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error creando usuario: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario"
            )
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int, current_user) -> UserWithRoles:
        """
        Obtiene usuario por ID con validación de permisos
        """
        try:
            # Si no es admin y no es el propio usuario, verificar permisos
            is_admin = any(role.name == "ADMIN" for role in current_user.roles)
            is_self = current_user.id == user_id
            
            if not is_admin and not is_self:
                logger.warning(f"⚠️ Usuario {current_user.email} intentó acceder a usuario {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para ver este usuario"
                )
            
            user = UserService.get_user_by_id(db, user_id)
            return transform_user_with_roles(user)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuario {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener usuario"
            )
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate, current_user) -> UserInDB:
        """
        Actualiza usuario con validación de permisos
        """
        try:
            # Validar permisos
            is_admin = any(role.name == "ADMIN" for role in current_user.roles)
            is_self = current_user.id == user_id
            
            # Si es el propio usuario y no es admin, filtrar campos permitidos
            if is_self and not is_admin:
                allowed_fields = ["first_name", "last_name", "phone", "birth_date", "profile_image", "banner_image"]
                filtered_data = {
                    k: v for k, v in user_data.dict(exclude_unset=True).items() 
                    if k in allowed_fields
                }
                
                if not filtered_data:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permisos para actualizar estos campos"
                    )
                
                user_data_dict = filtered_data
            else:
                if not is_admin:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permisos para actualizar otros usuarios"
                    )
                user_data_dict = user_data.dict(exclude_unset=True)
            
            # Actualizar usuario
            updated_user = UserService.update_user(db, user_id, user_data_dict)
            
            logger.info(f"✅ Usuario actualizado: {updated_user.email} por {current_user.email}")
            return updated_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error actualizando usuario {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar usuario"
            )
    
    @staticmethod
    def delete_user(db: Session, user_id: int, current_user) -> UserInDB:
        """
        Elimina usuario con validaciones
        """
        try:
            if user_id == current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes eliminar tu propio usuario"
                )
            
            deleted_user = UserService.delete_user(db, user_id)
            
            logger.info(f"✅ Usuario eliminado: {deleted_user.email} por {current_user.email}")
            return deleted_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error eliminando usuario {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar usuario"
            )
    
    # ===== GESTIÓN DE ROLES =====
    
    @staticmethod
    def assign_role_to_user(db: Session, user_id: int, role_id: str, area_id: str, current_user) -> Dict[str, str]:
        """
        Asigna rol a usuario
        """
        try:
            # Obtener el usuario para usar nombre completo en respuesta
            user = UserService.get_user_by_id(db, user_id)
            
            success = UserService.assign_role(
                db=db,
                user_id=user_id,
                role_id=int(role_id),
                area_id=int(area_id)
            )
            
            if success:
                full_name = UserService.get_full_name(user)
                logger.info(f"✅ Rol asignado a usuario: {user.email} por {current_user.email}")
                return {"message": f"Rol asignado exitosamente al usuario {full_name}"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al asignar rol"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error asignando rol: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar rol"
            )
    
    # ===== GESTIÓN DE IMÁGENES =====
    
    @staticmethod
    def upload_user_image(db: Session, file: UploadFile, image_type: str, current_user) -> Dict[str, str]:
        """
        Sube imagen de perfil o banner para el usuario
        MEJORADO: Mejor validación y manejo de errores
        """
        try:
            logger.info(f"📤 Subiendo imagen {image_type} para usuario {current_user.id}")
            logger.info(f"📄 Archivo: {file.filename}, Content-Type: {file.content_type}")
            
            # Validar tipo de archivo
            if not file.content_type or not file.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El archivo debe ser una imagen"
                )
            
            # Validar tamaño (máximo 5MB)
            if hasattr(file, 'size') and file.size > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La imagen es demasiado grande (máximo 5MB)"
                )
            
            # Obtener extensión del archivo
            extension = UserController._get_file_extension(file.filename, file.content_type)
            
            # Crear nombre único para el archivo
            filename = f"{uuid4().hex}{extension}"
            
            # Crear directorio si no existe
            upload_dir = Path("static/uploads/users")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Ruta completa del archivo
            file_path = upload_dir / filename
            
            logger.info(f"💾 Guardando archivo en: {file_path.absolute()}")
            
            # Guardar el archivo
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Verificar que se guardó correctamente
            if not file_path.exists():
                logger.error(f"❌ El archivo no se guardó: {file_path}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al guardar el archivo"
                )
            
            file_size = file_path.stat().st_size
            logger.info(f"✅ Archivo guardado: {filename} ({file_size} bytes)")
            
            # URL pública del archivo
            public_url = f"/static/uploads/users/{filename}"
            
            # Actualizar campo correspondiente en el usuario
            user_data = {}
            if image_type == "profile":
                user_data["profile_image"] = public_url
            elif image_type == "banner":
                user_data["banner_image"] = public_url
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tipo de imagen no válido (profile/banner)"
                )
            
            # Actualizar usuario
            UserService.update_user(db, current_user.id, user_data)
            
            logger.info(f"✅ Usuario actualizado con nueva imagen {image_type}")
            
            return {"url": public_url}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error subiendo imagen: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al subir la imagen: {str(e)}"
            )
    
    @staticmethod
    def get_user_permissions(current_user) -> List[str]:
        """
        Obtiene permisos del usuario actual
        """
        try:
            permissions = []
            for role in current_user.roles:
                for permission in role.permissions:
                    if permission.name not in permissions:
                        permissions.append(permission.name)
            
            return permissions
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo permisos de {current_user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener permisos del usuario"
            )
    
    # ===== MÉTODOS AUXILIARES =====
    
    @staticmethod
    def _get_file_extension(filename: Optional[str], content_type: str) -> str:
        """
        Obtiene extensión de archivo de forma robusta
        """
        # Primero intentar desde el nombre de archivo
        if filename:
            extension = os.path.splitext(filename)[1]
            if extension:
                return extension
        
        # Fallback basado en content-type
        content_type_extensions = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg", 
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp"
        }
        
        return content_type_extensions.get(content_type, ".jpg")
    
    @staticmethod
    def validate_user_access(current_user, target_user_id: int, required_permission: str = None) -> bool:
        """
        Valida si el usuario tiene acceso a otro usuario
        """
        # Admin siempre tiene acceso
        if any(role.name == "ADMIN" for role in current_user.roles):
            return True
        
        # Acceso a sí mismo
        if current_user.id == target_user_id:
            return True
        
        # Verificar permiso específico si se proporciona
        if required_permission:
            user_permissions = UserController.get_user_permissions(current_user)
            return required_permission in user_permissions
        
        return False

    # ===== NUEVAS FUNCIONES PARA FORMATEAR USUARIOS =====
    @staticmethod
    def get_current_user_info_enhanced(current_user) -> Dict[str, Any]:
        """
        🆕 VERSIÓN MEJORADA del get_current_user_info
        Para frontend que necesite datos completos
        """
        try:
            from app.utils.user_formatters import UserFormatter
            return UserFormatter.format_for_frontend_complete(current_user)
        except Exception as e:
            logger.error(f"💥 Error obteniendo info enhanced del usuario: {e}")
            # Fallback al método original
            return UserController.get_current_user_info(current_user)

    @staticmethod
    def get_users_list_formatted(db: Session, skip: int = 0, limit: int = 100, format_type: str = "with_roles") -> List[Dict[str, Any]]:
        """
        🆕 LISTA DE USUARIOS CON FORMATO ESPECÍFICO
        """
        try:
            from app.utils.user_formatters import UserFormatter
            users = UserService.get_users(db, skip, limit)
            return UserFormatter.format_list_for_frontend(users, format_type)
        except Exception as e:
            logger.error(f"💥 Error obteniendo lista formateada: {e}")
            # Fallback al método original
            users = UserService.get_users(db, skip, limit)
            from app.utils.user_transforms import transform_user_with_roles
            return [transform_user_with_roles(user) for user in users]

    @staticmethod
    def get_active_users_for_menu(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        """
        🆕 USUARIOS ACTIVOS PARA MENÚ/SIDEBAR
        """
        try:
            from app.utils.user_formatters import UserFormatter
            from sqlalchemy import and_, or_
            from datetime import datetime, timedelta
            
            # Obtener usuarios activos (online + recientemente activos)
            recent_threshold = datetime.utcnow() - timedelta(minutes=30)
            
            users = db.query(User).filter(
                User.is_active == True,
                or_(
                    User.is_online == True,
                    and_(
                        User.is_online == False,
                        User.last_login >= recent_threshold
                    )
                )
            ).order_by(
                User.is_online.desc(),
                User.last_login.desc()
            ).limit(limit).all()
            
            return UserFormatter.format_list_for_frontend(users, "active_menu")
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuarios activos para menú: {e}")
            return []