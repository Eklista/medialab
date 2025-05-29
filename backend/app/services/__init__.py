# ===== MÓDULO PRINCIPAL: backend/app/services/__init__.py =====

# Servicios de autenticación y usuarios
from app.services.users.user_service import UserService
from app.services.users.institutional_user_service import InstitutionalUserService

# Servicios de autenticación y seguridad
from app.services.auth.auth_service import AuthService
from app.services.auth.password_service import PasswordService
from app.services.auth.token_service import TokenService
from app.services.auth.security_service import SecurityService

# Servicios de seguridad específicos
from app.services.security.role_service import RoleService
from app.services.security.two_factor_service import TwoFactorService

# Servicios de organización
from app.services.organization.area_service import AreaService
from app.services.organization.department_service import DepartmentService
from app.services.organization.department_type_service import DepartmentTypeService
from app.services.organization.service_service import ServiceService

# Servicios de plantillas
from app.services.templates.service_template_service import ServiceTemplateService
from app.services.templates.email_template_service import EmailTemplateService

# Servicios comunes
from app.services.common.validation_service import ValidationService
from app.services.common.attachment_service import AttachmentService
from app.services.common.comment_service import CommentService
from app.services.common.link_service import LinkService
from app.services.common.status_service import StatusService
from app.services.common.entity_service import EntityService
from app.services.common.metadata_service import MetadataService
from app.services.common.workflow_service import WorkflowService

# Servicios de auditoría
from app.services.audits.audit_service import AuditService

# Servicios para solicitudes y eventos
from app.services.requests.request_service import RequestService
from app.services.requests.event_service import EventService
from app.services.requests.recurrence_service import RecurrenceService
from app.services.requests.request_completion_service import RequestCompletionService

# Servicios para proyectos
from app.services.projects.project_service import ProjectService
from app.services.projects.task_service import TaskService

# Servicios para multimedia
from app.services.multimedia.podcast_service import PodcastService
from app.services.multimedia.course_service import CourseService

# Servicios de educación
from app.services.education.professor_service import ProfessorService

# Servicios de notificaciones
from app.services.notification.notificacion_service import NotificationService

# Servicios de comunicación
from app.services.communication.email_service import (
    send_email, send_email_with_template, send_welcome_email,
    send_reset_password_email, send_reset_code_email, send_notification_email
)
from app.services.communication.smtp_service import SmtpService

# Servicios de sistema Redis
from app.services.system.redis_cache_service import RedisCacheService, redis_cache
from app.services.system.redis_init_service import RedisInitService, redis_init
from app.services.system.redis_session_service import RedisSessionService, redis_sessions

# Exportar todos los servicios
__all__ = [
    # Usuarios
    'UserService',
    'InstitutionalUserService',
    
    # Autenticación y seguridad
    'AuthService',
    'PasswordService',
    'TokenService',
    'SecurityService',
    'RoleService',
    'TwoFactorService',
    
    # Organización
    'AreaService',
    'DepartmentService',
    'DepartmentTypeService',
    'ServiceService',
    
    # Plantillas
    'ServiceTemplateService',
    'EmailTemplateService',
    
    # Servicios comunes
    'ValidationService',
    'AttachmentService',
    'CommentService',
    'LinkService',
    'StatusService',
    'EntityService',
    'MetadataService',
    'WorkflowService',
    
    # Auditoría
    'AuditService',
    
    # Solicitudes y eventos
    'RequestService',
    'EventService',
    'RecurrenceService',
    'RequestCompletionService',
    
    # Proyectos
    'ProjectService',
    'TaskService',
    
    # Multimedia
    'PodcastService',
    'CourseService',
    
    # Educación
    'ProfessorService',
    
    # Notificaciones
    'NotificationService',
    
    # Comunicación
    'send_email',
    'send_email_with_template',
    'send_welcome_email',
    'send_reset_password_email',
    'send_reset_code_email',
    'send_notification_email',
    'SmtpService',
    
    # Sistema Redis
    'RedisCacheService',
    'redis_cache',
    'RedisInitService',
    'redis_init',
    'RedisSessionService',
    'redis_sessions',
]

# Información del módulo
__version__ = "2.0.0"
__description__ = "Comprehensive service layer for MediaLab system"