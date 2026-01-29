from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.subject import Subject
from ..models.curriculum import Curriculum
from ..models.curriculum_detail import CurriculumDetail
from ..schemas.subject import SubjectCreate, SubjectUpdate
from ..schemas.subject import Subject as SubjectSchema

class SubjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_subject(self, subject_id: int) -> dict:
        subject = await self.db.get(Subject, subject_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        curriculum_ids = (await self.db.execute(
            CurriculumDetail.__table__.select().with_only_columns(CurriculumDetail.curriculum_id).where(CurriculumDetail.subject_id == subject_id)
        )).fetchall()
        curriculum_count = 0
        if curriculum_ids:
            curriculum_count = (await self.db.execute(
                Curriculum.__table__.count().where(Curriculum.curriculum_id.in_([cid[0] for cid in curriculum_ids]))
            )).scalar()
        return SubjectSchema(
            subject_id=subject.subject_id,
            subject_name=subject.subject_name,
            subject_nick=getattr(subject, "subject_nick", None),
            curriculum_count=curriculum_count
        )

    async def get_all_subjects(self, skip: int = 0, limit: int = 100) -> List[dict]:
        subjects = (await self.db.execute(
            Subject.__table__.select().offset(skip).limit(limit)
        )).fetchall()
        result = []
        for row in subjects:
            subject = Subject(**row._mapping)
            curriculum_ids = (await self.db.execute(
                CurriculumDetail.__table__.select().with_only_columns(CurriculumDetail.curriculum_id).where(CurriculumDetail.subject_id == subject.subject_id)
            )).fetchall()
            curriculum_count = 0
            if curriculum_ids:
                count_result = await self.db.execute(
                    select(func.count()).where(Curriculum.curriculum_id.in_([cid[0] for cid in curriculum_ids]))
                )
                curriculum_count = count_result.scalar()
            result.append(SubjectSchema(
                subject_id=subject.subject_id,
                subject_name=subject.subject_name,
                subject_nick=getattr(subject, "subject_nick", None),
                curriculum_count=curriculum_count
            ))
        return result

    async def create_subject(self, subject_data: SubjectCreate) -> SubjectSchema:
        existing_subject = (await self.db.execute(
            Subject.__table__.select().where(Subject.subject_name == subject_data.subject_name)
        )).first()
        if existing_subject:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject with the same name already exists")
        db_subject = Subject(**subject_data.model_dump())
        self.db.add(db_subject)
        await self.db.commit()
        await self.db.refresh(db_subject)
        # 생성 직후 curriculum_count는 0
        return SubjectSchema(
            subject_id=db_subject.subject_id,
            subject_name=db_subject.subject_name,
            subject_nick=getattr(db_subject, "subject_nick", None),
            curriculum_count=0
        )

    async def update_subject(self, subject_id: int, subject_data: SubjectUpdate) -> SubjectSchema:
        db_subject = await self.db.get(Subject, subject_id)
        if not db_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        update_data = subject_data.model_dump(exclude_unset=True)
        if "subject_name" in update_data:
            existing_subject = (await self.db.execute(
                Subject.__table__.select().where(
                    Subject.subject_name == update_data["subject_name"],
                    Subject.subject_id != subject_id
                )
            )).first()
            if existing_subject:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another subject with this name already exists")
        for key, value in update_data.items():
            setattr(db_subject, key, value)
        await self.db.commit()
        await self.db.refresh(db_subject)
        # 업데이트 후 curriculum_count 계산
        curriculum_ids = (await self.db.execute(
            CurriculumDetail.__table__.select().with_only_columns(CurriculumDetail.curriculum_id).where(CurriculumDetail.subject_id == db_subject.subject_id)
        )).fetchall()
        curriculum_count = 0
        if curriculum_ids:
            count_result = await self.db.execute(
                select(func.count()).where(Curriculum.curriculum_id.in_([cid[0] for cid in curriculum_ids]))
            )
            curriculum_count = count_result.scalar()
        return SubjectSchema(
            subject_id=db_subject.subject_id,
            subject_name=db_subject.subject_name,
            subject_nick=getattr(db_subject, "subject_nick", None),
            curriculum_count=curriculum_count
        )

    async def delete_subject(self, subject_id: int):
        db_subject = await self.db.get(Subject, subject_id)
        if not db_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        used = (await self.db.execute(
            CurriculumDetail.__table__.select().where(CurriculumDetail.subject_id == subject_id)
        )).first()
        if used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This subject is in use by curriculum and cannot be deleted."
            )
        await self.db.delete(db_subject)
        await self.db.commit()
        return {"detail": "Subject successfully deleted"}
