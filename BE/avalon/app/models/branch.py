from sqlalchemy import Column, Integer, String, Text
from .base import Base

class Branch(Base):
    __tablename__ = "branches"
    
    branch_id = Column(Integer, primary_key=True, autoincrement=True)
    branch_name = Column(String(255), nullable=False)
    branch_phone = Column(String(20), nullable=False)
    branch_address = Column(Text, nullable=True)