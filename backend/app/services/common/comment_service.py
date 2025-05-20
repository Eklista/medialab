# app/services/common/comment_service.py
from typing import List, Optional, Any
from sqlalchemy.orm import Session

from app.models.communications.comments import Comment

class CommentService:
    """
    Servicio para gestionar comentarios asociados a entidades
    """
    
    @staticmethod
    def get_entity_comments(db: Session, entity: Any, entity_type: str = None) -> List[Comment]:
        """
        Obtiene los comentarios asociados a una entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad
            entity_type: Tipo de entidad. Si no se proporciona, se deriva del nombre de la tabla
                                     
        Returns:
            List[Comment]: Lista de comentarios
            
        Raises:
            ValueError: Si no se proporciona una sesión válida
        """
        if not db:
            raise ValueError("Se requiere una sesión activa")
            
        if not entity_type:
            entity_type = entity.__tablename__
            if entity_type.endswith('s'):
                entity_type = entity_type[:-1]
                
        return db.query(Comment).filter(
            Comment.entity_type == entity_type,
            Comment.entity_id == entity.id
        ).order_by(Comment.created_at).all()
    
    @staticmethod
    def add_comment(db: Session, entity: Any, content: str, author_id: int, 
                    is_client_comment: bool = False, institutional_user_id: int = None) -> Comment:
        """
        Añade un comentario a una entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad
            content: Texto del comentario
            author_id: ID del autor
            is_client_comment: Si es un comentario del cliente
            institutional_user_id: ID del usuario institucional si aplica
            
        Returns:
            Comment: Instancia del comentario creado
            
        Raises:
            ValueError: Si no se proporciona una sesión válida
        """
        if not db:
            raise ValueError("Se requiere una sesión activa")
        
        entity_type = entity.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        comment = Comment(
            content=content,
            entity_type=entity_type,
            entity_id=entity.id,
            author_id=author_id,
            is_client_comment=is_client_comment,
            institutional_user_id=institutional_user_id
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        return comment
    
    @staticmethod
    def add_reply(db: Session, parent_comment_id: int, content: str, 
                  author_id: int, is_client_comment: bool = False) -> Optional[Comment]:
        """
        Añade una respuesta a un comentario existente
        
        Args:
            db: Sesión SQLAlchemy
            parent_comment_id: ID del comentario padre
            content: Texto de la respuesta
            author_id: ID del autor de la respuesta
            is_client_comment: Si es una respuesta del cliente
            
        Returns:
            Optional[Comment]: Instancia de la respuesta creada o None si no se encontró el comentario padre
        """
        parent = db.query(Comment).filter(Comment.id == parent_comment_id).first()
        if not parent:
            return None
        
        reply = Comment(
            content=content,
            entity_type=parent.entity_type,
            entity_id=parent.entity_id,
            author_id=author_id,
            is_client_comment=is_client_comment,
            parent_id=parent_comment_id
        )
        
        db.add(reply)
        db.commit()
        db.refresh(reply)
        
        return reply
    
    @staticmethod
    def delete_comment(db: Session, comment_id: int, delete_replies: bool = True) -> bool:
        """
        Elimina un comentario y opcionalmente sus respuestas
        
        Args:
            db: Sesión SQLAlchemy
            comment_id: ID del comentario a eliminar
            delete_replies: Si también se deben eliminar las respuestas
            
        Returns:
            bool: True si se eliminó correctamente, False si no se encontró
        """
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return False
        
        # Si delete_replies es False y tiene respuestas, marcar como eliminado en lugar de eliminar
        if not delete_replies and comment.replies:
            from datetime import datetime
            comment.deleted_at = datetime.utcnow()
            comment.content = "[Comentario eliminado]"
            db.commit()
            return True
        
        # De lo contrario, eliminar el comentario y sus respuestas
        db.delete(comment)
        db.commit()
        return True