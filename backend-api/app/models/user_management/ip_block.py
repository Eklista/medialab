"""
Modelo de bloqueos de IP
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer
from datetime import datetime

from ..base import BaseModel


class IpBlock(BaseModel):
    """
    IP blocking for security purposes
    """
    __tablename__ = "ip_blocks"
    ip_address = Column(String(45), nullable=False, index=True)  # IPv6 compatible
    ip_range = Column(String(100))  # CIDR notation for range blocks
    
    # Block details
    reason = Column(String(200), nullable=False)
    description = Column(Text)
    block_type = Column(String(50), default="manual")  # manual, automatic, temporary
    
    # Duration
    blocked_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True))  # NULL for permanent blocks
    
    # Status
    is_active = Column(Boolean, default=True)
    unblocked_at = Column(DateTime(timezone=True))
    unblocked_reason = Column(String(200))
    
    # Tracking
    failed_attempts = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True))
    
    # Admin info
    blocked_by_admin = Column(String(200))  # Admin who created the block
    unblocked_by_admin = Column(String(200))  # Admin who removed the block
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<IpBlock(id={self.id}, ip_address='{self.ip_address}', is_active={self.is_active})>"