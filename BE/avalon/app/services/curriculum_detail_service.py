from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.curriculum_detail import CurriculumDetail
from ..schemas.curriculum_detail import CurriculumDetailCreate, CurriculumDetailUpdate
from ..models.curriculum import Curriculum
from ..models.subject import Subject

class CurriculumDetailService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_curriculum_detail(self, curri_detail_id: int) -> CurriculumDetail:
        result = await self.db.execute(
            select(CurriculumDetail).filter(CurriculumDetail.curri_detail_id == curri_detail_id)
        )
        curriculum_detail = result.scalars().first()
        if not curriculum_detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum Detail not found")
        return curriculum_detail

    async def get_all_curriculum_details(self, skip: int = 0, limit: int = 100, curriculum_id: Optional[int] = None, subject_id: Optional[int] = None) -> List[CurriculumDetail]:
        query = select(CurriculumDetail)
        if curriculum_id is not None:
            query = query.filter(CurriculumDetail.curriculum_id == curriculum_id)
        if subject_id is not None:
            query = query.filter(CurriculumDetail.subject_id == subject_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_curriculum_detail(self, curriculum_detail_data: CurriculumDetailCreate) -> CurriculumDetail:
        # Check if curriculum exists
        result = await self.db.execute(select(Curriculum).filter(Curriculum.curriculum_id == curriculum_detail_data.curriculum_id))
        curriculum = result.scalars().first()
        if not curriculum:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Curriculum with id {curriculum_detail_data.curriculum_id} not found")

        # Check if subject exists
        result = await self.db.execute(select(Subject).filter(Subject.subject_id == curriculum_detail_data.subject_id))
        subject = result.scalars().first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject with id {curriculum_detail_data.subject_id} not found")

        # Check for duplicate (curriculum_id, subject_id, day)
        result = await self.db.execute(select(CurriculumDetail).filter(
            CurriculumDetail.curriculum_id == curriculum_detail_data.curriculum_id,
            CurriculumDetail.subject_id == curriculum_detail_data.subject_id,
            CurriculumDetail.day == curriculum_detail_data.day
        ))
        existing_curriculum_detail = result.scalars().first()
        if existing_curriculum_detail:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curriculum Detail for this curriculum, subject, and day already exists")

        db_curriculum_detail = CurriculumDetail(**curriculum_detail_data.model_dump())
        self.db.add(db_curriculum_detail)
        await self.db.commit()
        await self.db.refresh(db_curriculum_detail)
        return db_curriculum_detail

    async def update_curriculum_detail(self, curri_detail_id: int, curriculum_detail_data: CurriculumDetailUpdate) -> CurriculumDetail:
        db_curriculum_detail = await self.get_curriculum_detail(curri_detail_id) # This handles not found check

        update_data = curriculum_detail_data.model_dump(exclude_unset=True)

        # Check for duplicate on update (curriculum_id, subject_id, day)
        if "day" in update_data: # Only day can change for uniqueness
            result = await self.db.execute(select(CurriculumDetail).filter(
                CurriculumDetail.curriculum_id == db_curriculum_detail.curriculum_id,
                CurriculumDetail.subject_id == db_curriculum_detail.subject_id,
                CurriculumDetail.day == update_data["day"],
                CurriculumDetail.curri_detail_id != curri_detail_id
            ))
            existing_curriculum_detail = result.scalars().first()
            if existing_curriculum_detail:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another curriculum detail with this day already exists for this curriculum and subject")

        for key, value in update_data.items():
            setattr(db_curriculum_detail, key, value)

        await self.db.commit()
        await self.db.refresh(db_curriculum_detail)
        return db_curriculum_detail

