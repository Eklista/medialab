# ============================================================================
# backend/app/controllers/inventory/equipment_controller.py
# ============================================================================

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.inventory.equipment_service import EquipmentService
from app.schemas.inventory.equipment import EquipmentCreate, EquipmentUpdate

logger = logging.getLogger(__name__)

class EquipmentController:
    """
    Controlador para operaciones de equipos
    Separa la lógica de negocio del routing de FastAPI
    """
    
    @staticmethod
    def get_equipment_list(
        db: Session,
        skip: int = 0,
        limit: int = 25,
        format_type: str = "list"
    ) -> List[Dict[str, Any]]:
        """
        Obtiene lista de equipos
        """
        try:
            logger.info(f"📋 Obteniendo lista de equipos: skip={skip}, limit={limit}")
            
            equipment_list = EquipmentService.get_equipment_list(
                db=db,
                skip=skip,
                limit=limit,
                format_type=format_type
            )
            
            logger.info(f"✅ {len(equipment_list)} equipos obtenidos")
            return equipment_list
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo lista de equipos: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener lista de equipos"
            )
    
    @staticmethod
    def get_equipment_by_id(db: Session, equipment_id: int) -> Dict[str, Any]:
        """
        Obtiene equipo por ID
        """
        try:
            logger.info(f"🔍 Obteniendo equipo ID: {equipment_id}")
            
            equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
            
            logger.info(f"✅ Equipo {equipment_id} obtenido")
            return equipment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo equipo {equipment_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener equipo"
            )
    
    @staticmethod
    def search_equipment(
        db: Session,
        search_query: str = None,
        filters: Dict[str, Any] = None,
        cursor: int = 0,
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Búsqueda de equipos
        """
        try:
            logger.info(f"🔍 Búsqueda de equipos: '{search_query}', cursor={cursor}")
            
            results = EquipmentService.search_equipment(
                db=db,
                search_query=search_query,
                filters=filters or {},
                cursor=cursor,
                limit=limit
            )
            
            logger.info(f"✅ {results['total_found']} equipos encontrados, mostrando {len(results['results'])}")
            return results
            
        except Exception as e:
            logger.error(f"💥 Error en búsqueda de equipos: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error en la búsqueda de equipos"
            )
    
    @staticmethod
    def create_equipment(
        db: Session,
        equipment_data: EquipmentCreate,
        current_user_id: int
    ) -> Dict[str, Any]:
        """
        Crea nuevo equipo
        """
        try:
            logger.info(f"➕ Creando equipo: {equipment_data.marca} {equipment_data.modelo}")
            
            equipment_dict = equipment_data.dict(exclude_unset=True)
            equipment = EquipmentService.create_equipment(
                db=db,
                equipment_data=equipment_dict,
                created_by_id=current_user_id
            )
            
            logger.info(f"✅ Equipo creado exitosamente: ID {equipment['id']}")
            return equipment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error creando equipo: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear equipo"
            )
    
    @staticmethod
    def update_equipment(
        db: Session,
        equipment_id: int,
        equipment_data: EquipmentUpdate,
        current_user_id: int
    ) -> Dict[str, Any]:
        """
        Actualiza equipo existente
        """
        try:
            logger.info(f"📝 Actualizando equipo ID: {equipment_id}")
            
            equipment_dict = equipment_data.dict(exclude_unset=True)
            equipment = EquipmentService.update_equipment(
                db=db,
                equipment_id=equipment_id,
                equipment_data=equipment_dict,
                updated_by_id=current_user_id
            )
            
            logger.info(f"✅ Equipo {equipment_id} actualizado")
            return equipment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error actualizando equipo {equipment_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar equipo"
            )
    
    @staticmethod
    def delete_equipment(
        db: Session,
        equipment_id: int,
        current_user_id: int
    ) -> Dict[str, str]:
        """
        Elimina equipo
        """
        try:
            logger.info(f"🗑️ Eliminando equipo ID: {equipment_id}")
            
            result = EquipmentService.delete_equipment(
                db=db,
                equipment_id=equipment_id,
                deleted_by_id=current_user_id
            )
            
            logger.info(f"✅ Equipo {equipment_id} eliminado")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error eliminando equipo {equipment_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar equipo"
            )
    
    @staticmethod
    def assign_equipment(
        db: Session,
        equipment_id: int,
        user_id: int,
        current_user_id: int
    ) -> Dict[str, Any]:
        """
        Asigna equipo a usuario
        """
        try:
            logger.info(f"👤 Asignando equipo {equipment_id} a usuario {user_id}")
            
            equipment = EquipmentService.assign_equipment(
                db=db,
                equipment_id=equipment_id,
                user_id=user_id,
                updated_by_id=current_user_id
            )
            
            logger.info(f"✅ Equipo {equipment_id} asignado a usuario {user_id}")
            return equipment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error asignando equipo {equipment_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar equipo"
            )
    
    @staticmethod
    def unassign_equipment(
        db: Session,
        equipment_id: int,
        current_user_id: int
    ) -> Dict[str, Any]:
        """
        Desasigna equipo
        """
        try:
            logger.info(f"🔄 Desasignando equipo ID: {equipment_id}")
            
            equipment = EquipmentService.unassign_equipment(
                db=db,
                equipment_id=equipment_id,
                updated_by_id=current_user_id
            )
            
            logger.info(f"✅ Equipo {equipment_id} desasignado")
            return equipment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error desasignando equipo {equipment_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al desasignar equipo"
            )