from pydantic import BaseModel
from datetime import datetime

class TalentBase(BaseModel):
    student_id: int
    semester_id: int
    giver_id: int
    value: int

class TalentCreate(TalentBase):
    pass

class Talent(TalentBase):
    talent_id: int
    created_at: datetime

    class Config:
        from_attributes = True