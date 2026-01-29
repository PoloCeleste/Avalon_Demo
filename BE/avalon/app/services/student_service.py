from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status
from ..models.student import Student, StudentStatus
from ..schemas.student import StudentCreate, StudentUpdate
from ..models.branch import Branch
import re

class StudentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_student(self, student_id: int, include_deleted: bool = False) -> Student:
        result = await self.db.execute(select(Student).where(Student.student_id == student_id))
        student = result.scalars().first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        if not include_deleted and student.status == StudentStatus.DELETED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return student

    async def get_all_students(self, skip: int = 0, limit: int = 100, branch_id: Optional[int] = None, status: Optional[StudentStatus] = None, include_deleted: bool = False) -> List[Student]:
        stmt = select(Student)
        if not include_deleted:
            stmt = stmt.where(Student.status != StudentStatus.DELETED)
        if branch_id is not None:
            stmt = stmt.where(Student.branch_id == branch_id)
        if status is not None:
            stmt = stmt.where(Student.status == status)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_student(self, student_data: StudentCreate) -> Student:
        # Check if branch exists
        result = await self.db.execute(select(Branch).where(Branch.branch_id == student_data.branch_id))
        branch = result.scalars().first()
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch with id {student_data.branch_id} not found")

        # 전화번호에서 특수문자 제거
        cleaned_data = student_data.model_dump()
        if 'parent_phone' in cleaned_data and cleaned_data['parent_phone']:
            cleaned_data['parent_phone'] = re.sub(r'[^0-9]', '', cleaned_data['parent_phone'])
        if 'student_phone' in cleaned_data and cleaned_data['student_phone']:
            cleaned_data['student_phone'] = re.sub(r'[^0-9]', '', cleaned_data['student_phone'])

        # 학교명 자동 완성
        school = cleaned_data.get('school', '').strip()
        if school:
            last_char = school[-1]
            if last_char == '초':
                cleaned_data['school'] = school + '등학교'
            elif last_char == '중':
                cleaned_data['school'] = school + '학교'
            elif last_char == '고':
                cleaned_data['school'] = school + '등학교'

        # Check for duplicate student (name + parent_phone in the same branch)
        stmt = select(Student).where(
            Student.branch_id == cleaned_data['branch_id'],
            Student.student_name == cleaned_data['student_name'],
            Student.parent_phone == cleaned_data['parent_phone'],
            Student.status != StudentStatus.DELETED
        )
        result = await self.db.execute(stmt)
        existing_student = result.scalars().first()
        if existing_student:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student with the same name and parent phone number already exists in this branch")

        db_student = Student(**cleaned_data)
        self.db.add(db_student)
        await self.db.commit()
        await self.db.refresh(db_student)
        return db_student

    async def update_student(self, student_id: int, student_data: StudentUpdate) -> Student:
        db_student = await self.get_student(student_id)
        update_data = student_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_student, key, value)
        await self.db.commit()
        await self.db.refresh(db_student)
        return db_student

    async def delete_student(self, student_id: int):
        db_student = await self.get_student(student_id)
        db_student.status = StudentStatus.DELETED
        await self.db.commit()
        return {"detail": "Student successfully deleted"}