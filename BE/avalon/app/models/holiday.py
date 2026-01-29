from sqlalchemy import Column, Integer, String, Date
from .base import Base

class Holiday(Base):
    __tablename__ = "holidays"
    holiday_id = Column(Integer, primary_key=True, autoincrement=True)
    holiday_name = Column(String(255), nullable=False)
    holiday_date = Column(Date, nullable=False)