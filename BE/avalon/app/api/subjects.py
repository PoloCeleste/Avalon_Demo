from fastapi import APIRouter, Query, status, HTTPException
from typing import List

from ..schemas.subject import Subject, SubjectCreate, SubjectUpdate

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_SUBJECTS = [
    {"subject_id": 1, "subject_name": "수학", "subject_nick": "Math", "curriculum_count": 5},
    {"subject_id": 2, "subject_name": "LANGUAGE ARTS", "subject_nick": "English", "curriculum_count": 4},
    {"subject_id": 3, "subject_name": "국어", "subject_nick": "Korean", "curriculum_count": 3},
    {"subject_id": 4, "subject_name": "SCIENCE", "subject_nick": "Science", "curriculum_count": 4},
    {"subject_id": 5, "subject_name": "SOCIAL STUDIES", "subject_nick": "Social Studies", "curriculum_count": 3}
]
@router.get("", response_model=List[Subject])
async def get_all_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """과목 목록 조회 - 데모 버전"""
    return DEMO_SUBJECTS[skip:skip+limit]

@router.get("/{subject_id}", response_model=Subject)
async def get_subject(subject_id: int):
    """과목 상세 조회 - 데모 버전"""
    subject = next((s for s in DEMO_SUBJECTS if s["subject_id"] == subject_id), None)
    if not subject:
        raise HTTPException(status_code=404, detail="과목을 찾을 수 없습니다.")
    return subject

