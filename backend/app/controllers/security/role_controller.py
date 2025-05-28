# ===== backend/app/controllers/security/role_controller.py =====
"""
Lógica de control pura, independiente de FastAPI
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.security.role_service import RoleService
from app.schemas.security.roles import RoleCreate, RoleUpdate, RoleInDB, RoleWithPermissions
from app.models.auth.roles import Role

logger = logging.getLogger(__name__)

class RoleController:
    """
    Controlador para operaciones de roles
    Separa la lógica de negocio del routing de FastAPI
    """
    
    @staticmethod
    def get_roles_list(db: Session, skip: int = 0, limit: int = 100, current_user = None) -> List[RoleInDB]:
        """
        Obtiene lista de roles con validaciones
        """
        try:
            logger.info(f"👥 Obteniendo roles (skip={skip}, limit={limit}) por {current_user.email if current_user else 'unknown'}")
            
            roles = RoleService.get_roles(db, skip, limit)
            
            logger.info(f"✅ {len(roles)} roles obtenidos exitosamente")
            return roles
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo roles: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener roles"
            )
    
    @staticmethod
    def create_new_role(db: Session, role_data: RoleCreate, current_user) -> RoleInDB:
        """
        Crea un nuevo rol con validaciones
        """
        try:
            logger.info(f"🔐 Creando rol: {role_data.name} por {current_user.email}")
            
            # Validaciones adicionales del controller
            if not role_data.name or not role_data.name.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del rol es obligatorio"
                )
            
            # Convertir Pydantic model a dict
            role_dict = role_data.dict()
            
            # Crear rol usando el servicio
            new_role = RoleService.create_role(db, role_dict)
            
            logger.info(f"✅ Rol creado exitosamente: {new_role.name} (ID: {new_role.id})")
            return new_role
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error creando rol: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear rol"
            )
    
    @staticmethod
    def get_role_by_id(db: Session, role_id: int, current_user, include_permissions: bool = True) -> RoleWithPermissions:
        """
        Obtiene rol por ID con permisos incluidos
        """
        try:
            logger.info(f"🔍 Obteniendo rol ID {role_id} por {current_user.email}")
            
            if include_permissions:
                role_db = RoleService.get_role_with_permissions(db, role_id)
                
                # Transformar a formato de respuesta
                role_response = {
                    "id": role_db.id,
                    "name": role_db.name,
                    "description": role_db.description,
                    "permissions": [permission.name for permission in role_db.permissions] if role_db.permissions else []
                }
                
                logger.info(f"✅ Rol obtenido: {role_db.name} con {len(role_response['permissions'])} permisos")
                return role_response
            else:
                role = RoleService.get_role_by_id(db, role_id)
                logger.info(f"✅ Rol obtenido: {role.name}")
                return role
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo rol {role_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener rol"
            )
    
    @staticmethod
    def update_role(db: Session, role_id: int, role_data: RoleUpdate, current_user) -> RoleInDB:
        """
        Actualiza rol con validaciones
        """
        try:
            logger.info(f"📝 Actualizando rol ID {role_id} por {current_user.email}")
            
            # Convertir a dict excluyendo campos no establecidos
            role_dict = role_data.dict(exclude_unset=True)
            
            if not role_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay datos para actualizar"
                )
            
            # Validación adicional para nombres vacíos
            if "name" in role_dict and (not role_dict["name"] or not role_dict["name"].strip()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del rol no puede estar vacío"
                )
            
            # Actualizar rol usando el servicio
            updated_role = RoleService.update_role(db, role_id, role_dict)
            
            logger.info(f"✅ Rol actualizado: {updated_role.name}")
            return updated_role
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error actualizando rol {role_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar rol"
            )
    
    @staticmethod
    def delete_role(db: Session, role_id: int, current_user) -> RoleInDB:
        """
        Elimina rol con validaciones
        """
        try:
            logger.info(f"🗑️ Eliminando rol ID {role_id} por {current_user.email}")
            
            # Validaciones adicionales del controller
            # Verificar si es un rol del sistema que no se debe eliminar
            role = RoleService.get_role_by_id(db, role_id)
            
            if role.name in ["ADMIN", "SUPER_ADMIN", "SYSTEM"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede eliminar un rol del sistema"
                )
            
            deleted_role = RoleService.delete_role(db, role_id)
            
            logger.info(f"✅ Rol eliminado: {deleted_role.name}")
            return deleted_role
            
        except HTTPException:
            # Re-lanzar excepciones del servicio o del controller
            raise
        except Exception as e:
            logger.error(f"💥 Error eliminando rol {role_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar rol"
            )
    
    @staticmethod
    def assign_permissions_to_role(db: Session, role_id: int, permission_ids: List[int], current_user) -> Dict[str, str]:
        """
        Asigna permisos a un rol
        """
        try:
            logger.info(f"🔗 Asignando {len(permission_ids)} permisos al rol ID {role_id} por {current_user.email}")
            
            # Validaciones del controller
            if not permission_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Debe proporcionar al menos un permiso"
                )
            
            # Verificar que todos los IDs sean válidos
            if any(pid <= 0 for pid in permission_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Todos los IDs de permisos deben ser números positivos"
                )
            
            success = RoleService.assign_permissions(db, role_id, permission_ids)
            
            if success:
                logger.info(f"✅ Permisos asignados exitosamente al rol ID {role_id}")
                return {"message": "Permisos asignados exitosamente"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al asignar permisos"
                )
                
        except HTTPException:
            # Re-lanzar excepciones del servicio o del controller
            raise
        except Exception as e:
            logger.error(f"💥 Error asignando permisos al rol {role_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar permisos"
            )