from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.test_result import TestResult
from ..schemas.test_result import TestResultCreate, TestResultUpdate
from ..models.test import Test
from ..models.student import Student

class TestResultService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_test_result(self, result_id: int) -> TestResult:
        result = await self.db.execute(select(TestResult).filter(TestResult.result_id == result_id))
        test_result = result.scalars().first()
        if not test_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test Result not found")
        return test_result

    async def get_all_test_results(self, skip: int = 0, limit: int = 100, test_id: Optional[int] = None, student_id: Optional[int] = None) -> List[TestResult]:
        query = select(TestResult)
        if test_id is not None:
            query = query.filter(TestResult.test_id == test_id)
        if student_id is not None:
            query = query.filter(TestResult.student_id == student_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_test_result(self, test_result_data: TestResultCreate) -> TestResult:
        result = await self.db.execute(select(Test).filter(Test.test_id == test_result_data.test_id))
        test = result.scalars().first()
        if not test:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Test with id {test_result_data.test_id} not found")

        result = await self.db.execute(select(Student).filter(Student.student_id == test_result_data.student_id))
        student = result.scalars().first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student with id {test_result_data.student_id} not found")

        result = await self.db.execute(select(TestResult).filter(
            TestResult.test_id == test_result_data.test_id,
            TestResult.student_id == test_result_data.student_id
        ))
        existing_result = result.scalars().first()
        if existing_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Test result for this student on this test already exists")

        db_test_result = TestResult(**test_result_data.model_dump())
        self.db.add(db_test_result)
        await self.db.commit()
        await self.db.refresh(db_test_result)
        return db_test_result

    async def update_test_result(self, result_id: int, test_result_data: TestResultUpdate) -> TestResult:
        db_test_result = await self.get_test_result(result_id)

        update_data = test_result_data.model_dump(exclude_unset=True)

        if "test_id" in update_data or "student_id" in update_data:
            proposed_test_id = update_data.get("test_id", db_test_result.test_id)
            proposed_student_id = update_data.get("student_id", db_test_result.student_id)

            result = await self.db.execute(select(TestResult).filter(
                TestResult.test_id == proposed_test_id,
                TestResult.student_id == proposed_student_id,
                TestResult.result_id != result_id
            ))
            existing_result = result.scalars().first()
            if existing_result:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another test result for this student on this test already exists")

        for key, value in update_data.items():
            setattr(db_test_result, key, value)

        await self.db.commit()
        await self.db.refresh(db_test_result)
        return db_test_result

    async def delete_test_result(self, result_id: int):
        db_test_result = await self.get_test_result(result_id)
        await self.db.delete(db_test_result)
        await self.db.commit()
        return {"detail": "Test Result successfully deleted"}