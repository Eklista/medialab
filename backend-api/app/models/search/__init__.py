"""
Modelos de búsqueda
==================

Modelos relacionados con el sistema de búsqueda e indexación.
"""

# Importamos todos los modelos de sus archivos individuales
from .index import SearchIndex, EntityType
from .saved import SavedSearch, SortDirection
from .extended import GlobalSearchConfig, SearchHistory, SearchSuggestion, QuickFilter


__all__ = [
    "SearchIndex", "EntityType",
    "SavedSearch", "SortDirection",
    "GlobalSearchConfig", "SearchHistory", "SearchSuggestion", "QuickFilter"
]
