from sqlalchemy import event
from sqlalchemy.orm.attributes import get_history
import json

class AuditMixin:
    """
    Mixin para añadir capacidades de auditoría a los modelos principales
    """
    
    @classmethod
    def __declare_last__(cls):
        """Se ejecuta después de mapear la clase"""
        # Registra eventos para insert, update y delete
        event.listen(cls, 'after_insert', cls._after_insert)
        event.listen(cls, 'after_update', cls._after_update)
        event.listen(cls, 'after_delete', cls._after_delete)
    
    @staticmethod
    def _after_insert(mapper, connection, target):
        """Audita inserciones"""
        if hasattr(target, '_no_audit') and target._no_audit:
            return
            
        session = object_session(target)
        if not session:
            return
            
        # Obtener datos a auditar
        new_values = {}
        for c in target.__table__.columns:
            if not c.name.startswith('_'):
                new_values[c.name] = getattr(target, c.name)
        
        # Obtener usuario actual
        user_id = _get_current_user_id()
        
        # Registrar auditoría
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            session, 'create', target, user_id,
            new_values=new_values
        )
