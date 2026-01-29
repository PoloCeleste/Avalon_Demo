from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship

from .base import Base

class Class(Base):
    __tablename__ = "classes"
    class_id = Column(Integer, primary_key=True, autoincrement=True)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id", ondelete="CASCADE"), nullable=False)
    curriculum_id = Column(Integer, ForeignKey("curriculums.curriculum_id"), nullable=False)
    class_name = Column(String(100), nullable=False)
    attend_day = Column(String(100), nullable=False, comment="구분자 /")
    kr_homeroom_id = Column('kr_homeroom', Integer, ForeignKey("users.user_id"), nullable=False)
    fr_homeroom_id = Column('fr_homeroom', Integer, ForeignKey("users.user_id"), nullable=False)
    schedule_details_json = Column(JSON, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)

    semester = relationship("Semester", back_populates="classes", passive_deletes=True)
    sessions = relationship("ClassSession", back_populates="class_", cascade="all, delete-orphan")
    students = relationship("ClassStudent", back_populates="class_", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="class_", cascade="all, delete-orphan")
    assignments = relationship("TeacherAssignment", back_populates="class_", cascade="all, delete-orphan")