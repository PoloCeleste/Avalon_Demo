from sqlalchemy import Column, Integer, Enum, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
import enum
from .base import Base
from .weekday import Weekday

class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), primary_key=True)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), primary_key=True)
    time_id = Column(Integer, ForeignKey("classtime.time_id"), primary_key=True)
    
    weekday = Column(Enum(Weekday), primary_key=True, nullable=False)

    class_ = relationship("Class", back_populates="assignments")