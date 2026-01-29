from sqlalchemy import Column, Integer, Time
from .base import Base

class Classtime(Base):
    __tablename__ = "classtime"
    time_id = Column(Integer, primary_key=True, autoincrement=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)