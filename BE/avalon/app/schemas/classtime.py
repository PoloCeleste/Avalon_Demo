from pydantic import BaseModel
from typing import Optional
from datetime import time

class ClasstimeBase(BaseModel):
    start_time: time
    end_time: time

class ClasstimeCreate(ClasstimeBase):
    pass

class ClasstimeUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class Classtime(ClasstimeBase):
    time_id: int

    class Config:
        from_attributes = True