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

from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
from app.schemas.auth.users import (
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
        """
        Obtiene información del usuario actual con roles
        """
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
        """
        Obtiene lista de usuarios con roles
        """
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