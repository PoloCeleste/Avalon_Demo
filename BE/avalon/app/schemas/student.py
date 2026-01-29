from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from ..models.student import StudentStatus

class StudentBase(BaseModel):
    student_name: str
    branch_id: int
    english_name: Optional[str] = None
    student_phone: Optional[str] = None
    parent_phone: Optional[str] = None
    school: Optional[str] = None
    s_year: Optional[int] = None
    birthday: Optional[date] = None
    status: StudentStatus = StudentStatus.ACTIVE

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    student_name: Optional[str] = None
    english_name: Optional[str] = None
    student_phone: Optional[str] = None
    parent_phone: Optional[str] = None
    school: Optional[str] = None
    s_year: Optional[int] = None
    birthday: Optional[date] = None
    status: Optional[StudentStatus] = None

class StudentInDB(StudentBase):
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Student(StudentInDB):
    pass