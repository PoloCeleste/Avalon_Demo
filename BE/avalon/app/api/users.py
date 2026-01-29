from fastapi import APIRouter, Query
from typing import List, Optional

from ..models.user import UserRole
from ..schemas.user import UserResponse

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_USER_RESPONSE = {
    "user_id": 1,
    "username": "demo",
    "name": "데모 관리자",
    "email": "demo@email.com",
    "role": "admin",
    "branch_id": 1,
    "branch_name": "본점",
    "status": "ACTIVE",
    "phone": "010-1234-5678",
    "birthday": "1990-01-01",
    "created_at": "2024-01-01T00:00:00",
    "subjects": []
}

DEMO_USERS = [
    {
        "user_id": 1,
        "username": "demo",
        "name": "데모 관리자",
        "email": "demo@email.com",
        "role": "admin",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-1234-5678",
        "created_at": "2024-01-01T00:00:00",
        "subjects": []
    },
    {
        "user_id": 2,
        "username": "Kim.Teacher",
        "name": "김선생",
        "email": "kim.teacher@email.com",
        "role": "teacher",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-1111-1111",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": False,
        "subjects": []
    },
    {
        "user_id": 3,
        "username": "Lee.Teacher",
        "name": "이선생",
        "email": "lee.teacher@email.com",
        "role": "teacher",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-2222-2222",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": False,
        "subjects": []
    },
    {
        "user_id": 4,
        "username": "Choi.Teacher",
        "name": "최선생",
        "email": "choi.teacher@email.com",
        "role": "teacher",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-4444-4444",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": False,
        "subjects": []
    },
    {
        "user_id": 5,
        "username": "Park.Manager",
        "name": "박매니저",
        "email": "park.manager@email.com",
        "role": "manager",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-5555-5555",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": False,
        "subjects": []
    },
    {
        "user_id": 6,
        "username": "John.Doe",
        "name": "John Doe",
        "email": "john.doe@email.com",
        "role": "teacher",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-1234-5678",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": True,
        "subjects": []
    },
    {
        "user_id": 7,
        "username": "Jane.Smith",
        "name": "Jane Smith",
        "email": "jane.smith@email.com",
        "role": "teacher",
        "branch_id": 1,
        "branch_name": "본점",
        "status": "ACTIVE",
        "phone": "010-9876-5432",
        "created_at": "2024-01-01T00:00:00",
        "is_foreign": True,
        "subjects": []
    }
]

@router.get("/me", response_model=UserResponse)
async def get_my_info():
    """(로그인한 본인) 내 정보 조회 - 데모 버전"""
    return DEMO_USER_RESPONSE

@router.get("/{user_id}")
async def get_user_detail(user_id: int, branch_id: Optional[int] = Query(None)):
    """사용자 상세 조회 - 데모 버전"""
    user = next((u for u in DEMO_USERS if u["user_id"] == user_id), None)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

@router.get("/{user_id}/assigned-subjects")
async def get_user_assigned_subjects(
    user_id: int,
    semester_id: Optional[int] = Query(None),
):
    """교사의 담당 과목 조회 - 데모 버전"""
    # 교사별 담당 과목 데모 데이터
    teacher_subjects = {
        2: [  # 김선생
            {"subject_id": 1, "subject_name": "English", "class_id": 1, "class_name": "초등 A반"},
            {"subject_id": 2, "subject_name": "Math", "class_id": 1, "class_name": "초등 A반"},
        ],
        3: [  # 이선생
            {"subject_id": 1, "subject_name": "English", "class_id": 2, "class_name": "초등 B반"},
            {"subject_id": 3, "subject_name": "Science", "class_id": 2, "class_name": "초등 B반"},
        ],
        4: [  # 최선생
            {"subject_id": 2, "subject_name": "Math", "class_id": 3, "class_name": "초등 C반"},
        ],
        6: [  # John Doe
            {"subject_id": 1, "subject_name": "English", "class_id": 4, "class_name": "중등 A반"},
            {"subject_id": 2, "subject_name": "Math", "class_id": 4, "class_name": "중등 A반"},
        ],
        7: [  # Jane Smith
            {"subject_id": 3, "subject_name": "Science", "class_id": 5, "class_name": "중등 B반"},
        ]
    }
    
    return teacher_subjects.get(user_id, [])

@router.get("/{user_id}/assigned-classes")
async def get_user_assigned_classes(
    user_id: int,
    semester_id: Optional[int] = Query(None),
):
    """교사의 담당 반 조회 - 데모 버전"""
    # 교사별 담당 반 데모 데이터 (한국 교사 = kr_homeroom_id, 외국 교사 = fr_homeroom_id)
    teacher_classes = {
        2: [  # 김선생 (kr_homeroom_id)
            {"class_id": 1, "class_name": "초등 A반", "curriculum_id": 1, "semester_id": 4, "attend_day": "Mon/Wed/Fri"},
        ],
        3: [  # 이선생 (kr_homeroom_id)
            {"class_id": 2, "class_name": "초등 B반", "curriculum_id": 1, "semester_id": 4, "attend_day": "Tue/Thu"},
        ],
        4: [  # 최선생 (kr_homeroom_id)
            {"class_id": 3, "class_name": "초등 C반", "curriculum_id": 1, "semester_id": 4, "attend_day": "Mon/Tue/Wed"},
        ],
        6: [  # John Doe (fr_homeroom_id)
            {"class_id": 4, "class_name": "중등 A반", "curriculum_id": 2, "semester_id": 4, "attend_day": "Wed/Thu/Fri"},
        ],
        7: [  # Jane Smith (fr_homeroom_id)
            {"class_id": 5, "class_name": "중등 B반", "curriculum_id": 2, "semester_id": 4, "attend_day": "Mon/Wed/Fri"},
        ]
    }
    
    return teacher_classes.get(user_id, [])

@router.get("", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    branch_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    is_foreign: Optional[bool] = Query(None),
):
    """모든 사용자 목록 조회 - 데모 버전"""
    filtered_users = DEMO_USERS
    
    # 필터링 적용
    if branch_id:
        filtered_users = [u for u in filtered_users if u.get("branch_id") == branch_id]
    if role:
        # role을 소문자로 변환하여 비교
        role_lower = role.lower()
        filtered_users = [u for u in filtered_users if u.get("role") == role_lower]
    if is_foreign is not None:
        filtered_users = [u for u in filtered_users if u.get("is_foreign", False) == is_foreign]
    
    return filtered_users[skip:skip+limit]
