from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional
from datetime import date

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_CLASS_SESSIONS = [
    {
        "class_session_id": 1,
        "class_id": 1,
        "teacher_id": 1,
        "session_date": "2026-01-29",
        "session_start_time": "09:00:00",
        "session_end_time": "09:50:00",
        "semester_id": 4,
        "attendance_status": "completed",
        "lesson_content": "WAVE LANGUAGE ARTS LESSON 11",
        "memo": "학생들이 집중력 있게 참여함"
    },
    {
        "class_session_id": 2,
        "class_id": 2,
        "teacher_id": 1,
        "session_date": "2026-01-29",
        "session_start_time": "10:00:00",
        "session_end_time": "10:50:00",
        "semester_id": 4,
        "attendance_status": "completed",
        "lesson_content": "WAVE SCIENCE LESSON 1",
        "memo": ""
    },
    {
        "class_session_id": 3,
        "class_id": 3,
        "teacher_id": 1,
        "session_date": "2026-01-29",
        "session_start_time": "11:00:00",
        "session_end_time": "11:50:00",
        "semester_id": 4,
        "attendance_status": "completed",
        "lesson_content": "WAVE SOCIAL STUDIES LESSON 1",
        "memo": ""
    },
    {
        "class_session_id": 4,
        "class_id": 1,
        "teacher_id": 2,
        "session_date": "2026-01-30",
        "session_start_time": "09:00:00",
        "session_end_time": "09:50:00",
        "semester_id": 4,
        "attendance_status": "scheduled",
        "lesson_content": "WAVE LANGUAGE ARTS LESSON 12",
        "memo": ""
    }
]


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_class_session(session_data: dict):
    """수업 세션 생성 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")


@router.get("")
async def get_class_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    session_date: Optional[str] = Query(None),
    semester_id: Optional[int] = Query(None),
    attendance_status: Optional[str] = Query(None),
):
    """수업 세션 목록 조회 - 데모 버전"""
    filtered = DEMO_CLASS_SESSIONS
    
    if class_id:
        filtered = [s for s in filtered if s["class_id"] == class_id]
    if teacher_id:
        filtered = [s for s in filtered if s["teacher_id"] == teacher_id]
    if session_date:
        filtered = [s for s in filtered if s["session_date"] == session_date]
    if semester_id:
        filtered = [s for s in filtered if s["semester_id"] == semester_id]
    if attendance_status:
        filtered = [s for s in filtered if s["attendance_status"] == attendance_status]
    
    return filtered[skip:skip+limit]


@router.get("/{class_session_id}")
async def get_class_session(class_session_id: int):
    """수업 세션 상세 조회 - 데모 버전"""
    session = next((s for s in DEMO_CLASS_SESSIONS if s["class_session_id"] == class_session_id), None)
    if not session:
        raise HTTPException(status_code=404, detail="수업 세션을 찾을 수 없습니다.")
    return session


@router.put("/{class_session_id}")
async def update_class_session(class_session_id: int, session_data: dict):
    """수업 세션 수정 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")


@router.delete("/{class_session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class_session(class_session_id: int):
    """수업 세션 삭제 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")
