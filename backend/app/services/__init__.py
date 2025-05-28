# app/services/__init__.py

# Servicios de autenticación y usuarios
from app.services.users.user_service import UserService
from app.services.auth.auth_service import AuthService
from app.services.security.role_service import RoleService

# Servicios de organización
from app.services.organization.area_service import AreaService
from app.services.organization.department_service import DepartmentService
from app.services.organization.department_type_service import DepartmentTypeService
from app.services.organization.service_service import ServiceService
from app.services.templates.service_template_service import ServiceTemplateService

# Servicios comunes
from app.services.common.validation_service import ValidationService
from app.services.common.attachment_service import AttachmentService
from app.services.audits.audit_service import AuditService
from app.services.common.comment_service import CommentService
from app.services.common.link_service import LinkService
from app.services.common.status_service import StatusService

# Servicios para solicitudes y eventos
from app.services.requests.request_service import RequestService
from app.services.requests.event_service import EventService
from app.services.requests.recurrence_service import RecurrenceService

# Servicios para proyectos
from app.services.projects.project_service import ProjectService
from app.services.projects.task_service import TaskService

# Servicios para multimedia
from app.services.multimedia.podcast_service import PodcastService
from app.services.multimedia.course_service import CourseService

# Servicios de notificaciones
from app.services.notification.notificacion_service import NotificationService

# Servicios de seguridad
from app.services.security.two_factor_service import TwoFactorService

# Servicios de Redis
from app.services.redis_cache_service import RedisCacheService
from app.services.redis_init_service import RedisInitService
from app.services.redis_session_service import RedisSessionService


# Exportar todos los servicios
__all__ = [
    # Auth y usuarios
    'UserService',
    'AuthService',
    'RoleService',
    
    # Organización
    'AreaService',
    'DepartmentService',
    'DepartmentTypeService',
    'ServiceService',
    'ServiceTemplateService',
    
    # Comunes
    'ValidationService',
    'AttachmentService',
    'AuditService',
    'CommentService',
    'LinkService',
    'StatusService',
    
    # Solicitudes y eventos
    'RequestService',
    'EventService',
    'RecurrenceService',
    
    # Proyectos
    'ProjectService',
    'TaskService',
    
    # Multimedia
    'PodcastService',
    'CourseService',
    
    # Notificaciones
    'NotificationService',
    
    # Seguridad
    'TwoFactorService',

    # Redis
    'RedisCacheService',
    'RedisInitService',
    'RedisSessionService'
]