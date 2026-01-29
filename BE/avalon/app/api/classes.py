from typing import List, Optional
from fastapi import APIRouter, Query, status, HTTPException
from datetime import date

from ..schemas.class_schema import ClassResponse, ClassCreate, ClassUpdate
from ..schemas.homework import HomeworkDueDate

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_CLASSES = [
    {
        "class_id": 1,
        "class_name": "초등 A반",
        "curriculum_id": 27,
        "semester_id": 1,
        "attend_day": "Mon/Wed/Fri",
        "kr_homeroom_id": 2,
        "fr_homeroom_id": 6,
        "is_active": True,
        "schedule_details_json": [
            {"subject_id": 2, "classtime_id": 1, "weekday": "Mon"},
            {"subject_id": 2, "classtime_id": 2, "weekday": "Wed"},
            {"subject_id": 2, "classtime_id": 3, "weekday": "Fri"},
        ],
        "created_at": "2024-01-01T00:00:00",
    },
    {
        "class_id": 2,
        "class_name": "초등 B반",
        "curriculum_id": 28,
        "semester_id": 1,
        "attend_day": "Tue/Thu",
        "kr_homeroom_id": 3,
        "fr_homeroom_id": 7,
        "is_active": True,
        "schedule_details_json": [
            {"subject_id": 4, "classtime_id": 4, "weekday": "Tue"},
            {"subject_id": 4, "classtime_id": 5, "weekday": "Thu"},
        ],
        "created_at": "2024-01-01T00:00:00",
    },
    {
        "class_id": 3,
        "class_name": "초등 C반",
        "curriculum_id": 29,
        "semester_id": 1,
        "attend_day": "Mon/Tue/Wed",
        "kr_homeroom_id": 4,
        "fr_homeroom_id": 6,
        "is_active": True,
        "schedule_details_json": [
            {"subject_id": 5, "classtime_id": 6, "weekday": "Mon"},
            {"subject_id": 5, "classtime_id": 7, "weekday": "Tue"},
            {"subject_id": 5, "classtime_id": 8, "weekday": "Wed"},
        ],
        "created_at": "2024-01-01T00:00:00",
    },
    {
        "class_id": 4,
        "class_name": "중등 A반",
        "curriculum_id": 2,
        "semester_id": 1,
        "attend_day": "Wed/Thu/Fri",
        "kr_homeroom_id": 2,
        "fr_homeroom_id": 7,
        "is_active": True,
        "schedule_details_json": [
            {"subject_id": 3, "classtime_id": 9, "weekday": "Wed"},
            {"subject_id": 3, "classtime_id": 10, "weekday": "Thu"},
            {"subject_id": 4, "classtime_id": 11, "weekday": "Fri"},
        ],
        "created_at": "2024-01-01T00:00:00",
    },
    {
        "class_id": 5,
        "class_name": "중등 B반",
        "curriculum_id": 2,
        "semester_id": 1,
        "attend_day": "Mon/Wed/Fri",
        "kr_homeroom_id": 3,
        "fr_homeroom_id": 6,
        "is_active": True,
        "schedule_details_json": [
            {"subject_id": 3, "classtime_id": 12, "weekday": "Mon"},
            {"subject_id": 4, "classtime_id": 13, "weekday": "Wed"},
            {"subject_id": 3, "classtime_id": 14, "weekday": "Fri"},
        ],
        "created_at": "2024-01-01T00:00:00",
    }
]

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: ClassCreate,
):
    """클래스 생성 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )

@router.post("/{class_id}/generate-sessions", status_code=status.HTTP_200_OK)
async def generate_sessions_for_class(
    class_id: int,
):
    """세션 생성 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )

@router.get("", response_model=List[ClassResponse])
async def get_all_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    semester_id: Optional[int] = Query(None, description="Filter by semester ID"),
    curriculum_id: Optional[int] = Query(None, description="Filter by curriculum ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """클래스 목록 조회 - 데모 버전"""
    return DEMO_CLASSES[skip:skip+limit]

@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: int,
):
    """클래스 상세 조회 - 데모 버전"""
    class_data = next((c for c in DEMO_CLASSES if c["class_id"] == class_id), None)
    if not class_data:
        raise HTTPException(status_code=404, detail="클래스를 찾을 수 없습니다.")
    return class_data

@router.get("/{class_id}/students")
async def get_class_students(
    class_id: int,
):
    """클래스의 학생 목록 조회 - 데모 버전"""
    # 데모 학생 데이터
    demo_class_students = {
        1: [
            {"student_id": 1, "student_name": "김민준", "english_name": "Min-jun", "status": "ACTIVE"},
            {"student_id": 2, "student_name": "이서연", "english_name": "Seo-yeon", "status": "ACTIVE"},
            {"student_id": 3, "student_name": "박지우", "english_name": "Ji-woo", "status": "ACTIVE"},
        ],
        2: [
            {"student_id": 4, "student_name": "최예준", "english_name": "Ye-jun", "status": "ACTIVE"},
            {"student_id": 5, "student_name": "정하윤", "english_name": "Ha-yun", "status": "ACTIVE"},
        ],
        3: [
            {"student_id": 6, "student_name": "강시우", "english_name": "Si-woo", "status": "ACTIVE"},
            {"student_id": 7, "student_name": "조서준", "english_name": "Seo-jun", "status": "ACTIVE"},
        ],
        4: [
            {"student_id": 8, "student_name": "임도윤", "english_name": "Do-yun", "status": "ACTIVE"},
            {"student_id": 9, "student_name": "오준혁", "english_name": "Jun-hyuk", "status": "ACTIVE"},
            {"student_id": 10, "student_name": "윤지훈", "english_name": "Ji-hoon", "status": "ACTIVE"},
        ],
        5: [
            {"student_id": 11, "student_name": "류민규", "english_name": "Min-gyu", "status": "ACTIVE"},
            {"student_id": 12, "student_name": "이준호", "english_name": "Jun-ho", "status": "ACTIVE"},
            {"student_id": 13, "student_name": "박소영", "english_name": "So-young", "status": "ACTIVE"},
            {"student_id": 14, "student_name": "최준영", "english_name": "Jun-young", "status": "ACTIVE"},
        ]
    }
    return demo_class_students.get(class_id, [])

@router.get("/{class_id}/homework-due-dates", response_model=List[HomeworkDueDate])
async def get_homework_due_dates(
    class_id: int,
    due_date: Optional[date] = Query(None, description="Filter by due date (YYYY-MM-DD)"),
):
    """숙제 마감일 조회 - 데모 버전"""
    target_date = due_date or date.today()
    due_date_map = {
        1: [
            {
                "homework_id": 1,
                "tag_name": "온라인",
                "subject_name": "LANGUAGE ARTS",
                "assigned_date": target_date,
                "due_date": target_date,
            }
        ],
        2: [
            {
                "homework_id": 101,
                "tag_name": "온라인",
                "subject_name": "SCIENCE",
                "assigned_date": target_date,
                "due_date": target_date,
            }
        ],
        3: [
            {
                "homework_id": 201,
                "tag_name": "온라인",
                "subject_name": "SOCIAL STUDIES",
                "assigned_date": target_date,
                "due_date": target_date,
            }
        ],
    }
    return due_date_map.get(class_id, [])

@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    class_data: ClassUpdate,
):
    """클래스 수정 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )

@router.delete("/{class_id}", status_code=status.HTTP_200_OK)
async def delete_class(
    class_id: int,
):
    """클래스 삭제 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )