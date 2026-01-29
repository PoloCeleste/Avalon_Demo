from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ..schemas.semester import Semester, SemesterCreate, SemesterUpdate
from ..services.semester_service import SemesterService
from ..core.database import get_db
from ..utils.dependencies import require_manager_or_higher, require_teacher_or_higher
from ..models.user import User

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_SEMESTERS = [
    {
        "semester_id": 1,
        "semester_name": "2024-1학기",
        "semester_start_at": "2024-03-01",
        "semester_end_at": "2024-08-31",
        "season": "Spring",
        "status": 2,  # Completed
        "branch_id": 1,
    },
    {
        "semester_id": 2,
        "semester_name": "2024-2학기",
        "semester_start_at": "2024-09-01",
        "semester_end_at": "2025-02-28",
        "season": "Fall",
        "status": 2,  # Completed
        "branch_id": 1,
    },
    {
        "semester_id": 3,
        "semester_name": "2025-1학기",
        "semester_start_at": "2025-03-01",
        "semester_end_at": "2025-08-31",
        "season": "Spring",
        "status": 2,  # Completed
        "branch_id": 1,
    },
    {
        "semester_id": 4,
        "semester_name": "2025-2학기",
        "semester_start_at": "2025-09-01",
        "semester_end_at": "2026-02-28",
        "season": "Fall",
        "status": 1,  # InProgress
        "branch_id": 1,
    }
]

@router.get("", response_model=List[Semester])
async def get_all_semesters(skip: int = Query(0, ge=0), 
                    limit: int = Query(100, ge=1, le=1000),
                    branch_id: Optional[int] = Query(None)):
    """학기 목록 조회 - 데모 버전"""
    return DEMO_SEMESTERS[skip:skip+limit]

@router.get("/{semester_id}", response_model=Semester)
async def get_semester(semester_id: int):
    """학기 상세 조회 - 데모 버전"""
    semester = next((s for s in DEMO_SEMESTERS if s["semester_id"] == semester_id), None)
    if not semester:
        raise HTTPException(status_code=404, detail="학기를 찾을 수 없습니다.")
    return semester