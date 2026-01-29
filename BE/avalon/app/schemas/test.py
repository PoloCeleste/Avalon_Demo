from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class TestBase(BaseModel):
    class_id: int
    subject_id: int
    test_title: str
    test_day: date
    classtime_ids: Optional[List[int]] = None

class TestCreate(TestBase):
    pass

class TestUpdate(BaseModel):
    test_title: Optional[str] = None
    test_day: Optional[date] = None
    classtime_ids: Optional[List[int]] = None

class Test(TestBase):
    test_id: int

    class Config:
        from_attributes = True