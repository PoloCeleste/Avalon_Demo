from pydantic import BaseModel
from typing import Optional
from datetime import date

class HomeworkBase(BaseModel):
    curri_detail_id: int
    subject_id: int
    tag_name: str
    is_online: bool = False
    homework_name: str
    homework_contents: Optional[str] = None

class HomeworkCreate(HomeworkBase):
    pass

class HomeworkUpdate(BaseModel):
    tag_name: Optional[str] = None
    is_online: Optional[bool] = None
    homework_name: Optional[str] = None
    homework_contents: Optional[str] = None

class Homework(HomeworkBase):
    homework_id: int

    class Config:
        from_attributes = True

class HomeworkDueDate(BaseModel):
    homework_id: int
    tag_name: str
    subject_name: str
    assigned_date: date
    due_date: date

    class Config:
        from_attributes = True
