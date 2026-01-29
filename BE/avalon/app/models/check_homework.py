from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from .base import Base

class CheckHomework(Base):
    __tablename__ = "check_homeworks"
    check_homework_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    homework_id = Column(Integer, ForeignKey("homeworks.homework_id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    checker_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, comment="user_id")

    __table_args__ = (UniqueConstraint('student_id', 'homework_id', 'class_id', name='_student_homework_class_uc'),)