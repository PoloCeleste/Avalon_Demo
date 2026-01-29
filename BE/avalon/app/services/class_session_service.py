from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from ..models.weekday import Weekday
from ..models.class_session import ClassSession
from ..schemas.class_session import (
    ClassSessionCreate,
    ClassSessionUpdate,
    ClassSessionBulkTeacherAssignment,
    ClassSessionTeacherUpdate,
    TeacherAssignmentUpdate,  
)
from ..models.class_model import Class
from ..models.subject import Subject
from ..models.classtime import Classtime
from ..models.user import User, UserStatus
from ..models.curriculum_detail import CurriculumDetail
from ..models.assignment import TeacherAssignment


# Python datetime.weekday() -> 도메인 Weekday enum 매핑
WEEKDAY_MAP = {
    0: Weekday.Mon,
    1: Weekday.Tue,
    2: Weekday.Wed,
    3: Weekday.Thu,
    4: Weekday.Fri,
    5: Weekday.Sat,
    6: Weekday.Sun,
}


class ClassSessionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_class_session(self, session_id: int) -> ClassSession:
        stmt = select(ClassSession).where(ClassSession.session_id == session_id)
        result = await self.db.execute(stmt)
        session = result.scalars().first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class Session not found",
            )
        return session

    async def get_all_class_sessions(
        self,
        skip: int = 0,
        limit: int = 100,
        class_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        teacher_id: Optional[int] = None,
        session_date: Optional[date] = None,
        weekday: Optional[Weekday] = None,
    ) -> List[ClassSession]:
        filters = []
        if class_id is not None:
            filters.append(ClassSession.class_id == class_id)
        if subject_id is not None:
            filters.append(ClassSession.subject_id == subject_id)
        if teacher_id is not None:
            filters.append(ClassSession.teacher_id == teacher_id)
        if session_date is not None:
            filters.append(ClassSession.session_date == session_date)
        if weekday is not None:
            filters.append(ClassSession.weekday == weekday)
        stmt = select(ClassSession).where(and_(*filters)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_class_session(self, session_data: ClassSessionCreate) -> ClassSession:
        # Class 존재 확인
        class_stmt = select(Class).where(Class.class_id == session_data.class_id)
        class_result = await self.db.execute(class_stmt)
        class_obj = class_result.scalars().first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Class with id {session_data.class_id} not found",
            )
        # Subject 확인
        subject_stmt = select(Subject).where(Subject.subject_id == session_data.subject_id)
        subject_result = await self.db.execute(subject_stmt)
        subject = subject_result.scalars().first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subject with id {session_data.subject_id} not found",
            )
        # Classtime 확인
        classtime_stmt = select(Classtime).where(Classtime.time_id == session_data.classtime_id)
        classtime_result = await self.db.execute(classtime_stmt)
        classtime = classtime_result.scalars().first()
        if not classtime:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Classtime with id {session_data.classtime_id} not found",
            )
        # Teacher는 Optional, 주어진 경우만 검증
        if session_data.teacher_id is not None:
            teacher_stmt = select(User).where(
                User.user_id == session_data.teacher_id,
                User.status.in_([UserStatus.ACTIVE, UserStatus.INACTIVE]),
            )
            teacher_result = await self.db.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            if not teacher:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"not found or not active."
                    ),
                )

        # 커리큘럼 상세(Optional) 검증
        if session_data.curri_detail_id:
            curri_detail_stmt = select(CurriculumDetail).where(
                CurriculumDetail.curri_detail_id == session_data.curri_detail_id
            )
            curri_detail_result = await self.db.execute(curri_detail_stmt)
            curri_detail = curri_detail_result.scalars().first()
            if not curri_detail:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Curriculum Detail with id "
                        f"{session_data.curri_detail_id} not found."
                    ),
                )

        # (class_id, subject_id, classtime_id, session_date, weekday, session_order) 유니크 보장
        existing_session_stmt = select(ClassSession).where(
            ClassSession.class_id == session_data.class_id,
            ClassSession.subject_id == session_data.subject_id,
            ClassSession.classtime_id == session_data.classtime_id,
            ClassSession.session_date == session_data.session_date,
            ClassSession.weekday == session_data.weekday,
            ClassSession.session_order == session_data.session_order,
        )
        existing_session_result = await self.db.execute(existing_session_stmt)
        existing_session = existing_session_result.scalars().first()
        if existing_session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Session for class {session_data.class_id} on "
                    f"{session_data.session_date} at classtime "
                    f"{session_data.classtime_id} with order "
                    f"{session_data.session_order} already exists."
                ),
            )

        # 요일 재계산(날짜가 있으면 덮어쓰기)
        weekday_name = WEEKDAY_MAP[session_data.session_date.weekday()]

        # Pydantic v2 스키마 -> dict
        payload = session_data.model_dump()
        payload["weekday"] = weekday_name

        db_session = ClassSession(**payload)
        self.db.add(db_session)
        # TeacherAssignment 자동 생성: 해당 slot에 없으면 추가
        if db_session.teacher_id is not None:
            assignment_stmt = select(TeacherAssignment).where(
                TeacherAssignment.class_id == db_session.class_id,
                TeacherAssignment.subject_id == db_session.subject_id,
                TeacherAssignment.time_id == db_session.classtime_id,
                TeacherAssignment.weekday == db_session.weekday
            )
            assignment_result = await self.db.execute(assignment_stmt)
            existing_assignment = assignment_result.scalars().first()
            if not existing_assignment:
                new_assignment = TeacherAssignment(
                    user_id=db_session.teacher_id,
                    subject_id=db_session.subject_id,
                    class_id=db_session.class_id,
                    time_id=db_session.classtime_id,
                    weekday=db_session.weekday
                )
                self.db.add(new_assignment)
        await self.db.commit()
        await self.db.refresh(db_session)
        return db_session

    async def update_class_session(
        self, session_id: int, session_data: ClassSessionUpdate
    ) -> ClassSession:
        db_session = await self.get_class_session(session_id)

        update_data = session_data.model_dump(exclude_unset=True)

        # 교사/날짜/교시 변경 시 중복 배정 검사
        if (
            "teacher_id" in update_data
            or "session_date" in update_data
            or "classtime_id" in update_data
        ):
            proposed_teacher_id = update_data.get("teacher_id", db_session.teacher_id)
            proposed_session_date = update_data.get(
                "session_date", db_session.session_date
            )
            proposed_classtime_id = update_data.get(
                "classtime_id", db_session.classtime_id
            )

            if proposed_teacher_id is not None:
                booking_stmt = select(ClassSession).where(
                    ClassSession.session_date == proposed_session_date,
                    ClassSession.classtime_id == proposed_classtime_id,
                    ClassSession.teacher_id == proposed_teacher_id,
                    ClassSession.session_id != session_id,
                )
                booking_result = await self.db.execute(booking_stmt)
                existing_booking = booking_result.scalars().first()
                if existing_booking:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Teacher {proposed_teacher_id} is already booked for "
                            f"{proposed_session_date} at classtime "
                            f"{proposed_classtime_id}."
                        ),
                    )

        # 실제 필드 적용
        for key, value in update_data.items():
            setattr(db_session, key, value)

        await self.db.commit()
        await self.db.refresh(db_session)
        return db_session

    async def delete_class_session(self, session_id: int):
        db_session = await self.get_class_session(session_id)
        await self.db.delete(db_session)
        await self.db.commit()
        return {"detail": "Class Session successfully deleted"}

    async def get_teacher_availability(
        self, teacher_id: int, check_date: date, check_time_id: int
    ) -> bool:
        """
        특정 날짜/교시에 교사가 비어있는지 확인.
        True면 가능, False면 이미 배정됨.
        """
        booking_stmt = select(ClassSession).where(
            ClassSession.session_date == check_date,
            ClassSession.classtime_id == check_time_id,
            ClassSession.teacher_id == teacher_id,
        )
        booking_result = await self.db.execute(booking_stmt)
        existing_booking = booking_result.scalars().first()
        return existing_booking is None

    async def bulk_assign_teachers(
        self, teacher_assignments: List[ClassSessionBulkTeacherAssignment]
    ) -> List[ClassSession]:
        updated_sessions: List[ClassSession] = []
        # 1. Get all unique assignment keys from the request
        assignment_keys = {
            (
                d.class_id,
                d.weekday,
                d.classtime_id,
                d.subject_id,
            )
            for d in teacher_assignments
        }

        # 2. Find all existing assignments for these keys in one query
        filters = [
            and_(
                TeacherAssignment.class_id == class_id,
                TeacherAssignment.weekday == weekday,
                TeacherAssignment.time_id == classtime_id,
                TeacherAssignment.subject_id == subject_id,
            )
            for class_id, weekday, classtime_id, subject_id in assignment_keys
        ]
        existing_assignments_query = select(TeacherAssignment)
        if filters:
            existing_assignments_query = existing_assignments_query.where(or_(*filters))

        existing_assignments_result = await self.db.execute(existing_assignments_query)
        existing_assignments_rows = existing_assignments_result.scalars().all()
        existing_assignments = {
            (
                a.class_id,
                a.weekday,
                a.time_id,
                a.subject_id,
            )
            for a in existing_assignments_rows
        }

        # 3. Process only new assignments
        for assignment_data in teacher_assignments:
            request_key = (
                assignment_data.class_id,
                assignment_data.weekday,
                assignment_data.classtime_id,
                assignment_data.subject_id,
            )

            # If assignment already exists in DB, skip
            if request_key in existing_assignments:
                print(f"Info: Assignment for {request_key} already exists. Skipping.")
                continue

            # If the slot is empty, proceed with the new assignment
            if assignment_data.teacher_id is None:
                continue

            # Find sessions to update
            sessions_stmt = select(ClassSession).where(
                ClassSession.class_id == assignment_data.class_id,
                ClassSession.weekday == assignment_data.weekday,
                ClassSession.classtime_id == assignment_data.classtime_id,
                ClassSession.subject_id == assignment_data.subject_id,
            )
            sessions_result = await self.db.execute(sessions_stmt)
            sessions_to_update = sessions_result.scalars().all()

            if not sessions_to_update:
                continue

            # Validate teacher
            teacher_stmt = select(User).where(
                User.user_id == assignment_data.teacher_id,
                User.status == UserStatus.ACTIVE,
            )
            teacher_result = await self.db.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            if not teacher:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Teacher with ID {assignment_data.teacher_id} not found or not active."
                )

            # Check for booking conflicts
            for session in sessions_to_update:
                booking_stmt = select(ClassSession).where(
                    ClassSession.session_date == session.session_date,
                    ClassSession.classtime_id == session.classtime_id,
                    ClassSession.teacher_id == assignment_data.teacher_id,
                )
                booking_result = await self.db.execute(booking_stmt)
                existing_booking = booking_result.scalars().first()
                if existing_booking:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Teacher {assignment_data.teacher_id} is already "
                            f"booked for {session.session_date} at classtime "
                            f"{session.classtime_id}. Assignment failed."
                        )
                    )
            # Create new TeacherAssignment
            new_assignment = TeacherAssignment(
                user_id=assignment_data.teacher_id,
                subject_id=assignment_data.subject_id,
                class_id=assignment_data.class_id,
                time_id=assignment_data.classtime_id,
                weekday=assignment_data.weekday
            )
            self.db.add(new_assignment)

            # Update sessions
            for session in sessions_to_update:
                session.teacher_id = assignment_data.teacher_id
                updated_sessions.append(session)

        await self.db.commit()
        for session in updated_sessions:
            await self.db.refresh(session)
        return updated_sessions

    async def update_teacher_for_slot(
        self, assignment_data: TeacherAssignmentUpdate
    ) -> List[ClassSession]:
        # Find all sessions for the given slot
        sessions_stmt = select(ClassSession).where(
            ClassSession.class_id == assignment_data.class_id,
            ClassSession.weekday == assignment_data.weekday,
            ClassSession.classtime_id == assignment_data.classtime_id,
            ClassSession.subject_id == assignment_data.subject_id,
        )
        sessions_result = await self.db.execute(sessions_stmt)
        sessions_to_update = sessions_result.scalars().all()

        if not sessions_to_update:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No class sessions found for the specified slot.",
            )

        # Delete the existing TeacherAssignment for this slot
        delete_stmt = (
            TeacherAssignment.__table__.delete().where(
                TeacherAssignment.class_id == assignment_data.class_id,
                TeacherAssignment.subject_id == assignment_data.subject_id,
                TeacherAssignment.time_id == assignment_data.classtime_id,
                TeacherAssignment.weekday == assignment_data.weekday,
            )
        )
        await self.db.execute(delete_stmt)

        # If a new teacher is being assigned, create a new assignment
        if assignment_data.teacher_id is not None:
            # Validate teacher
            teacher_stmt = select(User).where(
                User.user_id == assignment_data.teacher_id,
                User.status == UserStatus.ACTIVE,
            )
            teacher_result = await self.db.execute(teacher_stmt)
            teacher = teacher_result.scalars().first()
            if not teacher:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Teacher with ID {assignment_data.teacher_id} not found or not active.",
                )

            # Check for booking conflicts
            for session in sessions_to_update:
                booking_stmt = select(ClassSession).where(
                    ClassSession.session_date == session.session_date,
                    ClassSession.classtime_id == session.classtime_id,
                    ClassSession.teacher_id == assignment_data.teacher_id,
                    ClassSession.session_id != session.session_id,
                )
                booking_result = await self.db.execute(booking_stmt)
                existing_booking = booking_result.scalars().first()
                if existing_booking:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Teacher {assignment_data.teacher_id} is already "
                            f"booked for {session.session_date} at classtime "
                            f"{session.classtime_id}. Assignment failed."
                        ),
                    )

            # Create new TeacherAssignment
            new_assignment = TeacherAssignment(
                user_id=assignment_data.teacher_id,
                subject_id=assignment_data.subject_id,
                class_id=assignment_data.class_id,
                time_id=assignment_data.classtime_id,
                weekday=assignment_data.weekday,
            )
            self.db.add(new_assignment)

        # Update teacher_id in all affected sessions
        for session in sessions_to_update:
            session.teacher_id = assignment_data.teacher_id

        await self.db.commit()
        return sessions_to_update