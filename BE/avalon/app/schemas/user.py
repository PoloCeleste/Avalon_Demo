from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from ..models.user import UserRole, UserStatus

class UserBase(BaseModel):
    username: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birthday: Optional[date] = None
    role: UserRole
    branch_id: Optional[int] = None
    is_foreign: bool = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birthday: Optional[date] = None
    role: Optional[UserRole] = None
    branch_id: Optional[int] = None
    status: Optional[UserStatus] = None
    is_foreign: Optional[bool] = None    

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    user_id: int
    status: UserStatus
    created_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class AssignedSubjectDetail(BaseModel):
    semester_id: int
    semester_name: str
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    weekday: List[str]
    classtime_id: List[int]

    class Config:
        from_attributes = True
