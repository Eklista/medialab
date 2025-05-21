# app/services/requests/request_completion_service.py
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.requests.models import Request
from app.models.projects.models import Project
from app.models.multimedia.podcasts import PodcastSeries
from app.models.education.academic import Course

class RequestCompletionService:
    """
    Servicio para manejar la finalización y conversión de solicitudes
    """
    
    @staticmethod
    def convert_to_project(db: Session, request: Request, project_data: Dict[str, Any]) -> Project:
        """
        Convierte una solicitud en un proyecto
        """
        if request.is_processed:
            raise ValueError("Esta solicitud ya ha sido procesada")
        
        # Crear proyecto a partir de la solicitud
        project = Project(
            title=request.title,
            description=request.description,
            activity_type_id=project_data.get('activity_type_id'),
            status_id=project_data.get('status_id', request.status_id),
            priority_id=request.priority_id,
            department_id=request.department_id,
            client_id=request.requester_id,
            code=project_data.get('code'),
            request_id=request.id,
            institutional_user_id=request.requester_institutional_id
        )
        
        db.add(project)
        
        # Marcar solicitud como procesada
        request.is_processed = True
        request.processing_notes = f"Convertido a proyecto en {datetime.utcnow()}"
        
        db.commit()
        db.refresh(project)
        
        return project
    
    @staticmethod
    def convert_podcast_request(db: Session, request_id: int, series_data: Dict[str, Any]) -> PodcastSeries:
        """
        Convierte una solicitud de podcast en una serie de podcast
        """
        # Implementar la lógica de conversión
        pass
    
    @staticmethod
    def convert_course_request(db: Session, request_id: int, course_data: Dict[str, Any]) -> Course:
        """
        Convierte una solicitud de curso en un curso académico
        """
        # Implementar la lógica de conversión
        pass