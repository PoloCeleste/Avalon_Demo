from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConsultationBase(BaseModel):
    student_id: int
    semester_id: int
    consultant_id: int
    consultation_name: Optional[str] = None
    consultation_detail: Optional[str] = None
    is_deleted: bool = False

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    consultation_name: Optional[str] = None
    consultation_detail: Optional[str] = None
    is_deleted: Optional[bool] = None

class Consultation(ConsultationBase):
    consultation_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True