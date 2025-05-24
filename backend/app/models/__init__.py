# app/models/__init__.py

# Base
from app.models.base import Base

# Modelos base y asociaciones
from app.models.associations import user_roles, role_permissions

# Módulos auth
from app.models.auth import User, Role, Permission

# Módulos de usuarios institucionales
from app.models.organization.institutional_users import InstitutionalUser

# Módulos de organización
from app.models.organization.areas import Area
from app.models.organization.departments import Department, DepartmentType
from app.models.organization.services import Service, SubService
from app.models.organization.service_templates import ServiceTemplate

# Módulos comunes
from app.models.common.email_config import SmtpConfiguration, EmailTemplate
from app.models.common.metadata import Priority, Tag, TagAssignment, ActivityType
from app.models.common.platforms import Platform
from app.models.common.workflow import Status, WorkItem, StatusHistory
from app.models.common.attachments import Attachment

# Comunicación
from app.models.communications.comments import Comment
from app.models.communications.links import Link

# Educación
from app.models.education.academic import Career, Course, CourseClass
from app.models.education.professors import Professor
from app.models.education.academic_periods import AcademicPeriod

# Módulos de multimedia
from app.models.multimedia.podcasts import PodcastSeries, PodcastEpisode

# Importamos módulos de proyectos
from app.models.projects.models import Project, Task

# Módulos de solicitudes
from app.models.requests import (
    Request, request_services, request_sub_services,
    SingleEvent, RecurrentEvent, EventDate,
    PodcastRequest, PodcastModerator, PodcastRequestEpisode, PodcastGuest,
    CourseRequest, CourseItem, CourseRecordingDate
)

# Notificaciones
from app.models.notifications.models import Notification
from app.models.notifications.triggers import NotificationTrigger

# Módulos de seguridad
from app.models.security.two_factor import TwoFactorMethod, UserTwoFactor
from app.models.security.audit_log import AuditLog
from app.models.security.token_blacklist import TokenBlacklist 

# Lista de todos los modelos
__all__ = [
    'Base', 'user_roles', 'role_permissions',
    'User', 'Role', 'Permission',
    'Area', 'Department', 'DepartmentType', 'Service', 'SubService', 'ServiceTemplate',
    'SmtpConfiguration', 'EmailTemplate', 'Priority', 'Tag', 'TagAssignment', 'ActivityType',
    'Platform', 'Status', 'WorkItem', 'StatusHistory', 'Attachment',
    'Comment', 'Link',
    'Career', 'Course', 'CourseClass', 'Professor', 'AcademicPeriod',
    'PodcastSeries', 'PodcastEpisode',
    'Project', 'Task',
    'TwoFactorMethod', 'UserTwoFactor', 'AuditLog', 'TokenBlacklist',
    'Request', 'request_services', 'request_sub_services',
    'SingleEvent', 'RecurrentEvent', 'EventDate',
    'PodcastRequest', 'PodcastModerator', 'PodcastRequestEpisode', 'PodcastGuest',
    'CourseRequest', 'CourseItem', 'CourseRecordingDate',
    'InstitutionalUser',
    'Notification', 'NotificationTrigger'
]