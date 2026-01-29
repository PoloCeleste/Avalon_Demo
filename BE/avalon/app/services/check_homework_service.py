from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List, Optional

from sqlalchemy import select, and_, delete
from ..models.class_student import ClassStudent
from ..models.check_homework import CheckHomework
from ..schemas.check_homework import CheckHomeworkCreate

class CheckHomeworkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_check_homework(self, check_data: CheckHomeworkCreate) -> CheckHomework:
        # Check if this homework has already been checked for this student in this class
        stmt = select(CheckHomework).where(
            CheckHomework.student_id == check_data.student_id,
            CheckHomework.homework_id == check_data.homework_id,
            CheckHomework.class_id == check_data.class_id
        )
        result = await self.db.execute(stmt)
        existing_check = result.scalars().first()

        if existing_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This homework has already been checked for this student in this class"
            )

        db_check = CheckHomework(**check_data.model_dump())
        self.db.add(db_check)
        await self.db.commit()
        await self.db.refresh(db_check)
        return db_check

    async def get_check_homework(self, check_homework_id: int, class_id: Optional[int] = None) -> Optional[CheckHomework]:
        stmt = select(CheckHomework).where(CheckHomework.check_homework_id == check_homework_id)
        if class_id is not None:
            stmt = stmt.where(CheckHomework.class_id == class_id)
        result = await self.db.execute(stmt)
        check = result.scalars().first()
        return check

    async def delete_check_homework(self, check_homework_id: int, class_id: Optional[int] = None):
        stmt = delete(CheckHomework).where(CheckHomework.check_homework_id == check_homework_id)
        if class_id is not None:
            stmt = stmt.where(CheckHomework.class_id == class_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CheckHomework record not found")
        return

    async def get_checks_filtered(
        self,
        student_id: Optional[int] = None,
        homework_id: Optional[int] = None,
        class_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CheckHomework]:
        filters = []
        if student_id is not None:
            filters.append(CheckHomework.student_id == student_id)
        if homework_id is not None:
            filters.append(CheckHomework.homework_id == homework_id)
        if class_id is not None:
            filters.append(CheckHomework.class_id == class_id)
        stmt = select(CheckHomework).where(and_(*filters)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def check_homework_all(self, class_id: int, subject_id: int, homework_id: int, checker_id: int) -> List[CheckHomework]:
        # 해당 반에 속한 모든 학생 조회
        students_stmt = select(ClassStudent).where(ClassStudent.class_id == class_id)
        students_result = await self.db.execute(students_stmt)
        students = students_result.scalars().all()
        if not students:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No students found in this class.")
        results = []
        for student in students:
            # 이미 체크된 숙제인지 확인
            check_stmt = select(CheckHomework).where(
                CheckHomework.student_id == student.student_id,
                CheckHomework.homework_id == homework_id,
                CheckHomework.class_id == class_id
            )
            check_result = await self.db.execute(check_stmt)
            existing_check = check_result.scalars().first()
            if existing_check:
                continue
            check_data = CheckHomeworkCreate(
                student_id=student.student_id,
                homework_id=homework_id,
                class_id=class_id,
                checker_id=checker_id
            )
            db_check = CheckHomework(**check_data.model_dump())
            self.db.add(db_check)
            results.append(db_check)
        await self.db.commit()
        for db_check in results:
            await self.db.refresh(db_check)
        return results

    async def uncheck_homework_all(self, class_id: int, subject_id: int, homework_id: int) -> int:
        # 해당 반의 모든 학생에 대해 숙제 체크 기록 삭제
        students_stmt = select(ClassStudent).where(ClassStudent.class_id == class_id)
        students_result = await self.db.execute(students_stmt)
        students = students_result.scalars().all()
        if not students:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No students found in this class.")
        student_ids = [s.student_id for s in students]
        delete_stmt = delete(CheckHomework).where(
            CheckHomework.class_id == class_id,
            CheckHomework.homework_id == homework_id,
            CheckHomework.student_id.in_(student_ids)
        )
        result = await self.db.execute(delete_stmt)
        await self.db.commit()
        return result.rowcount
