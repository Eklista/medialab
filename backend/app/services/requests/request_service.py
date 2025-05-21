# app/services/requests/request_service.py
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session, validates

from app.models.requests.models import Request
from app.models.projects.models import Project
from app.models.requests.associations import request_services, request_sub_services

class RequestService:
    """
    Servicio para gestionar solicitudes
    """
    
    @staticmethod
    def get_location_info(request: Request) -> Dict[str, Any]:
        """
        Retorna información de la ubicación en formato amigable
        
        Args:
            request: Instancia de Request
            
        Returns:
            Dict[str, Any]: Información sobre la ubicación
        """
        if not request.location_type:
            return {'type': None, 'details': 'No especificada'}
            
        if not request.location_details:
            return {'type': request.location_type, 'details': 'Sin detalles'}
            
        if request.location_type == 'university':
            tower = request.location_details.get('tower', 'No especificado')
            classroom = request.location_details.get('classroom', 'No especificado')
            return {
                'type': 'university',
                'details': f"Torre {tower}, Salón {classroom}",
                'tower': tower,
                'classroom': classroom
            }
            
        if request.location_type == 'external':
            address = request.location_details.get('address', 'No especificado')
            return {
                'type': 'external',
                'details': address,
                'address': address
            }
            
        if request.location_type == 'virtual':
            platform = request.location_details.get('platform', 'No especificado')
            return {
                'type': 'virtual',
                'details': f"Plataforma: {platform}",
                'platform': platform
            }
            
        return {'type': request.location_type, 'details': str(request.location_details)}
    
    @staticmethod
    def set_contact_info(request: Request, email: str = None, phone: str = None, notes: str = None) -> None:
        """
        Establece la información de contacto para la solicitud
        
        Args:
            request: Instancia de Request
            email: Correo de contacto
            phone: Teléfono de contacto
            notes: Notas adicionales
        """
        contact_info = {}
        if email:
            contact_info['email'] = email
        if phone:
            contact_info['phone'] = phone
        if notes:
            contact_info['notes'] = notes
            
        request.contact_info = contact_info
    
    @staticmethod
    def add_service(db: Session, request: Request, service_id: int) -> bool:
        """
        Añade un servicio principal a la solicitud
        
        Args:
            db: Sesión SQLAlchemy
            request: Instancia de Request
            service_id: ID del servicio a añadir
            
        Returns:
            bool: True si se añadió correctamente, False si ya existía
        """
        from sqlalchemy import select
        
        # Verificar si el servicio ya está añadido
        existing = db.execute(
            select(request_services).where(
                request_services.c.request_id == request.id,
                request_services.c.service_id == service_id
            )
        ).first()
        
        if existing:
            return False
            
        # Insertar en la tabla de asociación
        db.execute(
            request_services.insert().values(
                request_id=request.id,
                service_id=service_id
            )
        )
        db.commit()
        return True
    
    @staticmethod
    def add_sub_service(db: Session, request: Request, sub_service_id: int, main_service_id: int = None) -> bool:
        """
        Añade un subservicio a la solicitud
        
        Args:
            db: Sesión SQLAlchemy
            request: Instancia de Request
            sub_service_id: ID del subservicio a añadir
            main_service_id: ID del servicio principal
            
        Returns:
            bool: True si se añadió correctamente, False si ya existía
        """
        from sqlalchemy import select
        
        # Verificar si el subservicio ya está añadido
        existing = db.execute(
            select(request_sub_services).where(
                request_sub_services.c.request_id == request.id,
                request_sub_services.c.sub_service_id == sub_service_id
            )
        ).first()
        
        if existing:
            return False
            
        # Insertar en la tabla de asociación
        db.execute(
            request_sub_services.insert().values(
                request_id=request.id,
                sub_service_id=sub_service_id,
                main_service_id=main_service_id
            )
        )
        db.commit()
        return True

    @validates('activity_type')
    def validate_activity_type(self, key, value):
        valid_types = ['single', 'recurrent', 'podcast', 'course']
        if value not in valid_types:
            raise ValueError(f"El tipo de actividad debe ser uno de: {', '.join(valid_types)}")
        return value

    @validates('location_type')
    def validate_location_type(self, key, value):
        if value is not None:
            valid_types = ['university', 'external', 'virtual']
            if value not in valid_types:
                raise ValueError(f"El tipo de ubicación debe ser uno de: {', '.join(valid_types)}")
        return value
    
    @staticmethod
    def convert_to_project(db: Session, request: Request, project_code: str = None, status_id: int = None) -> Project:
        """
        Convierte una solicitud en un proyecto
        
        Args:
            db: Sesión SQLAlchemy
            request: Instancia de Request
            project_code: Código para el nuevo proyecto
            status_id: ID del estado inicial
            
        Returns:
            Project: El proyecto creado
            
        Raises:
            ValueError: Si la solicitud ya ha sido procesada
        """
        if request.is_processed:
            raise ValueError("Esta solicitud ya ha sido procesada")
        
        # Crear el proyecto
        project = Project(
            title=request.title,
            description=request.description,
            code=project_code,
            status_id=status_id or request.status_id,
            client_id=request.requester_id,
            department_id=request.department_id,
            request_id=request.id  # Establecer la referencia al request
        )
        
        db.add(project)
        db.flush()  # Para obtener el ID
        
        # Actualizar esta solicitud
        request.is_processed = True
        request.processing_notes = f"Convertido a proyecto en {datetime.utcnow()}"
        
        db.commit()
        db.refresh(project)
        
        return project