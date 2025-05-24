# backend/app/models/security/token_blacklist.py

from sqlalchemy import Column, String, Integer, DateTime, Enum, Index
from sqlalchemy.sql import func
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base

class TokenBlacklist(Base):
    """
    Modelo para tokens en blacklist (revocados/invalidados)
    """
    __tablename__ = 'token_blacklist'
    
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(String(32), nullable=False, unique=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    
    token_type = Column(
        Enum('access', 'refresh', 'user_invalidation', name='token_type_enum'),
        nullable=False,
        default='access'
    )
    
    blacklisted_at = Column(
        DateTime, 
        nullable=False, 
        default=datetime.utcnow,
        server_default=func.current_timestamp()
    )
    
    expires_at = Column(DateTime, nullable=False, index=True)
    reason = Column(String(100), nullable=False, default='logout')
    
    # Índices adicionales para consultas optimizadas
    __table_args__ = (
        Index('idx_token_blacklist_token_id', 'token_id'),
        Index('idx_token_blacklist_user_id', 'user_id'),
        Index('idx_token_blacklist_expires_at', 'expires_at'),
        Index('idx_token_blacklist_type_expires', 'token_type', 'expires_at'),
        Index('idx_token_blacklist_user_expires', 'user_id', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<TokenBlacklist(token_id='{self.token_id}', user_id={self.user_id}, type='{self.token_type}')>"

    @classmethod
    def is_token_blacklisted(cls, db_session, token_id: str) -> bool:
        """
        Verifica si un token está en blacklist y no ha expirado
        """
        return db_session.query(cls).filter(
            cls.token_id == token_id,
            cls.expires_at > datetime.utcnow()
        ).first() is not None

    @classmethod
    def add_token_to_blacklist(cls, db_session, token_id: str, user_id: int = None, 
                              token_type: str = 'access', expires_at: datetime = None, 
                              reason: str = 'logout') -> bool:
        """
        Añade un token a la blacklist
        """
        try:
            blacklist_entry = cls(
                token_id=token_id,
                user_id=user_id,
                token_type=token_type,
                expires_at=expires_at,
                reason=reason
            )
            db_session.add(blacklist_entry)
            db_session.commit()
            return True
        except Exception:
            db_session.rollback()
            return False

    @classmethod
    def cleanup_expired_tokens(cls, db_session) -> int:
        """
        Elimina tokens expirados de la blacklist
        """
        deleted_count = db_session.query(cls).filter(
            cls.expires_at < datetime.utcnow()
        ).delete()
        db_session.commit()
        return deleted_count