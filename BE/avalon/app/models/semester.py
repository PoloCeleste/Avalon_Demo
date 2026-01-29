from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
import enum
from .base import Base

class SemesterSeason(str, enum.Enum):
    Spring = "Spring"
    Summer = "Summer"
    Fall = "Fall"
    Winter = "Winter"

class Semester(Base):
    __tablename__ = "semesters"
    semester_id = Column(Integer, primary_key=True, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False)
    semester_name = Column(String(50), nullable=False)
    semester_start_at = Column(Date, nullable=False)
    semester_end_at = Column(Date, nullable=False)
    season = Column(Enum(SemesterSeason), nullable=False)
    status = Column(SmallInteger, nullable=False, default=0)  # 0: 준비, 1: 진행, 2: 지남
    classes = relationship("Class", back_populates="semester", passive_deletes=True)