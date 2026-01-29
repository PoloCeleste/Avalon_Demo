from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Enum,
    ForeignKey
)
from sqlalchemy.sql import func
import enum
from .base import Base

class StudentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    WITHDRAWN = "WITHDRAWN"
    DELETED = "DELETED"

class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False)
    student_name = Column(String(20), nullable=False)
    english_name = Column(String(100), nullable=True)
    student_phone = Column(String(20), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    school = Column(String(255), nullable=True)
    s_year = Column(Integer, nullable=True)
    birthday = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
    status = Column(Enum(StudentStatus), nullable=False, default=StudentStatus.ACTIVE)