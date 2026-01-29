from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date

from ..models import Assignment, User, Course
from ..schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from ..core.logging import app_logger

class AssignmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_assignment(self, assignment_data: AssignmentCreate) -> AssignmentResponse:
        try:
            result = await self.db.execute(select(User).filter(User.user_id == assignment_data.user_id, User.branch_id == assignment_data.branch_id))
            user = result.scalars().first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            result = await self.db.execute(select(Course).filter(Course.id == assignment_data.course_id))
            course = result.scalars().first()
            if not course:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

            result = await self.db.execute(select(Assignment).filter_by(
                user_id=assignment_data.user_id,
                course_id=assignment_data.course_id
            ))
            existing_assignment = result.scalars().first()
            if existing_assignment:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment already exists")

            new_assignment = Assignment(**assignment_data.model_dump(exclude={'branch_id'}))
            self.db.add(new_assignment)
            await self.db.commit()
            await self.db.refresh(new_assignment)
            return AssignmentResponse.model_validate(new_assignment)
        except HTTPException:
            raise
        except Exception as e:
            app_logger.error(f"Unexpected error in create_assignment: {e}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during assignment creation")

    async def get_assignment(self, assignment_id: int) -> AssignmentResponse:
        try:
            result = await self.db.execute(select(Assignment).filter(Assignment.id == assignment_id))
            assignment = result.scalars().first()
            if not assignment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
            return AssignmentResponse.model_validate(assignment)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during assignment retrieval: {e}")

    async def get_all_assignments(self, skip: int = 0, limit: int = 100) -> List[AssignmentResponse]:
        try:
            stmt = select(Assignment).offset(skip).limit(limit)
            result = await self.db.execute(stmt)
            assignments = result.scalars().all()
            return [AssignmentResponse.model_validate(assignment) for assignment in assignments]
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during assignment list retrieval: {e}")

    async def get_assignments_by_user(self, user_id: int) -> List[AssignmentResponse]:
        try:
            result = await self.db.execute(select(Assignment).filter(Assignment.user_id == user_id))
            assignments = result.scalars().all()
            return [AssignmentResponse.model_validate(assignment) for assignment in assignments]
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during user assignment retrieval: {e}")

    async def get_assignments_by_class(self, class_id: int) -> List[AssignmentResponse]:
        try:
            result = await self.db.execute(select(Assignment).filter(Assignment.course_id == class_id))
            assignments = result.scalars().all()
            return [AssignmentResponse.model_validate(assignment) for assignment in assignments]
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during class assignment retrieval: {e}")

    async def update_assignment(self, assignment_id: int, assignment_data: AssignmentUpdate) -> AssignmentResponse:
        try:
            result = await self.db.execute(select(Assignment).filter(Assignment.id == assignment_id))
            assignment = result.scalars().first()
            if not assignment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
            
            update_data = assignment_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(assignment, field, value)
            
            await self.db.commit()
            await self.db.refresh(assignment)
            return AssignmentResponse.model_validate(assignment)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during assignment update: {e}")

    async def delete_assignment(self, assignment_id: int):
        try:
            result = await self.db.execute(select(Assignment).filter(Assignment.id == assignment_id))
            assignment = result.scalars().first()
            if not assignment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
            
            await self.db.delete(assignment)
            await self.db.commit()
            return {"message": "Assignment successfully deleted"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error during assignment deletion: {e}")