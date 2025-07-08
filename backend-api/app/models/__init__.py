"""
Modelos de la aplicación Medialab
================================

Este módulo contiene todos los modelos de datos de la aplicación.
Organizados por funcionalidad en submódulos para facilitar el mantenimiento.
"""

# Modelos base
from .base import Base

# Importaciones desde submódulos organizados
from .user_management import User, UserType, EmployeeRole, UserDevice, IpBlock
from .audit import AuditLog, AuditLogType, AuditRetentionPolicy, AuditAlert, AuditStatistics
from .requests import Request, RequestComment, RequestAttachment, ProjectTemplate
from .projects import (
    ProjectStatus, ProjectPriority, ProjectType, Project,
    ProjectMember, ProjectResource, ProjectDocument, Course, Podcast
)
from .tasks import (
    TaskStatus, TaskPriority, TaskType, Task,
    TaskComment, TaskAttachment, TaskTimeLog, TaskDependency, TaskAssignment,
    Deliverable, TaskApproval, TaskLink
)
from .inventory import (
    InventoryItemStatus, InventoryCategory, InventoryItem,
    InventoryMovement, MaintenanceRecord, InventoryReservation,
    Equipment, Supply
)
from .calendar import (
    CalendarEvent, EventAttendee, EventResource, CalendarSubscription,
    EventVisibility, EventStatus, AttendanceStatus, EventRole, ResourceType, ResourceStatus, SubscriptionType
)
from .reports import (
    ReportTemplate, GeneratedReport, KPIDefinition, KPIValue,
    ReportCategory, ReportType, GenerationType, GenerationStatus, KPICategory, CalculationFrequency
)
from .search import SearchIndex, SavedSearch, EntityType, SortDirection
from .communication import (
    Notification, UserNotificationPreference, Comment,
    NotificationStatus, NotificationFrequency, CommentableType, CommentType
)
from .university import Unit, UnitType, Professor, ProfessorUnit
from .app_settings import (
    Configuration, ConfigurationHistory, StatusType, StatusOption, PriorityOption,
    ServiceCategory, ServiceType, DurationType,
    ConfigurationType, ChangeType, UserTypeSetting, DashboardType,
    DeliverableType, PodcastEpisodeDraft, CourseClassDraft, DraftStatus
)

# Otros submódulos (por implementar)
# Ya todos están implementados ✅

__all__ = [
    # Base
    "Base",
    
    # Core
    "Area", "Space", "ServiceType", "Service", "Requirement",
    "Category", "Status", "Priority",
    
    # Gestión de Usuarios
    "User", "UserType", "EmployeeRole", "UserDevice", "IpBlock",
    
    # Auditoría
    "AuditLog", "AuditLogType", "AuditRetentionPolicy", "AuditAlert", "AuditStatistics",
    
    # Solicitudes
    "Request", "RequestComment", "RequestAttachment", "ProjectTemplate",
    
    # Proyectos
    "ProjectStatus", "ProjectPriority", "ProjectType", "Project",
    "ProjectMember", "ProjectResource", "ProjectDocument", "Course", "Podcast",
    
    # Tareas
    "TaskStatus", "TaskPriority", "TaskType", "Task",
    "TaskComment", "TaskAttachment", "TaskTimeLog", "TaskDependency", "TaskAssignment",
    "Deliverable", "TaskApproval", "TaskLink",
    
    # Inventario
    "InventoryItemStatus", "InventoryCategory", "InventoryItem",
    "InventoryMovement", "MaintenanceRecord", "InventoryReservation",
    "Equipment", "Supply",
    
    # Calendario
    "CalendarEvent", "EventAttendee", "EventResource", "CalendarSubscription",
    "EventVisibility", "EventStatus", "AttendanceStatus", "EventRole", "ResourceType", "ResourceStatus", "SubscriptionType",
    
    # Reportes
    "ReportTemplate", "GeneratedReport", "KPIDefinition", "KPIValue",
    "ReportCategory", "ReportType", "GenerationType", "GenerationStatus", "KPICategory", "CalculationFrequency",
    
    # Búsqueda
    "SearchIndex", "SavedSearch", "EntityType", "SortDirection",
    
    # Comunicación
    "Notification", "UserNotificationPreference", "Comment",
    "NotificationStatus", "NotificationFrequency", "CommentableType", "CommentType",
    
    # Universidad
    "Unit", "UnitType", "Professor", "ProfessorUnit",
    
    # Configuración
    "Configuration", "ConfigurationHistory", "StatusType", "StatusOption", "PriorityOption",
    "ServiceCategory", "ServiceType", "DurationType",
    "ConfigurationType", "ChangeType", "UserTypeSetting", "DashboardType",
    "DeliverableType", "PodcastEpisodeDraft", "CourseClassDraft", "DraftStatus",
]
