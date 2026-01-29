from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status

# Pydantic Schemas
from ..schemas.semester import Semester, SemesterCreate, SemesterUpdate
# Database Models
from ..models.semester import Semester as SemesterModel
from ..models.branch import Branch

class SemesterService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_semester(self, semester_id: int) -> Semester:
        result = await self.db.execute(select(SemesterModel).where(SemesterModel.semester_id == semester_id))
        obj = result.scalars().first()
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        return Semester.model_validate(obj)

    async def get_all_semesters(self, skip: int = 0, limit: int = 100, branch_id: Optional[int] = None) -> List[Semester]:
        stmt = select(SemesterModel)
        if branch_id is not None:
            stmt = stmt.where(SemesterModel.branch_id == branch_id)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        semesters = result.scalars().all()
        return [Semester.model_validate(s) for s in semesters]

    async def create_semester(self, semester_data: SemesterCreate) -> Semester:
        if semester_data.semester_end_at < semester_data.semester_start_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Semester end date cannot be before start date")
        result = await self.db.execute(select(Branch).where(Branch.branch_id == semester_data.branch_id))
        branch = result.scalars().first()
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch with id {semester_data.branch_id} not found")

        result = await self.db.execute(select(SemesterModel).where(
            SemesterModel.branch_id == semester_data.branch_id,
            SemesterModel.semester_name == semester_data.semester_name
        ))
        exists = result.scalars().first()
        if exists:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Semester with the same name already exists in this branch")

        db_semester = SemesterModel(**semester_data.model_dump(exclude_unset=True))
        self.db.add(db_semester)
        await self.db.commit()
        await self.db.refresh(db_semester)
        return Semester.model_validate(db_semester)

    async def update_semester(self, semester_id: int, semester_data: SemesterUpdate) -> Semester:
        result = await self.db.execute(select(SemesterModel).where(SemesterModel.semester_id == semester_id))
        obj = result.scalars().first()
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")

        data = semester_data.model_dump(exclude_unset=True)
        start_date = data.get("semester_start_at", obj.semester_start_at)
        end_date = data.get("semester_end_at", obj.semester_end_at)
        if end_date < start_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Semester end date cannot be before start date")

        if "semester_name" in data:
            result = await self.db.execute(select(SemesterModel).where(
                SemesterModel.branch_id == obj.branch_id,
                SemesterModel.semester_name == data["semester_name"],
                SemesterModel.semester_id != semester_id
            ))
            exists = result.scalars().first()
            if exists:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another semester with this name already exists in this branch")

        for k, v in data.items():
            setattr(obj, k, v)

        await self.db.commit()
        await self.db.refresh(obj)
        return Semester.model_validate(obj)

    async def delete_semester(self, semester_id: int):
        result = await self.db.execute(select(SemesterModel).where(SemesterModel.semester_id == semester_id))
        obj = result.scalars().first()
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")

        try:
            await self.db.delete(obj)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete semester: {e}",
            )
        return {"detail": "Semester successfully deleted"}
