from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date
import pytz, re
from typing import List, Optional

from sqlalchemy import select, and_
from ..models import User
from ..models.user import UserRole, UserStatus, ROLE_HIERARCHY
from ..models.class_session import ClassSession
from ..schemas.user import UserCreate, UserUpdate, UserResponse, UserPasswordUpdate, AssignedSubjectDetail
from ..core.security import get_password_hash, verify_password
from ..utils.redis_client import redis_client
from ..models.assignment import TeacherAssignment
from ..models.class_model import Class
from ..models.semester import Semester
from ..models.subject import Subject
from ..models.classtime import Classtime

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate, current_user: User) -> UserResponse:
        """사용자 생성. 생성자 역할에 따라 초기 상태가 결정됨."""
        # 중복 사용자 이름 체크
        result = await self.db.execute(select(User).where(User.username == user_data.username, User.status != UserStatus.DELETED))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )

        # 역할에 따른 상태 설정
        initial_status = UserStatus.INACTIVE
        admin_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        # 관리자가 관리자를 생성하는 경우 즉시 활성화
        if current_user.role in admin_roles and user_data.role in admin_roles:
            initial_status = UserStatus.ACTIVE

        # 전화번호에서 특수문자 제거
        phone = user_data.phone
        if phone:
            user_data.phone = re.sub(r'[^0-9]', '', phone)

        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            password_hash=hashed_password,
            name=user_data.name,
            email=user_data.email,
            phone=user_data.phone,
            role=user_data.role,
            branch_id=user_data.branch_id,
            status=initial_status,
            is_foreign=user_data.is_foreign
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return UserResponse.model_validate(new_user)

    async def get_user(self, user_id: int, branch_id: int) -> UserResponse:
        """사용자 조회 (복합 키 사용)"""
        result = await self.db.execute(select(User).where(User.user_id == user_id, User.branch_id == branch_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return UserResponse.model_validate(user)

    async def get_all_users(self, current_user: User, skip: int = 0, limit: int = 100, branch_id: Optional[int] = None, role: Optional[UserRole] = None, is_foreign: Optional[bool] = None) -> List[UserResponse]:
        """모든 사용자 목록 조회"""
        filters = [User.role != UserRole.SUPER_ADMIN]
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            filters.append(User.status != UserStatus.DELETED)
        if branch_id is not None:
            filters.append(User.branch_id == branch_id)
        if role is not None:
            filters.append(User.role == role)
        if is_foreign is not None:
            filters.append(User.is_foreign == is_foreign)
        stmt = select(User).where(and_(*filters)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        return [UserResponse.model_validate(user) for user in users]

    async def update_user_info(self, user_id: int, branch_id: int, user_data: UserUpdate, current_user: User) -> UserResponse:
        """사용자 정보 수정 (역할 및 상태 변경 포함)"""
        result = await self.db.execute(select(User).where(User.user_id == user_id, User.branch_id == branch_id))
        user_to_update = result.scalars().first()
        if not user_to_update:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # 역할 변경 시 권한 체크 (새로운 역할이 제공된 경우)
        if user_data.role is not None:
            # SUPER_ADMIN은 모든 역할 변경 가능 (자신 제외)
            if current_user.role == UserRole.SUPER_ADMIN:
                if user_to_update.user_id != current_user.user_id and user_data.role == UserRole.SUPER_ADMIN:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign super_admin role to another user")
            else:
                # 자신보다 높은 역할로 변경 시도 방지
                if ROLE_HIERARCHY[user_data.role] > ROLE_HIERARCHY[current_user.role]:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign a role higher than or equal to your own")
                # 대상 사용자의 현재 본인 역할보다 높은 역할로 변경 시도 방지 (SUPER_ADMIN 제외)
                if user_to_update.user_id != current_user.user_id and ROLE_HIERARCHY[user_to_update.role] >= ROLE_HIERARCHY[current_user.role]:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign a role higher than or equal to the target user's current role")
                # SUPER_ADMIN 역할 부여 방지 (SUPER_ADMIN이 아닌 경우)
                if user_data.role == UserRole.SUPER_ADMIN:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign super_admin role")

        if user_data.is_foreign is not None and user_data.is_foreign != user_to_update.is_foreign:
            if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super_admin or admin can change is_foreign")

        # 지점 변경 시 권한 체크 (SUPER_ADMIN, ADMIN만 가능)
        if user_data.branch_id is not None and user_data.branch_id != user_to_update.branch_id:
            if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super_admin or admin can change branch_id")

        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user_to_update, field, value)
        await self.db.commit()
        await self.db.refresh(user_to_update)
        return UserResponse.model_validate(user_to_update)

    async def soft_delete_user(self, user_id: int, branch_id: int):
        """사용자 소프트 삭제"""
        result = await self.db.execute(User.__table__.select().where(User.user_id == user_id, User.branch_id == branch_id, User.status != UserStatus.DELETED))
        user_row = result.first()
        user = User(**user_row._mapping) if user_row else None
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or already deleted"
            )
        user.status = UserStatus.DELETED
        user.deleted_at = datetime.now(pytz.timezone('Asia/Seoul'))
        await self.db.commit()
        await redis_client.delete_refresh_token(user.user_id)
        return {"message": "User successfully deleted"}

    async def check_user_permission(self, current_user: User, target_user_id: int, target_branch_id: int) -> bool:
        """사용자 권한 체크 (계층 기반)"""
        result = await self.db.execute(User.__table__.select().where(User.user_id == target_user_id, User.branch_id == target_branch_id))
        user_row = result.first()
        target_user = User(**user_row._mapping) if user_row else None
        if not target_user:
            return False # Target user not found
        # SUPER_ADMIN과 ADMIN은 DELETED 사용자 조회 가능
        if target_user.status == UserStatus.DELETED:
            if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
                return True
            else:
                return False # DELETED 사용자는 SUPER_ADMIN/ADMIN만 조회 가능
        # SUPER_ADMIN은 모든 사용자 관리 가능
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return True
        # 본인 정보는 항상 관리 가능
        if current_user.user_id == target_user_id and current_user.branch_id == target_branch_id:
            return True
        # 현재 사용자의 역할 계층이 대상 사용자의 역할 계층보다 높거나 같아야 함
        # 단, SUPER_ADMIN이 아닌 경우 자신과 같거나 높은 계층의 다른 사용자는 관리 불가
        if ROLE_HIERARCHY[current_user.role] >= ROLE_HIERARCHY[target_user.role]:
            return True
        return False

    async def get_available_teachers(self, session_date: date, classtime_id: int) -> List[UserResponse]:
        """
        Get a list of teachers who are available on a specific date and classtime.
        """
        # Find all teacher IDs who are already booked for the given date and classtime
        booked_teacher_ids_stmt = select(ClassSession.teacher_id).where(ClassSession.session_date == session_date, ClassSession.classtime_id == classtime_id)
        booked_teacher_ids_result = await self.db.execute(booked_teacher_ids_stmt)
        booked_teacher_ids = [row[0] for row in booked_teacher_ids_result.fetchall()]
        teacher_roles = [UserRole.TEACHER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
        available_teachers_stmt = select(User).where(
            User.role.in_(teacher_roles),
            User.status == UserStatus.ACTIVE,
            User.user_id.notin_(booked_teacher_ids)
        )
        available_teachers_result = await self.db.execute(available_teachers_stmt)
        available_teachers = [User(**row._mapping) for row in available_teachers_result.fetchall()]
        return [UserResponse.model_validate(teacher) for teacher in available_teachers]

    async def update_password(self, current_user: User, password_data: UserPasswordUpdate):
        """로그인된 사용자의 비밀번호를 변경합니다."""
        # 현재 비밀번호 확인
        if not verify_password(password_data.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        # 새 비밀번호 해싱 및 업데이트
        current_user.password_hash = get_password_hash(password_data.new_password)
        self.db.add(current_user)
        await self.db.commit()
        return {"message": "Password updated successfully"}

    async def get_assigned_subjects_by_semester(self, user_id: int, semester_id: Optional[int] = None) -> List[AssignedSubjectDetail]:
        """사용자의 학기별 담당 과목 목록을 반별 상세 정보와 함께 조회합니다."""
        # 모든 slot을 가져온 뒤, class_id/subject_id 기준으로 그룹화하여 weekday/classtime_id를 리스트로 묶음
        stmt = (
            select(
                Semester.semester_id,
                Semester.semester_name.label("semester_name"),
                Class.class_id,
                Class.class_name,
                Subject.subject_id,
                Subject.subject_name.label("subject_name"),
                TeacherAssignment.weekday,
                TeacherAssignment.time_id.label("classtime_id")
            )
            .select_from(TeacherAssignment)
            .join(Class, TeacherAssignment.class_id == Class.class_id)
            .join(Semester, Class.semester_id == Semester.semester_id)
            .join(Subject, TeacherAssignment.subject_id == Subject.subject_id)
            .where(TeacherAssignment.user_id == user_id)
        )
        if semester_id:
            stmt = stmt.where(Class.semester_id == semester_id)
        slot_results = await self.db.execute(stmt)
        slot_results = slot_results.fetchall()
        # 그룹화: (semester_id, class_id, subject_id) 기준으로 weekday/classtime_id 리스트로 묶음
        grouped = {}
        for row in slot_results:
            key = (row.semester_id, row.class_id, row.subject_id)
            if key not in grouped:
                grouped[key] = {
                    "semester_id": row.semester_id,
                    "semester_name": row.semester_name,
                    "class_id": row.class_id,
                    "class_name": row.class_name,
                    "subject_id": row.subject_id,
                    "subject_name": row.subject_name,
                    "weekday": [],
                    "classtime_id": []
                }
            grouped[key]["weekday"].append(row.weekday)
            grouped[key]["classtime_id"].append(row.classtime_id)
        # AssignedSubjectDetail에 맞게 반환
        return [AssignedSubjectDetail.model_validate(item) for item in grouped.values()]
