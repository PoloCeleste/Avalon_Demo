from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, join
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.class_model import Class
from ..models.student import Student
from ..models.class_student import ClassStudent

class ClassStudentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def assign_students_to_class(self, class_id: int, student_ids: List[int]) -> List[ClassStudent]:
        result = await self.db.execute(select(Class).filter(Class.class_id == class_id))
        class_obj = result.scalars().first()
        if not class_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Class with id {class_id} not found")

        assigned_students = []
        for student_id in student_ids:
            result = await self.db.execute(select(Student).filter(Student.student_id == student_id))
            student_obj = result.scalars().first()
            if not student_obj:
                print(f"Warning: Student with id {student_id} not found. Skipping assignment.")
                continue

            result = await self.db.execute(select(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.student_id == student_id
            ))
            existing_assignment = result.scalars().first()
            if existing_assignment:
                print(f"Warning: Student {student_id} is already assigned to class {class_id}. Skipping assignment.")
                continue

            new_assignment = ClassStudent(class_id=class_id, student_id=student_id)
            self.db.add(new_assignment)
            assigned_students.append(new_assignment)

        await self.db.commit()
        for assignment in assigned_students:
            await self.db.refresh(assignment)
        return assigned_students

    async def remove_student_from_class(self, class_id: int, student_id: int):
        result = await self.db.execute(select(ClassStudent).filter(
            ClassStudent.class_id == class_id,
            ClassStudent.student_id == student_id
        ))
        assignment = result.scalars().first()
        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student {student_id} not assigned to class {class_id}")

        await self.db.delete(assignment)
        await self.db.commit()
        return {"detail": f"Student {student_id} successfully removed from class {class_id}"}

    async def get_students_in_class(self, class_id: int, skip: int = 0, limit: int = 100) -> List[Student]:
        result = await self.db.execute(select(Class).filter(Class.class_id == class_id))
        class_obj = result.scalars().first()
        if not class_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Class with id {class_id} not found")

        stmt = select(Student).join(ClassStudent).filter(ClassStudent.class_id == class_id).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        students = result.scalars().all()
        return students

    async def get_classes_for_student(self, student_id: int, skip: int = 0, limit: int = 100) -> List[Class]:
        result = await self.db.execute(select(Student).filter(Student.student_id == student_id))
        student_obj = result.scalars().first()
        if not student_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student with id {student_id} not found")

        stmt = select(Class).join(ClassStudent).filter(ClassStudent.student_id == student_id).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        classes = result.scalars().all()
        return classes
