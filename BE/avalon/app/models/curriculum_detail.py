from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class CurriculumDetail(Base):
    __tablename__ = "curriculum_detail"
    curri_detail_id = Column(Integer, primary_key=True, autoincrement=True)
    curriculum_id = Column(Integer, ForeignKey("curriculums.curriculum_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    day = Column('DAY', Integer, nullable=False)
    progress = Column(String(100), nullable=False)

    # Relationships
    homeworks = relationship("Homework", back_populates="curriculum_detail")
