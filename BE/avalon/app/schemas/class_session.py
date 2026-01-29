from pydantic import BaseModel
from typing import Optional
from datetime import date
from ..models.weekday import Weekday

class ClassSessionBase(BaseModel):
    class_id: int
    subject_id: int
    classtime_id: int
    teacher_id: Optional[int]
    session_date: date
    weekday: Weekday
    curri_detail_id: Optional[int] = None
    session_order: int = 1
    is_rescheduled: bool = False
    original_date: Optional[date] = None
    notes: Optional[str] = None

class ClassSessionCreate(ClassSessionBase):
    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.weekday_to_title

    @staticmethod
    def weekday_to_title(values):
        if 'weekday' in values and values['weekday']:
            # enum 변환 전 첫글자만 대문자, 나머지 소문자 처리
            values['weekday'] = str(values['weekday']).capitalize()
        return values

class ClassSessionUpdate(BaseModel):
    subject_id: Optional[int] = None
    classtime_id: Optional[int] = None
    teacher_id: Optional[int] = None
    session_date: Optional[date] = None
    weekday: Optional[Weekday] = None

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.weekday_to_title

    @staticmethod
    def weekday_to_title(values):
        if 'weekday' in values and values['weekday']:
            values['weekday'] = str(values['weekday']).capitalize()
        return values

class ClassSession(ClassSessionBase):
    session_id: int

    class Config:
        from_attributes = True

class ClassSessionTeacherUpdate(BaseModel):
    session_id: int
    teacher_id: Optional[int]

class ClassSessionBulkTeacherAssignment(BaseModel):
    class_id: int
    weekday: Weekday
    classtime_id: int
    subject_id: int
    teacher_id: Optional[int]

class TeacherAssignmentUpdate(BaseModel):
    class_id: int
    weekday: Weekday
    classtime_id: int
    subject_id: int
    teacher_id: Optional[int]