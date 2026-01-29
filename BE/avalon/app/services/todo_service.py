from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.todo import Todo, TodoType
from ..schemas.todo import TodoCreate, TodoUpdate
from ..models.curriculum_detail import CurriculumDetail
from ..models.subject import Subject

class TodoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_todo(self, todo_id: int) -> Todo:
        result = await self.db.execute(select(Todo).filter(Todo.todo_id == todo_id))
        todo = result.scalars().first()
        if not todo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
        return todo

    async def get_all_todos(self, skip: int = 0, limit: int = 100, curri_detail_id: Optional[int] = None, subject_id: Optional[int] = None, todo_type: Optional[TodoType] = None, curriculum_id: Optional[int] = None) -> List[Todo]:
        query = select(Todo)
        if curriculum_id is not None:
            query = query.join(CurriculumDetail).filter(CurriculumDetail.curriculum_id == curriculum_id)
        if curri_detail_id is not None:
            query = query.filter(Todo.curri_detail_id == curri_detail_id)
        if subject_id is not None:
            query = query.filter(Todo.subject_id == subject_id)
        if todo_type is not None:
            query = query.filter(Todo.todo_type == todo_type)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_todo(self, todo_data: TodoCreate) -> Todo:
        result = await self.db.execute(select(CurriculumDetail).filter(CurriculumDetail.curri_detail_id == todo_data.curri_detail_id))
        curriculum_detail = result.scalars().first()
        if not curriculum_detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Curriculum Detail with id {todo_data.curri_detail_id} not found")

        result = await self.db.execute(select(Subject).filter(Subject.subject_id == todo_data.subject_id))
        subject = result.scalars().first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject with id {todo_data.subject_id} not found")

        result = await self.db.execute(select(Todo).filter(
            Todo.curri_detail_id == todo_data.curri_detail_id,
            Todo.subject_id == todo_data.subject_id,
            Todo.todo_type == todo_data.todo_type
        ))
        existing_todo = result.scalars().first()
        if existing_todo:
            raise HTTPException(status_code=400, detail="A todo with the same curriculum detail, subject, and type already exists")

        db_todo = Todo(**todo_data.model_dump())
        self.db.add(db_todo)
        await self.db.commit()
        await self.db.refresh(db_todo)
        return db_todo

    async def update_todo(self, todo_id: int, todo_data: TodoUpdate) -> Todo:
        db_todo = await self.get_todo(todo_id)

        update_data = todo_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_todo, key, value)

        await self.db.commit()
        await self.db.refresh(db_todo)
        return db_todo

    async def delete_todo(self, todo_id: int) -> None:
        db_todo = await self.get_todo(todo_id)
        await self.db.delete(db_todo)
        await self.db.commit()