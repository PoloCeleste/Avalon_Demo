from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional
from datetime import date

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_HOLIDAYS = [
    {
        "holiday_id": 1,
        "holiday_name": "새해",
        "holiday_date": "2025-01-01",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 2,
        "holiday_name": "설날",
        "holiday_date": "2025-01-29",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 3,
        "holiday_name": "3.1절",
        "holiday_date": "2025-03-01",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 4,
        "holiday_name": "어린이날",
        "holiday_date": "2025-05-05",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 5,
        "holiday_name": "부처님 오신 날",
        "holiday_date": "2025-05-15",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 6,
        "holiday_name": "현충일",
        "holiday_date": "2025-06-06",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 7,
        "holiday_name": "광복절",
        "holiday_date": "2025-08-15",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 8,
        "holiday_name": "추석",
        "holiday_date": "2025-09-17",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 9,
        "holiday_name": "개교기념일",
        "holiday_date": "2025-10-03",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    },
    {
        "holiday_id": 10,
        "holiday_name": "한글날",
        "holiday_date": "2025-10-09",
        "semester_id": 4,
        "created_at": "2024-12-01T00:00:00"
    }
]

@router.get("")
async def get_all_holidays(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    semester_id: Optional[int] = Query(None, description="Filter by semester ID"),
):
    """휴일 목록 조회 - 데모 버전"""
    filtered = DEMO_HOLIDAYS
    
    if semester_id:
        filtered = [h for h in filtered if h["semester_id"] == semester_id]
    
    return filtered[skip:skip+limit]

@router.get("/{holiday_id}")
async def get_holiday(holiday_id: int):
    """휴일 상세 조회 - 데모 버전"""
    holiday = next((h for h in DEMO_HOLIDAYS if h["holiday_id"] == holiday_id), None)
    if not holiday:
        raise HTTPException(status_code=404, detail="휴일을 찾을 수 없습니다.")
    return holiday
