from pydantic import BaseModel
from typing import Optional
from datetime import date
from ..models.semester import SemesterSeason

class SemesterBase(BaseModel):
    branch_id: int
    semester_name: str
    semester_start_at: date
    semester_end_at: date
    season: SemesterSeason

class SemesterCreate(SemesterBase):
    status: Optional[int] = None

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.season_to_title

    @staticmethod
    def season_to_title(values):
        if 'season' in values and values['season']:
            values['season'] = str(values['season']).capitalize()
        return values

class SemesterUpdate(BaseModel):
    semester_name: Optional[str] = None
    semester_start_at: Optional[date] = None
    semester_end_at: Optional[date] = None
    season: Optional[SemesterSeason] = None
    # 운영 정책상 필요 시 수동 갱신 허용
    status: Optional[int] = None

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.season_to_title

    @staticmethod
    def season_to_title(values):
        if 'season' in values and values['season']:
            values['season'] = str(values['season']).capitalize()
        return values

class Semester(SemesterBase):
    semester_id: int
    status: int  # 0/1/2
    class Config:
        from_attributes = True
