# ===== backend/app/controllers/organization/area_controller.py =====
"""
Lógica de control pura, independiente de FastAPI
"""

import logging
from typing import List

from app.models.organization.areas import Area
from app.schemas.organization.areas import AreaCreate, AreaUpdate, AreaInDB
from app.services.organization.area_service import AreaService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AreaController:
    """
    Controlador para operaciones de áreas
    Separa la lógica de negocio del routing de FastAPI
    """
    
    @staticmethod
    def get_areas_list(db: Session, skip: int = 0, limit: int = 100, current_user = None) -> List[AreaInDB]:
        """
        Obtiene lista de áreas con validaciones
        """
        try:
            logger.info(f"📋 Obteniendo áreas (skip={skip}, limit={limit}) por {current_user.email if current_user else 'unknown'}")
            
            areas = AreaService.get_areas(db, skip, limit)
            
            logger.info(f"✅ {len(areas)} áreas obtenidas exitosamente")
            return areas
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo áreas: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener áreas"
            )
    
    @staticmethod
    def create_new_area(db: Session, area_data: AreaCreate, current_user) -> AreaInDB:
        """
        Crea una nueva área con validaciones
        """
        try:
            logger.info(f"🏢 Creando área: {area_data.name} por {current_user.email}")
            
            # Convertir Pydantic model a dict
            area_dict = area_data.dict()
            
            # Crear área usando el servicio
            new_area = AreaService.create_area(db, area_dict)
            
            logger.info(f"✅ Área creada exitosamente: {new_area.name} (ID: {new_area.id})")
            return new_area
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error creando área: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear área"
            )
    
    @staticmethod
    def get_area_by_id(db: Session, area_id: int, current_user) -> AreaInDB:
        """
        Obtiene área por ID con validaciones
        """
        try:
            logger.info(f"🔍 Obteniendo área ID {area_id} por {current_user.email}")
            
            area = AreaService.get_area_by_id(db, area_id)
            
            logger.info(f"✅ Área obtenida: {area.name}")
            return area
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo área {area_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener área"
            )
    
    @staticmethod
    def update_area(db: Session, area_id: int, area_data: AreaUpdate, current_user) -> AreaInDB:
        """
        Actualiza área con validaciones
        """
        try:
            logger.info(f"📝 Actualizando área ID {area_id} por {current_user.email}")
            
            # Convertir a dict excluyendo campos no establecidos
            area_dict = area_data.dict(exclude_unset=True)
            
            if not area_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay datos para actualizar"
                )
            
            # Actualizar área usando el servicio
            updated_area = AreaService.update_area(db, area_id, area_dict)
            
            logger.info(f"✅ Área actualizada: {updated_area.name}")
            return updated_area
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error actualizando área {area_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar área"
            )
    
    @staticmethod
    def delete_area(db: Session, area_id: int, current_user) -> AreaInDB:
        """
        Elimina área con validaciones
        """
        try:
            logger.info(f"🗑️ Eliminando área ID {area_id} por {current_user.email}")
            
            # Verificar si el área tiene dependencias antes de eliminar
            # (esto podría implementarse en el servicio)
            
            deleted_area = AreaService.delete_area(db, area_id)
            
            logger.info(f"✅ Área eliminada: {deleted_area.name}")
            return deleted_area
            
        except HTTPException:
            # Re-lanzar excepciones del servicio
            raise
        except Exception as e:
            logger.error(f"💥 Error eliminando área {area_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar área"
            )