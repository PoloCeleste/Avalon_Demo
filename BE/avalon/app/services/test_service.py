from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import date

from ..models.test import Test
from ..schemas.test import TestCreate, TestUpdate
from ..models.class_model import Class
from ..models.subject import Subject
from ..models.classtime import Classtime

class TestService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_test(self, test_id: int) -> Test:
        result = await self.db.execute(select(Test).filter(Test.test_id == test_id))
        test = result.scalars().first()
        if not test:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
        return test

    async def get_all_tests(self, skip: int = 0, limit: int = 100, class_id: Optional[int] = None, subject_id: Optional[int] = None) -> List[Test]:
        query = select(Test)
        if class_id is not None:
            query = query.filter(Test.class_id == class_id)
        if subject_id is not None:
            query = query.filter(Test.subject_id == subject_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_test(self, test_data: TestCreate) -> Test:
        result = await self.db.execute(select(Class).filter(Class.class_id == test_data.class_id))
        class_obj = result.scalars().first()
        if not class_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Class with id {test_data.class_id} not found")

        result = await self.db.execute(select(Subject).filter(Subject.subject_id == test_data.subject_id))
        subject = result.scalars().first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject with id {test_data.subject_id} not found")

        if test_data.classtime_ids:
            for classtime_id in test_data.classtime_ids:
                result = await self.db.execute(select(Classtime).filter(Classtime.time_id == classtime_id))
                classtime = result.scalars().first()
                if not classtime:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Classtime with id {classtime_id} not found")

        db_test = Test(**test_data.model_dump())
        self.db.add(db_test)
        await self.db.commit()
        await self.db.refresh(db_test)
        return db_test

    async def update_test(self, test_id: int, test_data: TestUpdate) -> Test:
        db_test = await self.get_test(test_id)

        update_data = test_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_test, key, value)

        await self.db.commit()
        await self.db.refresh(db_test)
        return db_test

    async def create_multiple_tests(self, tests_data: List[TestCreate]) -> List[Test]:
        created_tests = []
        for test_data in tests_data:
            try:
                test = await self.create_test(test_data)
                created_tests.append(test)
            except HTTPException as e:
                print(f"Error creating test {test_data.test_name}: {e.detail}")
                await self.db.rollback()
        await self.db.commit()
        return created_tests

    async def hard_delete_test(self, test_id: int):
        db_test = await self.get_test(test_id)
        await self.db.delete(db_test)
        await self.db.commit()
        return {"detail": "Test successfully deleted"}
