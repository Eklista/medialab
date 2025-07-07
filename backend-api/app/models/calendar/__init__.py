"""
Modelos de calendario
====================

Modelos relacionados con el sistema de calendario y eventos.
"""

# Importamos todos los modelos de sus archivos individuales
from .event import (
    CalendarEvent, EventAttendee, EventResource,
    EventVisibility, EventStatus, AttendanceStatus,
    EventRole, ResourceType, ResourceStatus
)
from .subscription import CalendarSubscription, SubscriptionType
from .seeder import EventType, LinkPlatform
from .extended import CalendarView, RecurringEvent, PodcastEpisode


__all__ = [
    "CalendarEvent", "EventAttendee", "EventResource",
    "EventVisibility", "EventStatus", "AttendanceStatus",
    "EventRole", "ResourceType", "ResourceStatus",
    "CalendarSubscription", "SubscriptionType",
    "EventType", "LinkPlatform", "CalendarView", "RecurringEvent", "PodcastEpisode"
]
