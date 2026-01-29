from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional

from ..schemas.student import Student, StudentCreate, StudentUpdate
from ..models.student import StudentStatus

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_STUDENTS = [
    {
        "student_id": 1,
        "student_name": "김민준",
        "english_name": "Min-jun",
        "birthday": "2015-03-15",
        "student_phone": "010-1111-2222",
        "parent_phone": "010-3333-4444",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 2,
        "student_name": "이서연",
        "english_name": "Seo-yeon",
        "birthday": "2015-07-22",
        "student_phone": "010-5555-6666",
        "parent_phone": "010-7777-8888",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "성산초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 3,
        "student_name": "박지우",
        "english_name": "Ji-woo",
        "birthday": "2015-11-08",
        "student_phone": "010-9999-0000",
        "parent_phone": "010-1212-3434",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 4,
        "student_name": "최예준",
        "english_name": "Ye-jun",
        "birthday": "2015-05-20",
        "student_phone": "010-2222-3333",
        "parent_phone": "010-4444-5555",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "남산초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 5,
        "student_name": "정하윤",
        "english_name": "Ha-yun",
        "birthday": "2015-08-10",
        "student_phone": "010-6666-7777",
        "parent_phone": "010-8888-9999",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "성산초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 6,
        "student_name": "강시우",
        "english_name": "Si-woo",
        "birthday": "2015-02-14",
        "student_phone": "010-1010-1010",
        "parent_phone": "010-2020-2020",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원초등학교",
        "s_year": 4,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 7,
        "student_name": "조서준",
        "english_name": "Seo-jun",
        "birthday": "2016-01-25",
        "student_phone": "010-3030-3030",
        "parent_phone": "010-4040-4040",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "동해초등학교",
        "s_year": 3,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 8,
        "student_name": "윤지안",
        "english_name": "Ji-an",
        "birthday": "2016-06-30",
        "student_phone": "010-5050-5050",
        "parent_phone": "010-6060-6060",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "성산초등학교",
        "s_year": 3,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 9,
        "student_name": "임유준",
        "english_name": "Yu-jun",
        "birthday": "2016-09-12",
        "student_phone": "010-7070-7070",
        "parent_phone": "010-8080-8080",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원초등학교",
        "s_year": 3,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 10,
        "student_name": "한지호",
        "english_name": "Ji-ho",
        "birthday": "2013-04-18",
        "student_phone": "010-9090-9090",
        "parent_phone": "010-1111-1111",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원중학교",
        "s_year": 1,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 11,
        "student_name": "김채린",
        "english_name": "Chae-rin",
        "birthday": "2013-11-05",
        "student_phone": "010-2222-2222",
        "parent_phone": "010-3333-3333",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "남산중학교",
        "s_year": 1,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 12,
        "student_name": "이준호",
        "english_name": "Jun-ho",
        "birthday": "2013-07-08",
        "student_phone": "010-4444-4444",
        "parent_phone": "010-5555-5555",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원중학교",
        "s_year": 1,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 13,
        "student_name": "박소영",
        "english_name": "So-young",
        "birthday": "2012-03-22",
        "student_phone": "010-6666-6666",
        "parent_phone": "010-7777-7777",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "중앙중학교",
        "s_year": 2,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "student_id": 14,
        "student_name": "최준영",
        "english_name": "Jun-young",
        "birthday": "2012-09-30",
        "student_phone": "010-8888-8888",
        "parent_phone": "010-9999-9999",
        "branch_id": 1,
        "status": "ACTIVE",
        "school": "창원중학교",
        "s_year": 2,
        "created_at": "2024-01-01T00:00:00"
    }
]

@router.get("", response_model=List[Student])
async def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    status: Optional[StudentStatus] = Query(None, description="Filter by student status"),
):
    """학생 목록 조회 - 데모 버전"""
    return DEMO_STUDENTS[skip:skip+limit]

@router.get("/{student_id}", response_model=Student)
async def get_student(
    student_id: int,
):
    """학생 상세 조회 - 데모 버전"""
    student = next((s for s in DEMO_STUDENTS if s["student_id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")
    return student

@router.get("/{student_id}/classes")
async def get_student_classes(
    student_id: int,
):
    """학생이 등록된 클래스 목록 조회 - 데모 버전"""
    # 임시 데모 클래스 데이터
    demo_student_classes = [
        {
            "class_id": 1,
            "class_name": "초등 A반",
            "curriculum_id": 1,
            "semester_id": 4,
            "attend_day": "Mon/Wed/Fri",
            "kr_homeroom_id": 2,
            "fr_homeroom_id": 6,
            "is_active": True,
            "schedule_details_json": [
                {"subject_id": 1, "classtime_id": 1, "weekday": "Mon"},
                {"subject_id": 1, "classtime_id": 2, "weekday": "Wed"},
                {"subject_id": 2, "classtime_id": 3, "weekday": "Fri"},
            ],
            "created_at": "2024-01-01T00:00:00",
        },
        {
            "class_id": 2,
            "class_name": "초등 B반",
            "curriculum_id": 1,
            "semester_id": 4,
            "attend_day": "Tue/Thu",
            "kr_homeroom_id": 3,
            "fr_homeroom_id": 7,
            "is_active": True,
            "schedule_details_json": [
                {"subject_id": 1, "classtime_id": 4, "weekday": "Tue"},
                {"subject_id": 2, "classtime_id": 5, "weekday": "Thu"},
            ],
            "created_at": "2024-01-01T00:00:00",
        }
    ]
    
    # 학생 1번만 클래스가 있는 것으로 설정 (데모용)
    if student_id == 1:
        return demo_student_classes
    return []
