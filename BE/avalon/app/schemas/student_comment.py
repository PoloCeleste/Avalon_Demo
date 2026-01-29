from pydantic import BaseModel
from datetime import datetime

class StudentCommentBase(BaseModel):
    student_id: int
    comment: str
    comment_user_id: int

class StudentCommentCreate(StudentCommentBase):
    pass

class StudentComment(StudentCommentBase):
    comment_id: int
    created_at: datetime

    class Config:
        from_attributes = True