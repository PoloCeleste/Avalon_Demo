from pydantic import BaseModel
from typing import Optional

class CurriculumDetailBase(BaseModel):
    curriculum_id: int
    subject_id: int
    day: int
    progress: str

class CurriculumDetailCreate(CurriculumDetailBase):
    pass

class CurriculumDetailUpdate(BaseModel):
    day: Optional[int] = None
    progress: Optional[str] = None

class CurriculumDetail(CurriculumDetailBase):
    curri_detail_id: int

    class Config:
        from_attributes = True