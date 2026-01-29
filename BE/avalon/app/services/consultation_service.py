from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.consultation import Consultation
from ..schemas.consultation import ConsultationCreate, ConsultationUpdate
from typing import List, Optional

async def create_consultation(db: AsyncSession, consultation: ConsultationCreate) -> Consultation:
    db_consultation = Consultation(**consultation.model_dump())
    db.add(db_consultation)
    await db.commit()
    await db.refresh(db_consultation)
    return db_consultation

async def get_consultation(db: AsyncSession, consultation_id: int) -> Optional[Consultation]:
    result = await db.execute(select(Consultation).filter(Consultation.consultation_id == consultation_id, Consultation.is_deleted == False))
    return result.scalars().first()

async def get_consultations_by_student(db: AsyncSession, student_id: int) -> List[Consultation]:
    result = await db.execute(select(Consultation).filter(Consultation.student_id == student_id, Consultation.is_deleted == False))
    return result.scalars().all()

async def get_consultations_by_semester(db: AsyncSession, semester_id: int) -> List[Consultation]:
    result = await db.execute(select(Consultation).filter(Consultation.semester_id == semester_id, Consultation.is_deleted == False))
    return result.scalars().all()

async def update_consultation(db: AsyncSession, consultation_id: int, consultation: ConsultationUpdate) -> Optional[Consultation]:
    db_consultation = await get_consultation(db, consultation_id)
    if db_consultation:
        update_data = consultation.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_consultation, key, value)
        await db.commit()
        await db.refresh(db_consultation)
    return db_consultation

async def delete_consultation(db: AsyncSession, consultation_id: int) -> Optional[Consultation]:
    db_consultation = await get_consultation(db, consultation_id)
    if db_consultation:
        db_consultation.is_deleted = True
        await db.commit()
        await db.refresh(db_consultation)
    return db_consultation
