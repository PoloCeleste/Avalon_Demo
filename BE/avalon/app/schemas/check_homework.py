from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CheckHomeworkBase(BaseModel):
    student_id: int
    homework_id: int
    class_id: int # Added class_id
    checker_id: int

class CheckHomeworkCreate(CheckHomeworkBase):
    pass

class CheckHomework(CheckHomeworkBase):
    check_homework_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True