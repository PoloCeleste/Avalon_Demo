from fastapi import APIRouter, Depends, Query, status, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..schemas.homework import Homework, HomeworkCreate, HomeworkUpdate
from ..services.homework_service import HomeworkService
from ..core.database import get_db
from ..utils.dependencies import require_manager_or_higher, require_teacher_or_higher
from ..models.user import User

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_HOMEWORKS = [
    {
        "homework_id": 1,
        "curri_detail_id": 1,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "MVA-LA11",
        "homework_contents": "온라인 단어학습 MVA | LA 11"
    },
    {
        "homework_id": 2,
        "curri_detail_id": 2,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-11L",
        "homework_contents": "LANGCON ISLAND LA 11 (LISTENING)"
    },
    {
        "homework_id": 3,
        "curri_detail_id": 2,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "오프라인",
        "is_online": False,
        "homework_name": "LA11-1",
        "homework_contents": "LANGUAGE ARTS 교재 : HOMEWORK SECTION | Vocabulary Review p.20-21"
    },
    {
        "homework_id": 4,
        "curri_detail_id": 3,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "오프라인",
        "is_online": False,
        "homework_name": "LA11-2",
        "homework_contents": "LANGUAGE ARTS 교재 : HOMEWORK SECTION | Grammar Review p.26-27"
    },
    {
        "homework_id": 5,
        "curri_detail_id": 4,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "오프라인",
        "is_online": False,
        "homework_name": "LA11-3",
        "homework_contents": "LANGUAGE ARTS 교재 : HOMEWORK SECTION | Test Yourself 1 p.32-33"
    },
    {
        "homework_id": 6,
        "curri_detail_id": 5,
        "curriculum_id": 27,
        "subject_id": 2,
        "tag_name": "오프라인",
        "is_online": False,
        "homework_name": "LA11-4",
        "homework_contents": "LANGUAGE ARTS 교재 : HOMEWORK SECTION | Test Yourself 2 p.38-39"
    },
    # WAVE SCIENCE (curriculum_id: 28, subject_id: 4)
    {
        "homework_id": 101,
        "curri_detail_id": 101,
        "curriculum_id": 28,
        "subject_id": 4,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SC1-V",
        "homework_contents": "LANGCON ISLAND SC1 (VOCA)"
    },
    {
        "homework_id": 102,
        "curri_detail_id": 101,
        "curriculum_id": 28,
        "subject_id": 4,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "MVA-SC1",
        "homework_contents": "온라인 단어학습 MVA ( VITAMIN ) SC1"
    },
    {
        "homework_id": 103,
        "curri_detail_id": 102,
        "curriculum_id": 28,
        "subject_id": 4,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SC1-R",
        "homework_contents": "LANGCON ISLAND SC1 (READING)"
    },
    {
        "homework_id": 104,
        "curri_detail_id": 103,
        "curriculum_id": 28,
        "subject_id": 4,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SC2-V",
        "homework_contents": "LANGCON ISLAND SC2 (VOCA)"
    },
    {
        "homework_id": 105,
        "curri_detail_id": 103,
        "curriculum_id": 28,
        "subject_id": 4,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "MVA-SC2",
        "homework_contents": "온라인 단어학습 MVA ( VITAMIN ) SC2"
    },
    # WAVE SOCIAL STUDIES (curriculum_id: 29, subject_id: 5)
    {
        "homework_id": 201,
        "curri_detail_id": 201,
        "curriculum_id": 29,
        "subject_id": 5,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SS1-V",
        "homework_contents": "LANGCON ISLAND SS1 (VOCA)"
    },
    {
        "homework_id": 202,
        "curri_detail_id": 201,
        "curriculum_id": 29,
        "subject_id": 5,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "MVA-SS1",
        "homework_contents": "온라인 단어학습 MVA ( VITAMIN ) SS1"
    },
    {
        "homework_id": 203,
        "curri_detail_id": 202,
        "curriculum_id": 29,
        "subject_id": 5,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SS1-R",
        "homework_contents": "LANGCON ISLAND SS1 (READING)"
    },
    {
        "homework_id": 204,
        "curri_detail_id": 203,
        "curriculum_id": 29,
        "subject_id": 5,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "LI-SS2-V",
        "homework_contents": "LANGCON ISLAND SS2 (VOCA)"
    },
    {
        "homework_id": 205,
        "curri_detail_id": 203,
        "curriculum_id": 29,
        "subject_id": 5,
        "tag_name": "온라인",
        "is_online": True,
        "homework_name": "MVA-SS2",
        "homework_contents": "온라인 단어학습 MVA ( VITAMIN ) SS2"
    },
]

@router.post("", response_model=Homework, status_code=status.HTTP_201_CREATED)
async def create_homework(homework_data: HomeworkCreate):
    """숙제 생성 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.get("", response_model=List[Homework])
async def get_all_homeworks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    curriculum_id: Optional[int] = Query(None),
    curri_detail_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
):
    """숙제 목록 조회 - 데모 버전"""
    filtered = DEMO_HOMEWORKS
    if curriculum_id:
        filtered = [h for h in filtered if h.get("curriculum_id") == curriculum_id]
    if curri_detail_id:
        filtered = [h for h in filtered if h["curri_detail_id"] == curri_detail_id]
    if subject_id:
        filtered = [h for h in filtered if h["subject_id"] == subject_id]
    return filtered[skip:skip+limit]

@router.get("/{homework_id}", response_model=Homework)
async def get_homework(homework_id: int):
    """숙제 상세 조회 - 데모 버전"""
    homework = next((h for h in DEMO_HOMEWORKS if h["homework_id"] == homework_id), None)
    if not homework:
        raise HTTPException(status_code=404, detail="숙제를 찾을 수 없습니다.")
    return homework

@router.put("/{homework_id}", response_model=Homework)
async def update_homework(homework_id: int, homework_data: HomeworkUpdate):
    """숙제 수정 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

@router.delete("/{homework_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_homework(homework_id: int):
    """숙제 삭제 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

