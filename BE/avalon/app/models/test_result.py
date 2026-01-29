from sqlalchemy import Column, Integer, ForeignKey
from .base import Base

class TestResult(Base):
    __tablename__ = "test_results"
    result_id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("test.test_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    score = Column(Integer, nullable=False)