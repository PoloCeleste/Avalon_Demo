from pydantic import BaseModel
from typing import Optional

class SubjectBase(BaseModel):
    subject_name: str
    subject_nick: str

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    subject_nick: Optional[str] = None

class Subject(SubjectBase):
    subject_id: int
    curriculum_count: int

    class Config:
        from_attributes = True