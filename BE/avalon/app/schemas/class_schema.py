from pydantic import BaseModel, Field
from typing import Optional, List

class ClassBase(BaseModel):
    semester_id: int
    curriculum_id: int
    class_name: str
    attend_day: str
    kr_homeroom_id: int
    fr_homeroom_id: int
    is_active: bool = True

class ClassCreate(ClassBase):
    schedule_details_json: List[dict]

class ClassUpdate(BaseModel):
    class_name: Optional[str] = None
    attend_day: Optional[str] = None
    kr_homeroom_id: Optional[int] = None
    fr_homeroom_id: Optional[int] = None
    is_active: Optional[bool] = None
    schedule_details_json: Optional[List[dict]] = None

class ClassResponse(ClassBase):
    class_id: int
    schedule_details_json: List[dict]

    class Config:
        from_attributes = True