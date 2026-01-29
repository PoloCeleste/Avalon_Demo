from sqlalchemy import Column, Integer, String
from .base import Base

class Subject(Base):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True, autoincrement=True)
    subject_name = Column(String(100), nullable=False)
    subject_nick = Column(String(20), nullable=False)