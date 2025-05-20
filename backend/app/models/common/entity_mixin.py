# app/models/common/entity_mixin.py

class EntityMixin:
    """
    Mixin para añadir funcionalidades comunes a entidades principales
    """
    
    @property
    def comments(self):
        """Obtiene los comentarios asociados a esta entidad"""
        from sqlalchemy.orm import object_session
        from app.models.communications.comments import Comment
        
        session = object_session(self)
        if not session:
            return []
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]  # Convertir plural a singular
            
        return Comment.get_for_entity(session, entity_type, self.id)
    
    @property
    def links(self):
        """Obtiene los enlaces asociados a esta entidad"""
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        return Link.get_for_entity(session, entity_type, self.id)
    
    def add_comment(self, session, content, author_id, is_client_comment=False):
        """Añade un comentario a esta entidad"""
        from app.models.communications.comments import Comment
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        comment = Comment(
            content=content,
            entity_type=entity_type,
            entity_id=self.id,
            author_id=author_id,
            is_client_comment=is_client_comment
        )
        
        session.add(comment)
        return comment
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """Añade un enlace a esta entidad"""
        from app.models.communications.links import Link
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )