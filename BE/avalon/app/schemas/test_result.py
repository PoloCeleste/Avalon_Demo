from pydantic import BaseModel
from typing import Optional

class TestResultBase(BaseModel):
    test_id: int
    student_id: int
    score: int

class TestResultCreate(TestResultBase):
    pass

class TestResultUpdate(BaseModel):
    score: Optional[int] = None

class TestResult(TestResultBase):
    result_id: int

    class Config:
        from_attributes = True