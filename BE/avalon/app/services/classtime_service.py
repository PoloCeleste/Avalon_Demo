from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import time

from ..models.classtime import Classtime
from ..schemas.classtime import ClasstimeCreate, ClasstimeUpdate

class ClasstimeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_classtime(self, time_id: int) -> Classtime:
        result = await self.db.execute(select(Classtime).filter(Classtime.time_id == time_id))
        classtime = result.scalars().first()
        if not classtime:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classtime not found")
        return classtime

    async def get_all_classtimes(self, skip: int = 0, limit: int = 100) -> List[Classtime]:
        query = select(Classtime).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_classtime(self, classtime_data: ClasstimeCreate) -> Classtime:
        result = await self.db.execute(select(Classtime).filter(
            Classtime.start_time == classtime_data.start_time,
            Classtime.end_time == classtime_data.end_time
        ))
        existing_classtime = result.scalars().first()
        if existing_classtime:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classtime with the same start and end time already exists")

        db_classtime = Classtime(**classtime_data.model_dump())
        self.db.add(db_classtime)
        await self.db.commit()
        await self.db.refresh(db_classtime)
        return db_classtime

    async def update_classtime(self, time_id: int, classtime_data: ClasstimeUpdate) -> Classtime:
        db_classtime = await self.get_classtime(time_id)

        update_data = classtime_data.model_dump(exclude_unset=True)

        # Check for duplicate on update
        if "start_time" in update_data or "end_time" in update_data:
            proposed_start_time = update_data.get("start_time", db_classtime.start_time)
            proposed_end_time = update_data.get("end_time", db_classtime.end_time)

            result = await self.db.execute(select(Classtime).filter(
                Classtime.start_time == proposed_start_time,
                Classtime.end_time == proposed_end_time,
                Classtime.time_id != time_id
            ))
            existing_classtime = result.scalars().first()
            if existing_classtime:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another classtime with this start and end time already exists")

        for key, value in update_data.items():
            setattr(db_classtime, key, value)

        await self.db.commit()
        await self.db.refresh(db_classtime)
        return db_classtime

    async def delete_classtime(self, time_id: int):
        db_classtime = await self.get_classtime(time_id)
        await self.db.delete(db_classtime)
        await self.db.commit()
        return {"detail": "Classtime successfully deleted"}
