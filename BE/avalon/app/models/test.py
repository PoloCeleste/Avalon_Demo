from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from .base import Base

class Test(Base):
    __tablename__ = "test"
    test_id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    test_title = Column(String(100), nullable=False)
    test_day = Column(Date, nullable=False)
    classtime_ids = Column(JSON, nullable=True)

    # Relationship
    subject = relationship("Subject")
    class_ = relationship("Class", back_populates="tests")
