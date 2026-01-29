from sqlalchemy import Column, Integer, Date, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .weekday import Weekday

class ClassSession(Base):
    __tablename__ = "class_sessions"
    session_id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    classtime_id = Column(Integer, ForeignKey("classtime.time_id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    session_date = Column(Date, nullable=False)
    weekday = Column(Enum(Weekday), nullable=False)
    curri_detail_id = Column(Integer, ForeignKey("curriculum_detail.curri_detail_id", ondelete="SET NULL"), nullable=True)
    session_order = Column(Integer, nullable=False, default=1)
    is_rescheduled = Column(Boolean, nullable=False, default=False)
    original_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    subject = relationship("Subject")
    classtime = relationship("Classtime")
    curriculum_detail = relationship("CurriculumDetail")
    teacher = relationship("User")
    class_ = relationship("Class", back_populates="sessions")
