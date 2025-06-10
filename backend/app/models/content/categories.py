from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class ContentCategory(Base):
    __tablename__ = 'content_categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    content = relationship("Content", back_populates="category")
    department_categories = relationship("DepartmentCategory", back_populates="category")

class DepartmentCategory(Base):
    __tablename__ = 'department_categories'
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('content_categories.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    
    department = relationship("Department", back_populates="department_categories")
    category = relationship("ContentCategory", back_populates="department_categories")
    
    __table_args__ = (
        UniqueConstraint('department_id', 'category_id', name='unique_dept_category'),
    )
