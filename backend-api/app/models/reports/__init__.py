"""
Modelos de reportes
==================

Modelos relacionados con el sistema de reportes y análisis.
"""

# Importamos todos los modelos de sus archivos individuales
from .template import ReportTemplate, ReportCategory, ReportType
from .generated import GeneratedReport, GenerationType, GenerationStatus
from .kpi import KPIDefinition, KPIValue, KPICategory, CalculationFrequency
from .analytics import AnalyticsEvent, SearchAnalytics
from .dashboard import CustomDashboard, DashboardWidget


__all__ = [
    "ReportTemplate", "ReportCategory", "ReportType",
    "GeneratedReport", "GenerationType", "GenerationStatus",
    "KPIDefinition", "KPIValue", "KPICategory", "CalculationFrequency",
    "AnalyticsEvent", "SearchAnalytics", "CustomDashboard", "DashboardWidget"
]
