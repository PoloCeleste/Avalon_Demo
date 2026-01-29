from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select, join, delete
from typing import List, Optional
from collections import defaultdict
from datetime import date
from fastapi import HTTPException, status

from ..models.homework import Homework
from ..models.check_homework import CheckHomework
from ..models.class_session import ClassSession
from ..schemas.homework import HomeworkCreate, HomeworkUpdate, HomeworkDueDate
from ..models.curriculum_detail import CurriculumDetail
from ..models.subject import Subject

class HomeworkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_homework_due_dates_for_class(self, class_id: int, due_date: Optional[date] = None) -> List[HomeworkDueDate]:
        # 1. Fetch all sessions for the class, ordered by date, with related data
        stmt = (
            select(ClassSession)
            .filter(ClassSession.class_id == class_id)
            .options(
                joinedload(ClassSession.subject),
                joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks)
            )
            .order_by(ClassSession.session_date)
        )
        result = await self.db.execute(stmt)
        sessions = result.unique().scalars().all()

        if not sessions:
            return []

        # 2. Group sessions by subject
        sessions_by_subject = defaultdict(list)
        for s in sessions:
            sessions_by_subject[s.subject_id].append(s)

        due_dates_list = []

        # 3. Iterate through each subject group to calculate due dates
        for subject_id, subject_sessions in sessions_by_subject.items():
            for i, current_session in enumerate(subject_sessions):
                # Find the next session for the same subject with a future date
                next_due_session = None
                for j in range(i + 1, len(subject_sessions)):
                    if subject_sessions[j].session_date > current_session.session_date:
                        next_due_session = subject_sessions[j]
                        break

                # If no future session is found, we can't set a due date, so skip.
                if not next_due_session:
                    continue

                # Ensure curriculum_detail and homeworks exist for the current session
                if not current_session.curriculum_detail or not current_session.curriculum_detail.homeworks:
                    continue

                # Get homeworks for the current session
                for hw in current_session.curriculum_detail.homeworks:
                    if hw.tag_name.upper() == 'OVERDUE':
                        continue

                    due_dates_list.append(
                        HomeworkDueDate(
                            homework_id=hw.homework_id,
                            tag_name=hw.tag_name,
                            subject_name=current_session.subject.subject_name,
                            assigned_date=current_session.session_date,
                            due_date=next_due_session.session_date
                        )
                    )
        
        # 7. Filter by due_date if provided
        if due_date:
            due_dates_list = [item for item in due_dates_list if item.due_date == due_date]

        return due_dates_list

    async def get_homework(self, homework_id: int) -> Homework:
        result = await self.db.execute(select(Homework).filter(Homework.homework_id == homework_id))
        homework = result.scalars().first()
        if not homework:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Homework not found")
        return homework

    async def get_all_homeworks(self, skip: int = 0, limit: int = 100, curri_detail_id: Optional[int] = None, subject_id: Optional[int] = None, curriculum_id: Optional[int] = None) -> List[Homework]:
        query = select(Homework)
        if curriculum_id is not None:
            query = query.join(CurriculumDetail).filter(CurriculumDetail.curriculum_id == curriculum_id)
        if curri_detail_id is not None:
            query = query.filter(Homework.curri_detail_id == curri_detail_id)
        if subject_id is not None:
            query = query.filter(Homework.subject_id == subject_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_homework(self, homework_data: HomeworkCreate) -> Homework:
        result = await self.db.execute(select(CurriculumDetail).filter(CurriculumDetail.curri_detail_id == homework_data.curri_detail_id))
        curriculum_detail = result.scalars().first()
        if not curriculum_detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Curriculum Detail with id {homework_data.curri_detail_id} not found")

        result = await self.db.execute(select(Subject).filter(Subject.subject_id == homework_data.subject_id))
        subject = result.scalars().first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject with id {homework_data.subject_id} not found")

        db_homework = Homework(**homework_data.model_dump())
        self.db.add(db_homework)
        await self.db.commit()
        await self.db.refresh(db_homework)
        return db_homework

    async def update_homework(self, homework_id: int, homework_data: HomeworkUpdate) -> Homework:
        db_homework = await self.get_homework(homework_id)
        update_data = homework_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_homework, key, value)

        await self.db.commit()
        await self.db.refresh(db_homework)
        return db_homework

    async def delete_homework(self, homework_id: int) -> None:
        await self.db.execute(delete(CheckHomework).where(CheckHomework.homework_id == homework_id))
        db_homework = await self.get_homework(homework_id)
        await self.db.delete(db_homework)
        await self.db.commit()