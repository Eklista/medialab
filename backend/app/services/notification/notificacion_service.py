# app/services/notifications/notification_service.py
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Notification, NotificationTrigger

class NotificationService:
    """
    Servicio para gestionar notificaciones
    """
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        content: str,
        link: Optional[str] = None,
        audit_log_id: Optional[int] = None,
        importance: int = 1
    ) -> Notification:
        """
        Crea una nueva notificación para un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario destinatario
            title: Título de la notificación
            content: Contenido de la notificación
            link: Enlace dentro de la aplicación (opcional)
            audit_log_id: ID del log de auditoría relacionado (opcional)
            importance: Nivel de importancia (1-5)
            
        Returns:
            Notification: Notificación creada
        """
        notification = Notification(
            user_id=user_id,
            audit_log_id=audit_log_id,
            title=title,
            content=content,
            link=link,
            is_read=False,
            importance=importance,
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        return notification
    
    @staticmethod
    def get_user_notifications(db: Session, user_id: int, unread_only: bool = False) -> List[Notification]:
        """
        Obtiene las notificaciones de un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            unread_only: Si solo se deben obtener las no leídas
            
        Returns:
            List[Notification]: Lista de notificaciones
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
            
        return query.order_by(Notification.created_at.desc()).all()
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> bool:
        """
        Marca una notificación como leída
        
        Args:
            db: Sesión SQLAlchemy
            notification_id: ID de la notificación
            
        Returns:
            bool: True si se marcó como leída, False si no se encontró
        """
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        
        if not notification:
            return False
            
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        db.commit()
        return True
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """
        Marca todas las notificaciones de un usuario como leídas
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            
        Returns:
            int: Número de notificaciones marcadas
        """
        now = datetime.utcnow()
        
        result = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': now
        })
        
        db.commit()
        return result
    
    @staticmethod
    def process_event(
        db: Session,
        entity_type: str,
        action: str,
        entity_id: int,
        user_id: Optional[int] = None,
        roles: Optional[List[int]] = None,
        departments: Optional[List[int]] = None
    ) -> List[Notification]:
        """
        Procesa un evento y crea notificaciones según los triggers configurados
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad
            action: Tipo de acción
            entity_id: ID de la entidad
            user_id: ID del usuario que realiza la acción
            roles: Lista de IDs de roles relacionados
            departments: Lista de IDs de departamentos relacionados
            
        Returns:
            List[Notification]: Lista de notificaciones creadas
        """
        # Buscar triggers que coincidan con el evento
        triggers = db.query(NotificationTrigger).filter(
            NotificationTrigger.entity_type == entity_type,
            NotificationTrigger.action == action
        ).all()
        
        if not triggers:
            return []
            
        created_notifications = []
        
        for trigger in triggers:
            # Determinar usuarios a notificar
            users_to_notify = set()
            
            # Por roles
            if trigger.notify_roles and roles:
                # Implementar lógica para obtener usuarios con estos roles
                pass
                
            # Por departamentos
            if trigger.notify_departments and departments:
                # Implementar lógica para obtener usuarios de estos departamentos
                pass
                
            # Crear notificaciones para cada usuario
            for user_id in users_to_notify:
                notification = NotificationService.create_notification(
                    db=db,
                    user_id=user_id,
                    title=f"Acción en {entity_type}",  # Mejorar el título según contexto
                    content=f"Se ha realizado la acción '{action}' en {entity_type} #{entity_id}",  # Mejorar contenido
                    link=f"/{entity_type}/{entity_id}",  # Construir enlace adecuado
                    importance=trigger.importance or 1
                )
                
                created_notifications.append(notification)
                
        return created_notifications