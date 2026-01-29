from pydantic import BaseModel
from ..models.weekday import Weekday

class TeacherAssignmentBase(BaseModel):
    user_id: int
    subject_id: int
    class_id: int
    time_id: int
    weekday: Weekday

class TeacherAssignmentCreate(TeacherAssignmentBase):
    pass

class TeacherAssignment(TeacherAssignmentBase):
    class Config:
        from_attributes = True