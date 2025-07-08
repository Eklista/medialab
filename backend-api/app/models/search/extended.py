"""
Search Extended Models - Configuración, historial y sugerencias de búsqueda
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel

class GlobalSearchConfig(BaseModel):
    """
    Configuración global de búsqueda
    Configuraciones del motor de búsqueda y indexación
    """
    __tablename__ = "global_search_configs"    # Configuración del índice
    index_name = Column(String(100), nullable=False, unique=True)
    entity_type = Column(String(100), nullable=False)  # 'projects', 'tasks', 'users', etc.
    
    # Configuración de campos
    searchable_fields = Column(JSON)  # Campos que se pueden buscar
    filterable_fields = Column(JSON)  # Campos por los que se puede filtrar
    sortable_fields = Column(JSON)  # Campos por los que se puede ordenar
    
    # Configuración de pesos
    field_weights = Column(JSON)  # Peso de cada campo en el ranking
    boost_recent = Column(Boolean, default=True)
    recent_boost_factor = Column(Integer, default=2)
    
    # Control de indexación
    auto_index = Column(Boolean, default=True)
    index_frequency_minutes = Column(Integer, default=60)
    last_indexed_at = Column(DateTime(timezone=True))
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<GlobalSearchConfig(index='{self.index_name}', entity='{self.entity_type}')>"

class SearchHistory(BaseModel):
    """
    Historial de búsquedas
    Registro del historial de búsquedas por usuario
    """
    __tablename__ = "search_histories"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Términos de búsqueda
    search_query = Column(String(500), nullable=False)
    search_type = Column(String(50), index=True)  # 'global', 'projects', 'inventory', etc.
    
    # Contexto
    search_context = Column(String(100))  # Sección desde donde se buscó
    filters_applied = Column(JSON)
    
    # Resultado
    results_count = Column(Integer, default=0)
    clicked_result = Column(Boolean, default=False)
    result_clicked_id = Column(String(100))
    
    # Timestamps
    searched_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Relaciones    user = relationship("User", back_populates="global_search_configs")
    
    def __repr__(self):
        return f"<SearchHistory(user_id={self.user_id}, query='{self.search_query}')>"

class SearchSuggestion(BaseModel):
    """
    Sugerencias de búsqueda
    Sugerencias automáticas basadas en contenido y búsquedas populares
    """
    __tablename__ = "search_suggestions"    # Término sugerido
    suggestion_text = Column(String(500), nullable=False, index=True)
    suggestion_type = Column(String(50), nullable=False)  # 'autocomplete', 'popular', 'related'
    
    # Contexto
    context_type = Column(String(50))  # En qué contexto aparece la sugerencia
    category = Column(String(100))
    
    # Métricas
    usage_count = Column(Integer, default=0)
    success_rate = Column(Integer, default=0)  # Porcentaje de veces que llevó a resultados útiles
    
    # Control
    is_active = Column(Boolean, default=True)
    is_promoted = Column(Boolean, default=False)  # Sugerencias promovidas aparecen primero
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<SearchSuggestion(text='{self.suggestion_text}', type='{self.suggestion_type}')>"

class QuickFilter(BaseModel):
    """
    Filtros rápidos
    Filtros predefinidos para búsquedas comunes
    """
    __tablename__ = "quick_filters"    # Información del filtro
    name = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    
    # Configuración del filtro
    filter_config = Column(JSON, nullable=False)  # Configuración completa del filtro
    applies_to = Column(String(100), nullable=False)  # 'projects', 'tasks', 'inventory', etc.
    
    # Control de acceso
    created_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    is_public = Column(Boolean, default=False)
    is_system = Column(Boolean, default=False)  # Filtros del sistema vs. usuarios
    
    # Orden y categorización
    category = Column(String(100))
    sort_order = Column(Integer, default=0)
    
    # Estadísticas
    usage_count = Column(Integer, default=0)
    
    # Control
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime(timezone=True))
    
    # Relaciones    created_by = relationship("User", back_populates="created_global_search_configs")
    
    def __repr__(self):
        return f"<QuickFilter(name='{self.name}', applies_to='{self.applies_to}')>"
