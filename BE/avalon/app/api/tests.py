from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_TESTS = [
    {
        "test_id": 1,
        "test_name": "중간고사",
        "class_id": 1,
        "subject_id": 1,
        "test_date": "2025-04-15",
        "total_score": 100,
        "created_at": "2025-03-01T00:00:00"
    },
    {
        "test_id": 2,
        "test_name": "기말고사",
        "class_id": 1,
        "subject_id": 1,
        "test_date": "2025-06-10",
        "total_score": 100,
        "created_at": "2025-05-01T00:00:00"
    },
    {
        "test_id": 3,
        "test_name": "모의고사",
        "class_id": 2,
        "subject_id": 1,
        "test_date": "2025-03-20",
        "total_score": 100,
        "created_at": "2025-03-01T00:00:00"
    },
    {
        "test_id": 4,
        "test_name": "수학 단원평가",
        "class_id": 4,
        "subject_id": 3,
        "test_date": "2025-05-05",
        "total_score": 50,
        "created_at": "2025-04-20T00:00:00"
    },
    {
        "test_id": 5,
        "test_name": "영어 단원평가",
        "class_id": 5,
        "subject_id": 2,
        "test_date": "2025-05-10",
        "total_score": 50,
        "created_at": "2025-04-25T00:00:00"
    }
]

@router.get("")
async def get_all_tests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    class_id: Optional[int] = Query(None, description="Filter by class ID"),
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
):
    """시험 목록 조회 - 데모 버전"""
    filtered = DEMO_TESTS
    
    if class_id:
        filtered = [t for t in filtered if t["class_id"] == class_id]
    
    if subject_id:
        filtered = [t for t in filtered if t["subject_id"] == subject_id]
    
    return filtered[skip:skip+limit]

@router.get("/{test_id}")
async def get_test(test_id: int):
    """시험 상세 조회 - 데모 버전"""
    test = next((t for t in DEMO_TESTS if t["test_id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다.")
    return test