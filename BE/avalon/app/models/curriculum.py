
from sqlalchemy import Column, Integer, String, DateTime, func, Enum
from .base import Base

class Curriculum(Base):
    __tablename__ = "curriculums"
    curriculum_id = Column(Integer, primary_key=True, autoincrement=True)
    curriculum_name = Column(String(100), nullable=False)
    type = Column(Enum('langcon', 'avalon', name='curriculumtype'), nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    deleted_at = Column(DateTime, nullable=True)