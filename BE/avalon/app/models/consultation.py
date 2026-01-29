from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class Consultation(Base):
    __tablename__ = "consultations"
    consultation_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, comment="user_id")
    consultation_name = Column(String(255), nullable=True)
    consultation_detail = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, default=False)