# app/models/requests/models.py
from sqlalchemy import (Column, String, Integer, Text, Boolean, DateTime, ForeignKey, 
                        Index, JSON, Enum, func, Date)
from sqlalchemy.orm import relationship, validates
from datetime import datetime, date, time

from app.models.base import Base
from app.models.common.workflow import WorkItem

class Request(WorkItem):
    """
    Solicitudes de trabajo/servicios - Punto de entrada para todas las solicitudes
    """
    __tablename__ = 'requests'
    
    id = Column(Integer, ForeignKey('work_items.id'), primary_key=True)
    
    # Tipo de actividad solicitada
    activity_type = Column(String(50), nullable=False)  # 'single', 'recurrent', 'podcast', 'course'
    
    # Datos del solicitante
    requester_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    contact_info = Column(JSON, nullable=True)  # Para almacenar email, teléfono, etc.
    
    # Fechas
    request_date = Column(Date, nullable=False, default=func.current_date())
    desired_date = Column(DateTime, nullable=True)  # Fecha deseada para la actividad
    
    # Ubicación
    location_type = Column(String(50), nullable=True)  # 'university', 'external', 'virtual'
    location_details = Column(JSON, nullable=True)
    
    # Estado del procesamiento
    is_processed = Column(Boolean, default=False)  # Indica si la solicitud ya fue procesada/convertida
    processing_notes = Column(Text, nullable=True)  # Notas sobre el procesamiento
    
    # Relaciones
    requester = relationship("User", foreign_keys=[requester_id])
    department = relationship("Department")
    
    # Relaciones con tipos específicos
    single_event = relationship("SingleEvent", back_populates="request", uselist=False, cascade="all, delete-orphan")
    recurrent_event = relationship("RecurrentEvent", back_populates="request", uselist=False, cascade="all, delete-orphan")
    podcast_request = relationship("PodcastRequest", back_populates="request", uselist=False, cascade="all, delete-orphan")
    course_request = relationship("CourseRequest", back_populates="request", uselist=False, cascade="all, delete-orphan")
    
    # Relaciones con servicios seleccionados
    services = relationship("Service", secondary="request_services", viewonly=True)
    sub_services = relationship("SubService", secondary="request_sub_services", viewonly=True)
    
    # Relación con proyecto (cuando se convierte) - sin referencia circular
    project = relationship("Project", back_populates="originating_request", uselist=False)
    
    # Configuración del mapper
    __mapper_args__ = {
        'polymorphic_identity': 'request',
    }
    
    # Índices
    __table_args__ = (
        Index('idx_request_requester', 'requester_id'),
        Index('idx_request_department', 'department_id'),
        Index('idx_request_activity_type', 'activity_type'),
        Index('idx_request_is_processed', 'is_processed')
    )
    
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
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a esta solicitud
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'request',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a esta solicitud
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def get_location_info(self):
        """
        Retorna información de la ubicación en formato amigable
        
        Returns:
            dict: Información sobre la ubicación
        """
        if not self.location_type:
            return {'type': None, 'details': 'No especificada'}
            
        if not self.location_details:
            return {'type': self.location_type, 'details': 'Sin detalles'}
            
        if self.location_type == 'university':
            tower = self.location_details.get('tower', 'No especificado')
            classroom = self.location_details.get('classroom', 'No especificado')
            return {
                'type': 'university',
                'details': f"Torre {tower}, Salón {classroom}",
                'tower': tower,
                'classroom': classroom
            }
            
        if self.location_type == 'external':
            address = self.location_details.get('address', 'No especificado')
            return {
                'type': 'external',
                'details': address,
                'address': address
            }
            
        if self.location_type == 'virtual':
            platform = self.location_details.get('platform', 'No especificado')
            return {
                'type': 'virtual',
                'details': f"Plataforma: {platform}",
                'platform': platform
            }
            
        return {'type': self.location_type, 'details': str(self.location_details)}
    
    def set_contact_info(self, email=None, phone=None, notes=None):
        """
        Establece la información de contacto para la solicitud
        
        Args:
            email (str, optional): Correo de contacto
            phone (str, optional): Teléfono de contacto
            notes (str, optional): Notas adicionales
        """
        contact_info = {}
        if email:
            contact_info['email'] = email
        if phone:
            contact_info['phone'] = phone
        if notes:
            contact_info['notes'] = notes
            
        self.contact_info = contact_info
    
    def add_service(self, session, service_id):
        """
        Añade un servicio principal a la solicitud
        
        Args:
            session (Session): Sesión SQLAlchemy
            service_id (int): ID del servicio a añadir
            
        Returns:
            bool: True si se añadió correctamente, False si ya existía
        """
        # Verificar si el servicio ya está añadido
        from app.models.requests.associations import request_services
        
        existing = session.query(request_services).filter(
            request_services.c.request_id == self.id,
            request_services.c.service_id == service_id
        ).first()
        
        if existing:
            return False
            
        # Insertar en la tabla de asociación
        session.execute(
            request_services.insert().values(
                request_id=self.id,
                service_id=service_id
            )
        )
        return True
    
    def add_sub_service(self, session, sub_service_id, main_service_id=None):
        """
        Añade un subservicio a la solicitud
        
        Args:
            session (Session): Sesión SQLAlchemy
            sub_service_id (int): ID del subservicio a añadir
            main_service_id (int, optional): ID del servicio principal
            
        Returns:
            bool: True si se añadió correctamente, False si ya existía
        """
        from app.models.requests.associations import request_sub_services
        
        # Verificar si el subservicio ya está añadido
        existing = session.query(request_sub_services).filter(
            request_sub_services.c.request_id == self.id,
            request_sub_services.c.sub_service_id == sub_service_id
        ).first()
        
        if existing:
            return False
            
        # Insertar en la tabla de asociación
        session.execute(
            request_sub_services.insert().values(
                request_id=self.id,
                sub_service_id=sub_service_id,
                main_service_id=main_service_id
            )
        )
        return True
    
    def convert_to_project(self, session, project_code=None, status_id=None):
        """
        Convierte esta solicitud en un proyecto
        
        Args:
            session (Session): Sesión SQLAlchemy
            project_code (str, optional): Código para el nuevo proyecto
            status_id (int, optional): ID del estado inicial
            
        Returns:
            Project: El proyecto creado
            
        Raises:
            ValueError: Si la solicitud ya ha sido procesada
        """
        if self.is_processed:
            raise ValueError("Esta solicitud ya ha sido procesada")
        
        from app.models.projects.models import Project
        
        # Crear el proyecto
        project = Project(
            title=self.title,
            description=self.description,
            code=project_code,
            status_id=status_id or self.status_id,
            client_id=self.requester_id,
            department_id=self.department_id,
            request_id=self.id  # Establecer la referencia al request
        )
        
        session.add(project)
        session.flush()  # Para obtener el ID
        
        # Actualizar esta solicitud
        self.is_processed = True
        self.processing_notes = f"Convertido a proyecto en {datetime.utcnow()}"
        
        return project
    
    def __repr__(self):
        return f"<Request(id={self.id}, activity_type='{self.activity_type}', processed={self.is_processed})>"