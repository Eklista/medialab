# app/models/__init__.py

# Importamos modelos base y asociaciones
from app.models.base import Base
from app.models.associations import user_roles, role_permissions

# Importamos módulos auth
from app.models.auth import User, Role, Permission

# Importamos módulos de organización
from app.models.organization.areas import Area
from app.models.organization.departments import Department, DepartmentType
from app.models.organization.services import Service, SubService
from app.models.organization.service_templates import ServiceTemplate

# Importamos módulos comunes
from app.models.common.email_config import SmtpConfiguration, EmailTemplate
from app.models.common.metadata import Priority, Tag, TagAssignment, ActivityType
from app.models.common.platforms import Platform
from app.models.common.workflow import Status, WorkItem, StatusHistory
from app.models.common.attachments import Attachment  # Nuevo modelo

# Importamos módulos de comunicación
from app.models.communications.comments import Comment
from app.models.communications.links import Link

# Importamos módulos de educación
from app.models.education.academic import Faculty, Career, Course, CourseClass
from app.models.education.professors import Professor  # Nuevo modelo

# Importamos módulos de multimedia
from app.models.multimedia.podcasts import PodcastSeries, PodcastEpisode

# Importamos módulos de proyectos
from app.models.projects.models import Project, Task

# Importamos módulos de solicitudes (Requests) - Nuevo paquete
from app.models.requests import (
    Request, request_services, request_sub_services,
    SingleEvent, RecurrentEvent, EventDate,
    PodcastRequest, PodcastModerator, PodcastEpisode as PodcastRequestEpisode, PodcastGuest,
    CourseRequest, CourseItem, CourseRecordingDate
)

# Importamos módulos de seguridad
from app.models.security.two_factor import TwoFactorMethod, UserTwoFactor
from app.models.security.audit_log import AuditLog  # Nuevo modelo

# Lista de todos los modelos disponibles
__all__ = [
    'Base', 'user_roles', 'role_permissions',
    'User', 'Role', 'Permission',
    'Area', 'Department', 'DepartmentType', 'Service', 'SubService', 'ServiceTemplate',
    'SmtpConfiguration', 'EmailTemplate', 'Priority', 'Tag', 'TagAssignment', 'ActivityType',
    'Platform', 'Status', 'WorkItem', 'StatusHistory', 'Attachment',
    'Comment', 'Link',
    'Faculty', 'Career', 'Course', 'CourseClass', 'Professor',
    'PodcastSeries', 'PodcastEpisode',
    'Project', 'Task',
    'TwoFactorMethod', 'UserTwoFactor', 'AuditLog',
    'Request', 'request_services', 'request_sub_services',
    'SingleEvent', 'RecurrentEvent', 'EventDate',
    'PodcastRequest', 'PodcastModerator', 'PodcastRequestEpisode', 'PodcastGuest',
    'CourseRequest', 'CourseItem', 'CourseRecordingDate'
]