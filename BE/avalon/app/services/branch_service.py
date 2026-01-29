from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..models import Branch, User
from ..schemas.branch import BranchCreate, BranchUpdate, BranchResponse

class BranchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_branch(self, branch_data: BranchCreate) -> BranchResponse:
        """지점 생성"""
        result = await self.db.execute(select(Branch).where(Branch.branch_name == branch_data.branch_name))
        existing_branch = result.scalars().first()
        if existing_branch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch with this name already exists"
            )

        new_branch = Branch(**branch_data.model_dump())
        
        self.db.add(new_branch)
        
        await self.db.commit()
        await self.db.refresh(new_branch)
        return BranchResponse.model_validate(new_branch)

    async def get_branch(self, branch_id: int) -> BranchResponse:
        """지점 조회"""
        result = await self.db.execute(select(Branch).where(Branch.branch_id == branch_id))
        branch = result.scalars().first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found"
            )
        
        return BranchResponse.model_validate(branch)

    async def get_all_branches(self, skip: int = 0, limit: int = 100) -> List[BranchResponse]:
        """모든 지점 목록 조회"""
        result = await self.db.execute(select(Branch).offset(skip).limit(limit))
        branches = result.scalars().all()
        return [BranchResponse.model_validate(branch) for branch in branches]

    async def update_branch(self, branch_id: int, branch_data: BranchUpdate) -> BranchResponse:
        """지점 정보 수정"""
        result = await self.db.execute(select(Branch).where(Branch.branch_id == branch_id))
        branch = result.scalars().first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found"
            )

        update_data = branch_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(branch, field, value)
        
        await self.db.commit()
        await self.db.refresh(branch)
        
        return BranchResponse.model_validate(branch)

    async def delete_branch(self, branch_id: int):
        """지점 삭제"""
        result = await self.db.execute(select(Branch).where(Branch.branch_id == branch_id))
        branch = result.scalars().first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found"
            )
        await self.db.delete(branch)
        await self.db.commit()
        return {"message": "Branch successfully deleted"}
