# app/api/v1/users.py
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form, Path
import os
import shutil
from pathlib import Path as FilePath
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from sqlalchemy import text, insert

from app.database import get_db
from app.models.auth.users import User
from app.models.associations import user_roles
from app.models.auth.roles import Role
from app.models.organization.areas import Area
from app.schemas.auth.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.services.user_service import UserService
from app.utils.error_handler import ErrorHandler
from app.utils.user_transforms import transform_user_with_roles
from app.api.deps import (
    get_current_user, 
    get_current_active_superuser, 
    get_current_active_user,
    has_permission,
    has_any_permission,
    is_self_or_has_permission
)

router = APIRouter()

@router.get("/me", response_model=UserWithRoles)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene el usuario actualmente autenticado
    """
    return transform_user_with_roles(current_user)

@router.patch("/me", response_model=UserInDB)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(has_permission("profile_edit"))
) -> Any:
    """
    Actualiza información del usuario actual
    """
    try:
        updated_user = UserService.update_user(
            db=Depends(get_db),
            user_id=current_user.id,
            user_data=user_data.dict(exclude_unset=True)
        )
        return updated_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "usuario")

@router.get("/", response_model=List[UserWithRoles])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """
    Obtiene lista de usuarios (requiere permiso user_view)
    """
    try:
        users = UserService.get_users(db=db, skip=skip, limit=limit)
        return [transform_user_with_roles(user) for user in users]
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "usuarios")

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_create"))
) -> Any:
    """
    Crea un nuevo usuario (requiere permiso user_create)
    """
    try:
        # Extraer los datos básicos de usuario
        user_data = user_in.dict(exclude={"roleId", "areaId"})
        
        # Crear el usuario
        new_user = UserService.create_user(db=db, user_data=user_data)
        
        # Si se proporcionaron roleId y areaId, asignar el rol
        if hasattr(user_in, "roleId") and hasattr(user_in, "areaId") and user_in.roleId and user_in.areaId:
            try:
                UserService.assign_role(
                    db=db,
                    user_id=new_user.id,
                    role_id=int(user_in.roleId),
                    area_id=int(user_in.areaId)
                )
            except Exception as role_error:
                # Logear el error pero continuar
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al asignar rol: {str(role_error)}")
        
        return new_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "usuario")


@router.get("/{user_id}", response_model=UserWithRoles)
def read_user_by_id(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_view"))
) -> Any:
    """
    Obtiene un usuario por ID (propio usuario o requiere permiso user_view)
    """
    try:
        user = UserService.get_user_by_id(db=db, user_id=user_id)
        return transform_user_with_roles(user)
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "usuario")

@router.patch("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int = Path(..., title="ID del usuario"),
    user_data: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_edit"))
) -> Any:
    """
    Actualiza información de un usuario (propio usuario o requiere permiso user_edit)
    """
    try:
        # Si es el propio usuario, solo permitir actualizar ciertos campos
        if current_user.id == user_id and not any(role.name == "ADMIN" for role in current_user.roles):
            # Filtrar campos que el usuario normal puede actualizar de sí mismo
            allowed_fields = ["firstName", "lastName", "phone", "birth_date", "profile_image", "banner_image"]
            filtered_data = {k: v for k, v in user_data.dict(exclude_unset=True).items() if k in allowed_fields}
            
            if not filtered_data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para actualizar estos campos"
                )
            
            user_data = UserUpdate(**filtered_data)
        
        updated_user = UserService.update_user(
            db=db,
            user_id=user_id,
            user_data=user_data.dict(exclude_unset=True)
        )
        return updated_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "usuario")

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_delete"))
) -> Any:
    """
    Elimina un usuario (requiere permiso user_delete)
    """
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propio usuario"
            )
            
        deleted_user = UserService.delete_user(db=db, user_id=user_id)
        return deleted_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "usuario")

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    user_id: int = Path(..., title="ID del usuario"),
    roleId: str = Body(...),
    areaId: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_edit"))
) -> Any:
    """
    Asigna un rol a un usuario (requiere permiso user_edit)
    """
    try:
        # Primero obtener el usuario para poder usar full_name en la respuesta
        user = UserService.get_user_by_id(db=db, user_id=user_id)
        
        success = UserService.assign_role(
            db=db,
            user_id=user_id,
            role_id=int(roleId),
            area_id=int(areaId)
        )
        
        if success:
            return {"message": f"Rol asignado exitosamente al usuario {UserService.get_full_name(user)}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar rol"
            )
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "asignar rol a", "usuario")

# Agregar al final del archivo users.py

@router.post("/upload-image", status_code=status.HTTP_200_OK)
def upload_user_image(
    file: UploadFile = File(...),
    type: str = Form(...),
    current_user: User = Depends(get_current_active_user),  # ✅ Cambio: más permisivo
    db: Session = Depends(get_db)
) -> Any:
    """
    Sube una imagen de perfil o banner para el usuario
    ✅ CORREGIDO: Crear directorio si no existe
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"📤 Subiendo imagen tipo '{type}' para usuario {current_user.id}")
        logger.info(f"📄 Archivo: {file.filename}, Content-Type: {file.content_type}")
        
        # Verificar el tipo de archivo
        content_type = file.content_type
        if not content_type or not content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser una imagen"
            )
        
        # Obtener extensión del archivo
        extension = os.path.splitext(file.filename)[1] if file.filename else ""
        if not extension:
            # Si no hay extensión, asignar una basada en el tipo de contenido
            if content_type == "image/jpeg":
                extension = ".jpg"
            elif content_type == "image/png":
                extension = ".png"
            else:
                extension = ".jpg"  # Por defecto
        
        # Crear un nombre único para el archivo
        filename = f"{uuid4().hex}{extension}"
        
        # ✅ CREAR DIRECTORIO DE UPLOADS SI NO EXISTE
        upload_dir = FilePath("static/uploads/users")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Ruta completa del archivo
        file_path = upload_dir / filename
        
        logger.info(f"💾 Guardando archivo en: {file_path.absolute()}")
        
        # Guardar el archivo
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verificar que el archivo se guardó correctamente
        if not file_path.exists():
            logger.error(f"❌ El archivo no se guardó correctamente: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar el archivo"
            )
        
        file_size = file_path.stat().st_size
        logger.info(f"✅ Archivo guardado exitosamente: {filename} ({file_size} bytes)")
        
        # URL pública del archivo
        public_url = f"/static/uploads/users/{filename}"
        
        logger.info(f"🔗 URL pública: {public_url}")
        
        # Actualizar el campo correspondiente en el usuario
        user_data = {}
        if type == "profile":
            user_data["profile_image"] = public_url
        elif type == "banner":
            user_data["banner_image"] = public_url
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de imagen no válido"
            )
        
        # Actualizar el usuario
        updated_user = UserService.update_user(
            db=db,
            user_id=current_user.id,
            user_data=user_data
        )
        
        logger.info(f"✅ Usuario actualizado con nueva imagen {type}")
        
        return {"url": public_url}
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"💥 Error al subir imagen: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir la imagen: {str(e)}"
        )

@router.get("/me/permissions", response_model=List[str])
def get_current_user_permissions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene los permisos del usuario actualmente autenticado
    """
    try:
        # Extraer los permisos de todos los roles del usuario
        permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                if permission.name not in permissions:
                    permissions.append(permission.name)
        
        return permissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener permisos: {str(e)}"
        )