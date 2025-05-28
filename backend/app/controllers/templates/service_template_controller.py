# backend/app/controllers/templates/service_template_controller.py
"""
🔄 CONTROLADOR CORREGIDO - SIN SQL DIRECTO
Usa las relaciones SQLAlchemy que ya están definidas
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
import logging

from app.services.templates.service_template_service import ServiceTemplateService
from app.schemas.templates.service_templates import (
    ServiceTemplateCreate, ServiceTemplateUpdate, ServiceTemplateInDB, ServiceTemplateWithServices
)
from app.models.organization.service_templates import ServiceTemplate
from app.models.organization.services import Service, SubService

logger = logging.getLogger(__name__)

class ServiceTemplateController:
    """
    Controlador CORREGIDO para plantillas de servicios
    USA RELACIONES SQLAlchemy en lugar de SQL directo
    """
    
    # ===== OPERACIONES CRUD BÁSICAS =====
    
    @staticmethod
    def get_templates_list(db: Session, skip: int = 0, limit: int = 100, current_user = None) -> List[ServiceTemplateInDB]:
        """
        Obtiene lista de plantillas - SIN CAMBIOS
        """
        try:
            logger.info(f"📋 Obteniendo plantillas (skip={skip}, limit={limit}) por {current_user.email if current_user else 'unknown'}")
            
            templates = ServiceTemplateService.get_templates(db, skip, limit)
            
            logger.info(f"✅ {len(templates)} plantillas obtenidas exitosamente")
            return templates
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo plantillas: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener plantillas de servicios"
            )
    
    @staticmethod
    def create_new_template(db: Session, template_data: ServiceTemplateCreate, current_user) -> ServiceTemplateInDB:
        """
        Crea nueva plantilla - SIN CAMBIOS
        """
        try:
            logger.info(f"📝 Creando plantilla: {template_data.name} por {current_user.email}")
            
            if not template_data.name or not template_data.name.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de la plantilla es obligatorio"
                )
            
            template_dict = template_data.dict()
            new_template = ServiceTemplateService.create_template(db, template_dict)
            
            logger.info(f"✅ Plantilla creada: {new_template.name} (ID: {new_template.id})")
            return new_template
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error creando plantilla: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear plantilla de servicios"
            )
    
    @staticmethod
    def get_template_by_id(db: Session, template_id: int, current_user) -> ServiceTemplateWithServices:
        """
        Obtiene plantilla por ID - SIN CAMBIOS
        """
        try:
            logger.info(f"🔍 Obteniendo plantilla ID {template_id} por {current_user.email}")
            
            template = ServiceTemplateService.get_template_with_services(db, template_id)
            
            logger.info(f"✅ Plantilla obtenida: {template.name}")
            return template
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo plantilla {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener plantilla de servicios"
            )
    
    @staticmethod
    def update_template(db: Session, template_id: int, template_data: ServiceTemplateUpdate, current_user) -> ServiceTemplateInDB:
        """
        Actualiza plantilla - SIN CAMBIOS  
        """
        try:
            logger.info(f"📝 Actualizando plantilla ID {template_id} por {current_user.email}")
            
            template_dict = template_data.dict(exclude_unset=True)
            
            if not template_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay datos para actualizar"
                )
            
            if "name" in template_dict and (not template_dict["name"] or not template_dict["name"].strip()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de la plantilla no puede estar vacío"
                )
            
            updated_template = ServiceTemplateService.update_template(db, template_id, template_dict)
            
            logger.info(f"✅ Plantilla actualizada: {updated_template.name}")
            return updated_template
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error actualizando plantilla {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar plantilla de servicios"
            )
    
    @staticmethod
    def delete_template(db: Session, template_id: int, current_user) -> ServiceTemplateInDB:
        """
        Elimina plantilla con verificación de dependencias usando ORM
        """
        try:
            logger.info(f"🗑️ Eliminando plantilla ID {template_id} por {current_user.email}")
            
            # ✅ USAR ORM EN LUGAR DE SQL DIRECTO
            template = db.query(ServiceTemplate).filter(ServiceTemplate.id == template_id).first()
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # Verificar dependencias usando relaciones ORM
            has_services = len(template.services) > 0
            has_subservices = len(template.subservices) > 0
            
            if has_services or has_subservices:
                logger.warning(f"⚠️ Plantilla {template_id} tiene dependencias: {len(template.services)} servicios, {len(template.subservices)} subservicios")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No se puede eliminar la plantilla porque tiene {len(template.services)} servicios y {len(template.subservices)} subservicios asociados"
                )
            
            deleted_template = ServiceTemplateService.delete_template(db, template_id)
            
            logger.info(f"✅ Plantilla eliminada: {deleted_template.name}")
            return deleted_template
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error eliminando plantilla {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar plantilla de servicios"
            )
    
    # ===== GESTIÓN DE RELACIONES (USANDO ORM) =====
    
    @staticmethod
    def get_template_services(db: Session, template_id: int, current_user) -> List[Dict[str, Any]]:
        """
        🔥 CORREGIDO: Obtiene servicios usando relaciones ORM
        """
        try:
            logger.info(f"🔗 Obteniendo servicios de plantilla {template_id} por {current_user.email}")
            
            # ✅ USAR ORM CON EAGER LOADING
            template = db.query(ServiceTemplate).options(
                joinedload(ServiceTemplate.services)
            ).filter(ServiceTemplate.id == template_id).first()
            
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # Transformar a formato estructurado usando ORM
            services = []
            for service in template.services:
                services.append({
                    "template_id": template_id,
                    "service_id": service.id,
                    "service_name": service.name,
                    "service_description": service.description,
                    "service_icon": service.icon_name
                })
            
            logger.info(f"✅ {len(services)} servicios encontrados para plantilla {template_id}")
            return services
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo servicios de plantilla {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener servicios de la plantilla"
            )
    
    @staticmethod
    def get_template_subservices(db: Session, template_id: int, current_user) -> List[Dict[str, Any]]:
        """
        🔥 CORREGIDO: Obtiene subservicios usando relaciones ORM
        """
        try:
            logger.info(f"🔗 Obteniendo subservicios de plantilla {template_id} por {current_user.email}")
            
            # ✅ USAR ORM CON EAGER LOADING
            template = db.query(ServiceTemplate).options(
                joinedload(ServiceTemplate.subservices).joinedload(SubService.service)
            ).filter(ServiceTemplate.id == template_id).first()
            
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # Transformar a formato estructurado usando ORM
            subservices = []
            for subservice in template.subservices:
                subservices.append({
                    "id": subservice.id,
                    "name": subservice.name,
                    "description": subservice.description,
                    "service_id": subservice.service_id,
                    "parent_service_name": subservice.service.name if subservice.service else None,
                    "template_id": template_id
                })
            
            logger.info(f"✅ {len(subservices)} subservicios encontrados para plantilla {template_id}")
            return subservices
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo subservicios de plantilla {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener subservicios de la plantilla"
            )
    
    @staticmethod
    def assign_services_to_template(db: Session, template_id: int, service_ids: List[int], current_user) -> Dict[str, Any]:
        """
        🔥 CORREGIDO: Asigna servicios usando relaciones ORM
        """
        try:
            logger.info(f"🔗 Asignando {len(service_ids)} servicios al template {template_id} por {current_user.email}")
            
            # ✅ OBTENER PLANTILLA CON ORM
            template = db.query(ServiceTemplate).filter(ServiceTemplate.id == template_id).first()
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # ✅ VALIDAR SERVICIOS CON ORM
            services = db.query(Service).filter(Service.id.in_(service_ids)).all()
            
            if len(services) != len(service_ids):
                found_ids = [s.id for s in services]
                missing_ids = [sid for sid in service_ids if sid not in found_ids]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Servicios no encontrados: {missing_ids}"
                )
            
            # ✅ ASIGNAR USANDO RELACIONES ORM
            template.services = services  # SQLAlchemy maneja automáticamente la tabla intermedia
            db.commit()
            
            logger.info(f"✅ Servicios asignados exitosamente al template {template_id}")
            return {
                "message": f"Se asignaron {len(service_ids)} servicios a la plantilla '{template.name}'",
                "template_id": template_id,
                "template_name": template.name,
                "assigned_services": [{"id": s.id, "name": s.name} for s in services]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"💥 Error asignando servicios al template {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar servicios a la plantilla"
            )
    
    @staticmethod
    def assign_subservices_to_template(db: Session, template_id: int, subservice_ids: List[int], current_user) -> Dict[str, Any]:
        """
        🔥 CORREGIDO: Asigna subservicios usando relaciones ORM
        """
        try:
            logger.info(f"🔗 Asignando {len(subservice_ids)} subservicios al template {template_id} por {current_user.email}")
            
            # ✅ OBTENER PLANTILLA CON ORM
            template = db.query(ServiceTemplate).filter(ServiceTemplate.id == template_id).first()
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # ✅ VALIDAR SUBSERVICIOS CON ORM
            subservices = db.query(SubService).filter(SubService.id.in_(subservice_ids)).all()
            
            if len(subservices) != len(subservice_ids):
                found_ids = [s.id for s in subservices]
                missing_ids = [sid for sid in subservice_ids if sid not in found_ids]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Subservicios no encontrados: {missing_ids}"
                )
            
            # ✅ ASIGNAR USANDO RELACIONES ORM
            template.subservices = subservices  # SQLAlchemy maneja automáticamente la tabla intermedia
            db.commit()
            
            logger.info(f"✅ Subservicios asignados exitosamente al template {template_id}")
            return {
                "message": f"Se asignaron {len(subservice_ids)} subservicios a la plantilla '{template.name}'",
                "template_id": template_id,
                "template_name": template.name,
                "assigned_subservices": [{"id": s.id, "name": s.name} for s in subservices]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"💥 Error asignando subservicios al template {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar subservicios a la plantilla"
            )
    
    @staticmethod
    def get_template_statistics(db: Session, template_id: int, current_user) -> Dict[str, Any]:
        """
        🔥 CORREGIDO: Estadísticas usando relaciones ORM
        """
        try:
            logger.info(f"📊 Obteniendo estadísticas del template {template_id} por {current_user.email}")
            
            # ✅ USAR ORM PARA OBTENER ESTADÍSTICAS
            template = db.query(ServiceTemplate).options(
                joinedload(ServiceTemplate.services),
                joinedload(ServiceTemplate.subservices)
            ).filter(ServiceTemplate.id == template_id).first()
            
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # Calcular estadísticas usando ORM
            services_count = len(template.services)
            subservices_count = len(template.subservices)
            
            # Servicios más utilizados (si necesitas conteo de uso, añadir campo en el modelo)
            popular_services = [
                {"name": service.name, "description": service.description}
                for service in template.services[:5]  # Top 5
            ]
            
            statistics = {
                "template_id": template_id,
                "template_name": template.name,
                "template_description": template.description,
                "is_public": template.is_public,
                "total_services": services_count,
                "total_subservices": subservices_count,
                "total_components": services_count + subservices_count,
                "services_list": [{"id": s.id, "name": s.name} for s in template.services],
                "subservices_list": [{"id": s.id, "name": s.name} for s in template.subservices],
                "popular_services": popular_services
            }
            
            logger.info(f"✅ Estadísticas obtenidas para template {template_id}")
            return statistics
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas del template {template_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener estadísticas de la plantilla"
            )