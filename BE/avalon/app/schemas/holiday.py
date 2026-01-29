from pydantic import BaseModel
from typing import Optional
from datetime import date

class HolidayBase(BaseModel):
    holiday_name: str
    holiday_date: date

class HolidayCreate(HolidayBase):
    pass

class HolidayUpdate(BaseModel):
    holiday_name: Optional[str] = None
    holiday_date: Optional[date] = None

class Holiday(HolidayBase):
    holiday_id: int

    class Config:
        from_attributes = True