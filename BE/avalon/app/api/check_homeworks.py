from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_CHECK_HOMEWORKS = [
    # class 1 (students 1-3) - homework 1
    {
        "check_homework_id": 1,
        "student_id": 1,
        "homework_id": 1,
        "class_id": 1,
        "checker_id": 1,
        "created_at": "2026-01-29T09:10:00",
        "updated_at": None,
    },
    {
        "check_homework_id": 2,
        "student_id": 2,
        "homework_id": 1,
        "class_id": 1,
        "checker_id": 1,
        "created_at": "2026-01-29T09:12:00",
        "updated_at": None,
    },
    # class 2 (students 4-5) - homework 101
    {
        "check_homework_id": 101,
        "student_id": 4,
        "homework_id": 101,
        "class_id": 2,
        "checker_id": 1,
        "created_at": "2026-01-29T10:05:00",
        "updated_at": None,
    },
    # class 3 (students 6-7) - homework 201
    {
        "check_homework_id": 201,
        "student_id": 6,
        "homework_id": 201,
        "class_id": 3,
        "checker_id": 1,
        "created_at": "2026-01-29T11:05:00",
        "updated_at": None,
    },
]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_check_homework(check_homework_data: dict):
    """숙제 확인 기록 생성 - 데모 버전"""
    new_id = max([c["check_homework_id"] for c in DEMO_CHECK_HOMEWORKS] + [0]) + 1
    now = datetime.utcnow().isoformat(timespec="seconds")
    return {
        "check_homework_id": new_id,
        "student_id": check_homework_data.get("student_id"),
        "homework_id": check_homework_data.get("homework_id"),
        "class_id": check_homework_data.get("class_id"),
        "checker_id": check_homework_data.get("checker_id"),
        "created_at": now,
        "updated_at": None,
    }


@router.get("")
async def get_all_check_homeworks(
    student_id: Optional[int] = Query(None),
    homework_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
):
    """숙제 확인 기록 조회 - 데모 버전"""
    filtered = DEMO_CHECK_HOMEWORKS
    if student_id:
        filtered = [c for c in filtered if c["student_id"] == student_id]
    if homework_id:
        filtered = [c for c in filtered if c["homework_id"] == homework_id]
    if class_id:
        filtered = [c for c in filtered if c["class_id"] == class_id]
    return filtered


@router.delete("/{check_homework_id}")
async def delete_check_homework(check_homework_id: int):
    """숙제 확인 기록 삭제 - 데모 비활성화"""
    # 데모에서는 삭제 대신 성공 응답만 반환
    return None


@router.post("/all")
async def check_all_homeworks(
    class_id: int = Query(...),
    subject_id: int = Query(...),
    homework_id: int = Query(...),
):
    """숙제 일괄 체크 등록 - 데모 버전"""
    # 클래스별 학생 목록 (classes.py와 동일한 더미 구성)
    class_students = {
        1: [1, 2, 3],
        2: [4, 5],
        3: [6, 7],
        4: [8, 9, 10],
        5: [11, 12, 13, 14],
    }
    now = datetime.utcnow().isoformat(timespec="seconds")
    student_ids = class_students.get(class_id, [])
    return [
        {
            "check_homework_id": max([c["check_homework_id"] for c in DEMO_CHECK_HOMEWORKS] + [0]) + i + 1,
            "student_id": student_id,
            "homework_id": homework_id,
            "class_id": class_id,
            "checker_id": 1,
            "created_at": now,
            "updated_at": None,
        }
        for i, student_id in enumerate(student_ids)
    ]


@router.delete("/all")
async def uncheck_all_homeworks(
    class_id: int = Query(...),
    subject_id: int = Query(...),
    homework_id: int = Query(...),
):
    """숙제 일괄 체크 해제 - 데모 버전"""
    # 데모에서는 삭제된 수를 임의로 반환
    class_students = {
        1: [1, 2, 3],
        2: [4, 5],
        3: [6, 7],
        4: [8, 9, 10],
        5: [11, 12, 13, 14],
    }
    return len(class_students.get(class_id, []))
