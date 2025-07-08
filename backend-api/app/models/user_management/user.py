"""
Modelo principal de usuario
"""

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class User(BaseModel):
    """
    Users table - all types of users in the system
    """
    __tablename__ = "users"    # Basic Info
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    
    # User Classification
    user_type_id = Column(Integer, ForeignKey("user_types.id"), nullable=False, index=True)
    employee_role_id = Column(Integer, ForeignKey("employee_roles.id"), nullable=True, index=True)
    
    # Status
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Profile
    phone = Column(String(20))
    profile_picture = Column(String(500))  # URL or path
    bio = Column(Text)
    
    # Activity tracking
    last_login = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True))
    
    # Preferences
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="es")
    notification_preferences = Column(JSON)  # JSON string
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships    created_report_templates = relationship("ReportTemplate", foreign_keys="created_by_user_id", back_populates="created_by_user")
    career_instructions = relationship("Career", back_populates="instructor")
    calendar_subscriptions = relationship("CalendarSubscription", back_populates="user")
    calendar_views = relationship("CalendarView", back_populates="user")
    calendar_events = relationship("CalendarEvent", back_populates="user")
    created_global_search_configs = relationship("GlobalSearchConfig", back_populates="created_by")
    global_search_configs = relationship("GlobalSearchConfig", back_populates="user")
    received_notification_batches = relationship("NotificationBatch", back_populates="recipient")
    created_notification_batches = relationship("NotificationBatch", back_populates="created_by")
    created_comment_reactions = relationship("CommentReaction", back_populates="created_by")
    user_type = relationship("UserType", back_populates="users")
    employee_role = relationship("EmployeeRole", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    inventory_reservations = relationship("InventoryReservation", back_populates="reserved_by", foreign_keys="InventoryReservation.reserved_by_id")
    inventory_reservation_approvals = relationship("InventoryReservation", back_populates="approved_by", foreign_keys="InventoryReservation.approved_by_id")
    inventory_movements = relationship("InventoryMovement", back_populates="user", foreign_keys="InventoryMovement.user_id")
    generated_reports = relationship("GeneratedReport", back_populates="generated_by")
    analytics_events = relationship("AnalyticsEvent", back_populates="user")
    custom_dashboards = relationship("CustomDashboard", back_populates="user")
    created_reports = relationship("ReportTemplate", back_populates="created_by")
    hosted_podcasts = relationship("Podcast", back_populates="host", foreign_keys="Podcast.host_id")
    produced_podcasts = relationship("Podcast", back_populates="producer", foreign_keys="Podcast.producer_id")
    uploaded_documents = relationship("ProjectDocument", back_populates="uploaded_by")
    managed_projects = relationship("Project", back_populates="manager")
    instructed_courses = relationship("Course", back_populates="instructor")
    project_memberships = relationship("ProjectMember", back_populates="user")
    created_events = relationship("CalendarEvent", back_populates="created_by")
    user_devices = relationship("UserDevice", back_populates="user")
    saved_searches = relationship("SavedSearch", back_populates="user")
    task_assignments = relationship("TaskAssignment", back_populates="user")
    task_comments = relationship("TaskComment", back_populates="author")
    task_time_logs = relationship("TaskTimeLog", back_populates="user")
    uploaded_attachments = relationship("TaskAttachment", back_populates="uploaded_by")
    assigned_tasks = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    created_tasks = relationship("Task", back_populates="created_by", foreign_keys="Task.created_by_id")
    configuration_changes = relationship("Configuration", back_populates="changed_by", foreign_keys="Configuration.changed_by_id")
    configuration_approvals = relationship("Configuration", back_populates="approved_by", foreign_keys="Configuration.approved_by_id")
    client_requests = relationship("Request", back_populates="client")
    evaluated_requests = relationship("Request", back_populates="evaluated_by")
    request_comments = relationship("RequestComment", back_populates="user")
    uploaded_request_attachments = relationship("RequestAttachment", back_populates="uploaded_by")
    comment_reactions = relationship("CommentReaction", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    task_approvals = relationship("TaskApproval", back_populates="reviewer")
    supply_deliveries = relationship("SupplyDelivery", back_populates="delivered_by")
    equipment_assignments = relationship("TaskEquipment", back_populates="assigned_by")
    inventory_assignments = relationship("InventoryMovement", back_populates="assigned_to")
    inventory_processing = relationship("InventoryMovement", back_populates="processed_by")
    maintenance_records = relationship("MaintenanceRecord", back_populates="performed_by")
    assigned_inventory_items = relationship("InventoryItem", back_populates="assigned_to")
    task_assignment_assignments = relationship("TaskAssignment", back_populates="assigned_by")
    deliverable_types = relationship("DeliverableType", back_populates="user")
    audit_statistics = relationship("AuditStatistics", back_populates="most_active_user")
    created_calendar_events = relationship("CalendarEvent", back_populates="created_by_user")    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"
