from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional

from ..schemas.curriculum import Curriculum, CurriculumCreate, CurriculumUpdate

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_CURRICULUMS = [
    {
        "curriculum_id": 27,
        "curriculum_name": "WAVE LANGUAGE ARTS",
        "subject_id": 2,
        "subject_name": "LANGUAGE ARTS",
        "type": "langcon",
        "created_at": "2024-01-01T00:00:00",
        "deleted_at": None,
        "used_class_count": 5
    },
    {
        "curriculum_id": 28,
        "curriculum_name": "WAVE SCIENCE",
        "subject_id": 4,
        "subject_name": "SCIENCE",
        "type": "langcon",
        "created_at": "2024-01-01T00:00:00",
        "deleted_at": None,
        "used_class_count": 3
    },
    {
        "curriculum_id": 29,
        "curriculum_name": "WAVE SOCIAL STUDIES",
        "subject_id": 5,
        "subject_name": "SOCIAL STUDIES",
        "type": "langcon",
        "created_at": "2024-01-01T00:00:00",
        "deleted_at": None,
        "used_class_count": 3
    },
]

@router.post("", response_model=Curriculum, status_code=status.HTTP_201_CREATED)
async def create_curriculum(curriculum_data: CurriculumCreate):
    """커리큘럼 생성 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.get("", response_model=List[Curriculum])
async def get_all_curriculums(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    subject_id: Optional[int] = Query(None)
):
    """커리큘럼 목록 조회 - 데모 버전"""
    filtered = DEMO_CURRICULUMS
    if subject_id:
        filtered = [c for c in filtered if c.get("subject_id") == subject_id]
    return filtered[skip:skip+limit]

@router.get("/{curriculum_id}", response_model=Curriculum)
async def get_curriculum(curriculum_id: int):
    """커리큘럼 상세 조회 - 데모 버전"""
    curriculum = next((c for c in DEMO_CURRICULUMS if c["curriculum_id"] == curriculum_id), None)
    if not curriculum:
        raise HTTPException(status_code=404, detail="커리큘럼을 찾을 수 없습니다.")
    return curriculum

@router.put("/{curriculum_id}", response_model=Curriculum)
async def update_curriculum(curriculum_id: int, curriculum_data: CurriculumUpdate):
    """커리큘럼 수정 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.delete("/{curriculum_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_curriculum(curriculum_id: int):
    """커리큘럼 삭제 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")
