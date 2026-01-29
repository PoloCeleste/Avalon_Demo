from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class Talent(Base):
    __tablename__ = "talents"
    talent_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    giver_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, comment="user_id")
    value = Column(Integer, nullable=False)