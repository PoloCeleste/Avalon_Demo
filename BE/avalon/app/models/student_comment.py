from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class StudentComment(Base):
    __tablename__ = "student_comment"
    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    comment = Column(Text, nullable=False)
    comment_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, comment="user_id")
    created_at = Column(DateTime, nullable=False, default=func.now())