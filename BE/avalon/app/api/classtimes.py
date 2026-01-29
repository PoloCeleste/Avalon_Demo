from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import time

from ..schemas.classtime import Classtime, ClasstimeCreate, ClasstimeUpdate
from ..services.classtime_service import ClasstimeService
from ..core.database import get_db
from ..utils.dependencies import require_manager_or_higher, require_teacher_or_higher
from ..models.user import User

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_CLASSTIMES = [
    {"time_id": 1, "start_time": "14:30:00", "end_time": "15:25:00", "day_of_week": 1},
    {"time_id": 2, "start_time": "15:30:00", "end_time": "16:25:00", "day_of_week": 1},
    {"time_id": 3, "start_time": "16:30:00", "end_time": "17:20:00", "day_of_week": 2},
    {"time_id": 4, "start_time": "17:25:00", "end_time": "18:15:00", "day_of_week": 2},
    {"time_id": 5, "start_time": "18:20:00", "end_time": "19:10:00", "day_of_week": 3},
    {"time_id": 6, "start_time": "19:15:00", "end_time": "20:05:00", "day_of_week": 3},
    {"time_id": 7, "start_time": "20:10:00", "end_time": "21:00:00", "day_of_week": 4},
    {"time_id": 8, "start_time": "21:05:00", "end_time": "21:55:00", "day_of_week": 5}
]

@router.get("", response_model=List[Classtime])
async def get_all_classtimes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """수업 시간 목록 조회 - 데모 버전"""
    return DEMO_CLASSTIMES[skip:skip+limit]

@router.post("", response_model=Classtime, status_code=status.HTTP_201_CREATED)
async def create_classtime(classtime_data: ClasstimeCreate):
    """수업 시간 생성 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.get("", response_model=List[Classtime])
async def get_all_classtimes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """수업 시간 목록 조회 - 데모 버전"""
    return DEMO_CLASSTIMES[skip:skip+limit]

@router.get("/{time_id}", response_model=Classtime)
async def get_classtime(time_id: int):
    """수업 시간 상세 조회 - 데모 버전"""
    classtime = next((ct for ct in DEMO_CLASSTIMES if ct["time_id"] == time_id), None)
    if not classtime:
        raise HTTPException(status_code=404, detail="수업 시간을 찾을 수 없습니다.")
    return classtime

@router.put("/{time_id}", response_model=Classtime)
async def update_classtime(time_id: int, classtime_data: ClasstimeUpdate):
    """수업 시간 수정 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.delete("/{time_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classtime(time_id: int):
    """수업 시간 삭제 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")
    return None
