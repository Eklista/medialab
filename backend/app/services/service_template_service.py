# app/services/service_template_service.py
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.repositories.service_template_repository import ServiceTemplateRepository
from app.models.organization.service_templates import ServiceTemplate
from app.models.organization.services import Service, SubService

class ServiceTemplateService:
    """
    Servicio para gestionar lógica de negocio relacionada con plantillas de servicios
    """
    
    @staticmethod
    def get_templates(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtiene lista de plantillas con sus relaciones
        """
        templates = ServiceTemplateRepository.get_all_with_relations(db, skip, limit)
        
        # Transformar datos con información de relaciones
        result = []
        for template in templates:
            # Procesar subservicios
            subservices_data = []
            if hasattr(template, 'subservices') and template.subservices:
                subservices_data = [
                    {
                        "id": ss.id,
                        "name": ss.name,
                        "description": ss.description,
                        "service_id": ss.service_id
                    } for ss in template.subservices
                ]
            
            # Construir service_selections
            service_selections = []
            if template.services:
                for service in template.services:
                    sub_service_ids = []
                    if hasattr(template, 'subservices') and template.subservices:
                        sub_service_ids = [
                            ss.id for ss in template.subservices 
                            if hasattr(ss, 'service_id') and ss.service_id == service.id
                        ]
                    service_selections.append({
                        "service_id": service.id,
                        "sub_service_ids": sub_service_ids
                    })
            
            # Crear diccionario con datos
            template_dict = {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "is_public": template.is_public,
                "services": [
                    {
                        "id": srv.id,
                        "name": srv.name,
                        "description": srv.description,
                        "icon_name": srv.icon_name,
                        "sub_services": [
                            {
                                "id": sub.id,
                                "name": sub.name,
                                "description": sub.description,
                                "service_id": sub.service_id
                            } for sub in srv.sub_services
                        ]
                    } for srv in template.services
                ] if template.services else [],
                "subservices": subservices_data,
                "service_selections": service_selections
            }
            
            result.append(template_dict)
        
        return result
    
    @staticmethod
    def get_public_templates(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtiene lista de plantillas públicas con sus relaciones
        """
        # Obtener plantillas públicas con sus relaciones
        templates = db.query(ServiceTemplate)\
            .filter(ServiceTemplate.is_public == True)\
            .options(joinedload(ServiceTemplate.services).joinedload(Service.sub_services))\
            .options(joinedload(ServiceTemplate.subservices))\
            .offset(skip).limit(limit).all()
        
        # Transformar datos con información de relaciones, igual que en get_templates
        result = []
        for template in templates:
            # Procesar subservicios
            subservices_data = []
            if hasattr(template, 'subservices') and template.subservices:
                subservices_data = [
                    {
                        "id": ss.id,
                        "name": ss.name,
                        "description": ss.description,
                        "service_id": ss.service_id
                    } for ss in template.subservices
                ]
            
            # Construir service_selections
            service_selections = []
            if template.services:
                for service in template.services:
                    sub_service_ids = []
                    if hasattr(template, 'subservices') and template.subservices:
                        sub_service_ids = [
                            ss.id for ss in template.subservices 
                            if hasattr(ss, 'service_id') and ss.service_id == service.id
                        ]
                    service_selections.append({
                        "service_id": service.id,
                        "sub_service_ids": sub_service_ids
                    })
            
            # Crear diccionario con datos
            template_dict = {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "is_public": template.is_public,
                "services": [
                    {
                        "id": srv.id,
                        "name": srv.name,
                        "description": srv.description,
                        "icon_name": srv.icon_name,
                        "sub_services": [
                            {
                                "id": sub.id,
                                "name": sub.name,
                                "description": sub.description,
                                "service_id": sub.service_id
                            } for sub in srv.sub_services
                        ]
                    } for srv in template.services
                ] if template.services else [],
                "subservices": subservices_data,
                "service_selections": service_selections
            }
            
            result.append(template_dict)
        
        return result
    
    @staticmethod
    def get_template_by_id(db: Session, template_id: int) -> ServiceTemplate:
        """
        Obtiene plantilla por ID, lanza excepción si no existe
        """
        template = ServiceTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        return template
    
    @staticmethod
    def get_template_with_services(db: Session, template_id: int) -> Dict[str, Any]:
        """
        Obtiene una plantilla con servicios y subservicios cargados
        """
        template = ServiceTemplateRepository.get_with_services(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        
        # Obtener los IDs de todos los subservicios relacionados con esta plantilla
        subservices_data = []
        if hasattr(template, 'subservices') and template.subservices:
            subservices_data = [
                {
                    "id": ss.id,
                    "name": ss.name,
                    "description": ss.description,
                    "service_id": ss.service_id
                } for ss in template.subservices
            ]
        
        # Construir la estructura de service_selections
        service_selections = []
        if template.services:
            for service in template.services:
                # Encontrar subservicios relacionados a este servicio
                sub_service_ids = [
                    ss.id for ss in template.subservices 
                    if hasattr(ss, 'service_id') and ss.service_id == service.id
                ] if hasattr(template, 'subservices') and template.subservices else []
                
                service_selections.append({
                    "service_id": service.id,
                    "sub_service_ids": sub_service_ids
                })
        
        # Convertir el objeto SQLAlchemy a un diccionario para poder agregar campos adicionales
        template_dict = {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "is_public": template.is_public,
            "services": [
                {
                    "id": service.id,
                    "name": service.name,
                    "description": service.description,
                    "icon_name": service.icon_name,
                    "sub_services": [
                        {
                            "id": sub.id,
                            "name": sub.name, 
                            "description": sub.description,
                            "service_id": sub.service_id
                        } for sub in service.sub_services
                    ]
                } for service in template.services
            ] if template.services else [],
            "subservices": subservices_data,
            "service_selections": service_selections
        }
        
        return template_dict
    
    @staticmethod
    def create_template(db: Session, template_data: Dict[str, Any]) -> ServiceTemplate:
        """
        Crea una nueva plantilla
        """
        try:
            # Verificamos si ya existe una plantilla con ese nombre
            existing_template = ServiceTemplateRepository.get_by_name(db, template_data["name"])
            if existing_template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una plantilla con ese nombre"
                )
            
            # Extraer service_ids y service_selections
            service_ids = template_data.pop('service_ids', [])
            service_selections = template_data.pop('service_selections', [])
            
            print("Processing service selections:", service_selections)
            
            # Extraer subservice_ids
            subservice_ids = []
            for selection in service_selections:
                if 'sub_service_ids' in selection:
                    sub_ids = selection.get('sub_service_ids', [])
                    print(f"Selection for service {selection.get('service_id')}: sub_ids = {sub_ids}")
                    subservice_ids.extend(sub_ids)
            
            print("Final subservice_ids to be saved:", subservice_ids)
            
            # Crear la plantilla
            return ServiceTemplateRepository.create(
                db=db, 
                template_data=template_data, 
                service_ids=service_ids,
                subservice_ids=subservice_ids
            )
        except Exception as e:
            print(f"Error creating template: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
        
    @staticmethod
    def update_template(db: Session, template_id: int, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualiza una plantilla existente y sus relaciones
        """
        try:
            template = ServiceTemplateRepository.get_by_id(db, template_id)
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Plantilla no encontrada"
                )
            
            # Si se actualiza el nombre, verificar que no exista
            if "name" in template_data and template_data["name"] != template.name:
                existing_template = ServiceTemplateRepository.get_by_name(db, template_data["name"])
                if existing_template and existing_template.id != template.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ya existe una plantilla con ese nombre"
                    )
            
            # Extraer service_ids y service_selections
            service_ids = template_data.pop('service_ids', None)
            service_selections = template_data.pop('service_selections', None)
            
            print(f"Update - Service IDs: {service_ids}")
            print(f"Update - Service Selections: {service_selections}")
            
            # Actualizar campos básicos
            for field, value in template_data.items():
                setattr(template, field, value)
            
            # Actualizar relaciones con servicios si se proporcionan
            if service_ids is not None:
                # Obtener objetos Service
                services = db.query(Service).filter(Service.id.in_(service_ids)).all()
                template.services = services
            
            # Actualizar relaciones con subservicios si se proporcionan
            if service_selections is not None:
                # Extraer todos los IDs de subservicios
                subservice_ids = []
                for selection in service_selections:
                    if 'sub_service_ids' in selection and selection['sub_service_ids']:
                        subservice_ids.extend(selection['sub_service_ids'])
                
                print(f"Update - Extracted subservice IDs: {subservice_ids}")
                
                # Obtener objetos SubService
                from app.models.organization.services import SubService
                subservices = db.query(SubService).filter(SubService.id.in_(subservice_ids)).all()
                
                print(f"Update - Found subservices: {[s.id for s in subservices]}")
                
                # Actualizar relación
                template.subservices = subservices
            
            # Guardar cambios
            db.commit()
            db.refresh(template)
            
            # Retornar plantilla actualizada con todas sus relaciones
            return ServiceTemplateService.get_template_with_services(db, template_id)
        except Exception as e:
            db.rollback()
            print(f"Error al actualizar plantilla: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
        
    @staticmethod
    def delete_template(db: Session, template_id: int) -> ServiceTemplate:
        """
        Elimina una plantilla
        """
        template = ServiceTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        
        return ServiceTemplateRepository.delete(db, template)