from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date, 
    Boolean,
    Enum,
    ForeignKey,
    PrimaryKeyConstraint
)
from sqlalchemy.sql import func
import enum
from .base import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    TEACHER = "teacher"
    ASSISTANT = "assistant"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"

ROLE_HIERARCHY = {
    UserRole.SUPER_ADMIN: 5,
    UserRole.ADMIN: 4,
    UserRole.MANAGER: 3,
    UserRole.TEACHER: 2,
    UserRole.ASSISTANT: 1,
}

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"))
    username = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    birthday = Column(Date, nullable=True)
    is_foreign = Column(Boolean, nullable=False, default=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TEACHER)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.INACTIVE)
    created_at = Column(DateTime, nullable=False, default=func.now())
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (PrimaryKeyConstraint('user_id', 'branch_id'),)
