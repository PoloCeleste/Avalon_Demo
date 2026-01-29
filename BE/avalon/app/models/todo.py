from sqlalchemy import Column, Integer, Enum, Text, ForeignKey
import enum
from .base import Base

class TodoType(str, enum.Enum):
    NOTICE = "NOTICE"
    BEFORE = "BEFORE"
    IN = "IN"

class Todo(Base):
    __tablename__ = "todos"
    todo_id = Column(Integer, primary_key=True, autoincrement=True)
    curri_detail_id = Column(Integer, ForeignKey("curriculum_detail.curri_detail_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    todo_type = Column(Enum(TodoType), nullable=False)
    todo_thing = Column(Text, nullable=False)