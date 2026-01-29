from pydantic import BaseModel
from typing import Optional

class BranchBase(BaseModel):
    branch_name: str
    branch_phone: str
    branch_address: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    branch_phone: Optional[str] = None
    branch_address: Optional[str] = None

class BranchResponse(BranchBase):
    branch_id: int
    
    class Config:
        from_attributes = True