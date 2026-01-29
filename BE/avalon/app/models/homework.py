from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Homework(Base):
    __tablename__ = "homeworks"
    homework_id = Column(Integer, primary_key=True, autoincrement=True)
    curri_detail_id = Column(Integer, ForeignKey("curriculum_detail.curri_detail_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    tag_name = Column(String(20), nullable=False)
    is_online = Column(Boolean, nullable=False, default=False)
    homework_name = Column(String(100), nullable=False)
    homework_contents = Column(Text, nullable=True)

    # Relationships
    curriculum_detail = relationship("CurriculumDetail", back_populates="homeworks")
