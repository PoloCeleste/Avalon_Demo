from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.student_comment import StudentComment
from app.schemas.student_comment import StudentCommentCreate
from typing import List, Optional

async def create_student_comment(db: AsyncSession, comment: StudentCommentCreate) -> StudentComment:
    db_comment = StudentComment(**comment.model_dump())
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    return db_comment

async def get_student_comments_by_student(db: AsyncSession, student_id: int) -> List[StudentComment]:
    result = await db.execute(select(StudentComment).filter(StudentComment.student_id == student_id))
    return result.scalars().all()

async def get_student_comment(db: AsyncSession, comment_id: int) -> Optional[StudentComment]:
    result = await db.execute(select(StudentComment).filter(StudentComment.comment_id == comment_id))
    return result.scalars().first()

async def delete_student_comment(db: AsyncSession, comment_id: int) -> Optional[StudentComment]:
    db_comment = await get_student_comment(db, comment_id)
    if db_comment:
        await db.delete(db_comment)
        await db.commit()
    return db_comment
