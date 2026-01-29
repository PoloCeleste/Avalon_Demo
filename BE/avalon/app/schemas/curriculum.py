from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum as PyEnum

class CurriculumType(str, PyEnum):
    langcon = 'langcon'
    avalon = 'avalon'

class CurriculumBase(BaseModel):
    curriculum_name: str
    type: Optional[CurriculumType] = None

class CurriculumCreate(CurriculumBase):
    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.type_to_lower

    @staticmethod
    def type_to_lower(values):
        if 'type' in values and values['type']:
            # enum 변환 전 소문자 처리
            values['type'] = str(values['type']).lower()
        return values

class CurriculumUpdate(BaseModel):
    curriculum_name: Optional[str] = None
    type: Optional[CurriculumType] = None

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.type_to_lower

    @staticmethod
    def type_to_lower(values):
        if 'type' in values and values['type']:
            values['type'] = str(values['type']).lower()
        return values

class Curriculum(CurriculumBase):
    curriculum_id: int
    created_at: datetime
    deleted_at: Optional[datetime]
    used_class_count: int = 0

    class Config:
        from_attributes = True