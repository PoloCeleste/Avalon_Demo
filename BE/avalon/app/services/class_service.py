from __future__ import annotations

from datetime import timedelta, date
from math import floor
from typing import List, Optional, Dict, Tuple

from fastapi import HTTPException, status

from ..models.class_model import Class
from ..schemas.class_schema import ClassCreate, ClassUpdate
from ..models.semester import Semester
from ..models.curriculum import Curriculum
from ..models.user import User, UserRole, UserStatus 
from ..models.holiday import Holiday
from ..models.class_session import ClassSession
from ..models.subject import Subject
from ..models.classtime import Classtime
from ..models.curriculum_detail import CurriculumDetail
from ..schemas.class_session import ClassSessionCreate
from ..schemas.test import TestCreate
from ..models.weekday import Weekday
from ..models.test import Test
from ..models.assignment import TeacherAssignment

from ..services.class_session_service import ClassSessionService, WEEKDAY_MAP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select, and_, delete

class ClassService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_class(self, class_obj_id: int) -> Class:
        stmt = select(Class).options(joinedload(Class.semester)).where(Class.class_id == class_obj_id)
        result = await self.db.execute(stmt)
        row = result.scalars().first()
        class_obj = row if row else None
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )
        return class_obj

    async def get_all_classes(
        self,
        skip: int = 0,
        limit: int = 100,
        semester_id: Optional[int] = None,
        curriculum_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> List[Class]:
        filters = []
        if semester_id is not None:
            filters.append(Class.semester_id == semester_id)
        if curriculum_id is not None:
            filters.append(Class.curriculum_id == curriculum_id)
        if is_active is not None:
            filters.append(Class.is_active == is_active)
        stmt = select(Class).where(and_(*filters)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_class(
        self,
        class_data: ClassCreate,
        # schedule_details는 ClassCreate 내부 필드로 관리
        # 세션 생성은 별도 API에서 처리
    ) -> Class:
        # Validate semester
        semester_stmt = select(Semester).where(Semester.semester_id == class_data.semester_id)
        semester_result = await self.db.execute(semester_stmt)
        semester = semester_result.scalars().first()
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Semester with id {class_data.semester_id} not found",
            )
        # Validate curriculum
        curriculum_stmt = select(Curriculum).where(Curriculum.curriculum_id == class_data.curriculum_id)
        curriculum_result = await self.db.execute(curriculum_stmt)
        curriculum = curriculum_result.scalars().first()
        if not curriculum:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Curriculum with id {class_data.curriculum_id} not found",
            )
        # Validate homeroom teachers
        kr_homeroom_stmt = select(User).where(User.user_id == class_data.kr_homeroom_id)
        kr_homeroom_result = await self.db.execute(kr_homeroom_stmt)
        kr_homeroom = kr_homeroom_result.scalars().first()
        if not kr_homeroom or kr_homeroom.role == UserRole.ASSISTANT:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Korean homeroom teacher with id {class_data.kr_homeroom_id} "
                    f"not found or not a teacher"
                ),
            )
        fr_homeroom_stmt = select(User).where(User.user_id == class_data.fr_homeroom_id)
        fr_homeroom_result = await self.db.execute(fr_homeroom_stmt)
        fr_homeroom = fr_homeroom_result.scalars().first()
        if not fr_homeroom or fr_homeroom.role == UserRole.ASSISTANT:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Foreign homeroom teacher with id {class_data.fr_homeroom_id} "
                    f"not found or not a teacher"
                ),
            )
        # Check duplicate class name in same semester
        existing_class_stmt = select(Class).where(
            Class.semester_id == class_data.semester_id,
            Class.class_name == class_data.class_name,
        )
        existing_class_result = await self.db.execute(existing_class_stmt)
        existing_class = existing_class_result.scalars().first()
        if existing_class:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Class with the same name already exists in this semester"
                ),
            )
        # Create class
        schedule_details_for_json = class_data.schedule_details_json
        class_data_dict = class_data.model_dump(exclude={'schedule_details_json'})
        class_data_dict['schedule_details_json'] = schedule_details_for_json
        db_class = Class(**class_data_dict)
        self.db.add(db_class)
        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(db_class)
        return db_class

    async def update_class(self, class_obj_id: int, class_data: ClassUpdate) -> Class:
        db_class = await self.get_class(class_obj_id)
        update_data = class_data.model_dump(exclude_unset=True)
        if "class_name" in update_data:
            existing_class_stmt = select(Class).where(
                Class.semester_id == db_class.semester_id,
                Class.class_name == update_data["class_name"],
                Class.class_id != class_obj_id,
            )
            existing_class_result = await self.db.execute(existing_class_stmt)
            existing_class = existing_class_result.scalars().first()
            if existing_class:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Another class with this name already exists in this semester"
                    ),
                )
        if "schedule_details_json" in update_data:
            db_class.schedule_details_json = update_data["schedule_details_json"]
            del update_data["schedule_details_json"]
        for key, value in update_data.items():
            setattr(db_class, key, value)
        await self.db.commit()
        await self.db.refresh(db_class)
        return db_class

    async def generate_sessions_for_class(
        self,
        class_id: int,
    ) -> None:
        db_class = await self.get_class(class_id)
        if not db_class.schedule_details_json:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class has no schedule details to generate sessions.",
            )
        await self._generate_class_sessions(db_class)
        # 세션 생성 완료 후 클래스 활성화
        if db_class.is_active is False:
            db_class.is_active = True
        await self.db.commit()

    async def _generate_class_sessions(
        self,
        db_class: Class,
    ) -> None:
        # 스케줄 상세 가져오기 - 과목이랑 수업시간, 요일
        schedule_details_json: List[dict] = db_class.schedule_details_json

        # TeacherAssignment 미리 생성 (slot별 1회만, teacher_id 있을 때만)
        for detail in schedule_details_json:
            teacher_id = detail.get("teacher_id")
            if teacher_id is None:
                continue
            subject_id = detail["subject_id"]
            classtime_id = detail["classtime_id"]
            weekday = detail["weekday"]
            assignment_stmt = select(TeacherAssignment).where(
                TeacherAssignment.class_id == db_class.class_id,
                TeacherAssignment.subject_id == subject_id,
                TeacherAssignment.time_id == classtime_id,
                TeacherAssignment.weekday == weekday
            )
            assignment_result = await self.db.execute(assignment_stmt)
            existing_assignment = assignment_result.scalars().first()
            if not existing_assignment:
                new_assignment = TeacherAssignment(
                    user_id=teacher_id,
                    subject_id=subject_id,
                    class_id=db_class.class_id,
                    time_id=classtime_id,
                    weekday=weekday
                )
                self.db.add(new_assignment)
        await self.db.commit()

        # 등록된 테스트 목록 가져오기 (비동기)
        test_stmt = select(Test).where(Test.class_id == db_class.class_id)
        test_result = await self.db.execute(test_stmt)
        existing_tests: List[Test] = test_result.scalars().all()

        # Combine provided test_schedules with existing tests
        all_tests_for_class: List[TestCreate | Test] = []
        all_tests_for_class.extend(existing_tests)

        # Prepare test schedule exclusions from all tests
        # Stores (date, classtime_id) tuples
        test_schedule_exclusions: set[Tuple[date, int]] = set()
        for test_schedule in all_tests_for_class:
            # TestCreate와 Test 모델의 속성 접근을 모두 지원해야 함
            test_day = getattr(test_schedule, "test_day", None)
            classtime_ids = getattr(test_schedule, "classtime_ids", None)

            if not test_day:
                continue

            if classtime_ids:
                for classtime_id in classtime_ids:
                    test_schedule_exclusions.add((test_day, classtime_id))
            else:
                # full day block: 모든 교시 제외
                classtime_stmt = select(Classtime)
                classtime_result = await self.db.execute(classtime_stmt)
                all_classtimes = classtime_result.scalars().all()
                for ct in all_classtimes:
                    test_schedule_exclusions.add((test_day, ct.time_id))

        # Prepare curriculum details map and total curriculum days per subject
        curri_details_stmt = select(CurriculumDetail).where(CurriculumDetail.curriculum_id == db_class.curriculum_id)
        curri_details_result = await self.db.execute(curri_details_stmt)
        all_curri_details = curri_details_result.scalars().all()
        curriculum_details_map: Dict[Tuple[int, int], int] = {}
        # {subject_id: total_days}
        total_curriculum_days_per_subject: Dict[int, int] = {}

        for cd in all_curri_details:
            curriculum_details_map[(cd.subject_id, cd.day)] = cd.curri_detail_id
            total_curriculum_days_per_subject[cd.subject_id] = max(
                total_curriculum_days_per_subject.get(cd.subject_id, 0), cd.day
            )

        # Calculate minimum guaranteed sessions per subject
        min_sessions_guaranteed_map: Dict[int, int] = {}
        for subject_id, total_days in total_curriculum_days_per_subject.items():
            # 예: 13일당 10회 보장
            min_sessions_guaranteed_map[subject_id] = floor(total_days / 13) * 10

        # Curriculum day tracker for each subject
        subject_ids_in_schedule = {detail["subject_id"] for detail in schedule_details_json}
        curriculum_day_tracker: Dict[int, int] = {
            subject_id: 1 for subject_id in subject_ids_in_schedule
        }
        created_sessions_for_subject: Dict[int, List[ClassSession]] = {
            subject_id: [] for subject_id in subject_ids_in_schedule
        }
        # Get holidays for the semester
        holidays_stmt = select(Holiday).where(
            Holiday.holiday_date >= db_class.semester.semester_start_at,
            Holiday.holiday_date <= db_class.semester.semester_end_at,
        )
        holidays_result = await self.db.execute(holidays_stmt)
        holidays = holidays_result.scalars().all()
        holiday_dates = {h.holiday_date for h in holidays}

        # Generate sessions for the entire semester
        current_date = db_class.semester.semester_start_at
        end_date = db_class.semester.semester_end_at

        class_session_service = ClassSessionService(self.db)

        while current_date <= end_date:
            # Skip holidays
            if current_date in holiday_dates:
                current_date += timedelta(days=1)
                continue

            current_weekday_enum = WEEKDAY_MAP[current_date.weekday()]
            current_weekday_str = current_weekday_enum.value if hasattr(current_weekday_enum, 'value') else str(current_weekday_enum)

            # 해당 요일 slot만 추출 후 교시 순서로 정렬
            day_details = [d for d in schedule_details_json if d["weekday"] == current_weekday_str]
            day_details_sorted = sorted(day_details, key=lambda d: d["classtime_id"])

            for detail in day_details_sorted:
                subject_id = detail["subject_id"]
                classtime_id = detail["classtime_id"]

                if (current_date, classtime_id) in test_schedule_exclusions:
                    continue

                current_curri_day = curriculum_day_tracker.get(subject_id)
                if current_curri_day is None:
                    continue

                final_curri_detail_id = curriculum_details_map.get(
                    (subject_id, current_curri_day)
                )
                if final_curri_detail_id is None:
                    continue

                teacher_id = detail.get("teacher_id")
                session_create_data = ClassSessionCreate(
                    class_id=db_class.class_id,
                    subject_id=subject_id,
                    classtime_id=classtime_id,
                    teacher_id=teacher_id,  # schedule_details_json에 있으면 반영
                    session_date=current_date,
                    weekday=current_weekday_enum,
                    curri_detail_id=final_curri_detail_id,
                    session_order=1,  # Initial session order
                    is_rescheduled=False,
                    original_date=None,
                    notes=None,
                )

                try:
                    session_obj = await class_session_service.create_class_session(
                        session_create_data
                    )
                    created_sessions_for_subject[subject_id].append(session_obj)
                    curriculum_day_tracker[subject_id] += 1
                except Exception as e:
                    print(
                        f"Warning: Failed to create session for subject {subject_id} "
                        f"at {current_date}: {e}"
                    )

            current_date += timedelta(days=1)


    async def delete_class(self, class_obj_id: int) -> dict:
        class_obj = await self.get_class(class_obj_id)
        if class_obj.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete an enabled class. You can delete it only if is_active is false."
            )
        await self.db.execute(delete(Class).where(Class.class_id == class_obj_id))
        await self.db.commit()
        return {"detail": f"Class {class_obj_id} deleted successfully."}
