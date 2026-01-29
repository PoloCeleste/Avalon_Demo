from fastapi import APIRouter, Query
from typing import List

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========

# 21.4. 강사별 학기별 반 숙제 성취도 통계
@router.get("/teachers/{user_id}/semesters/{semester_id}/class-performance")
async def get_teacher_class_performance(user_id: int, semester_id: int):
    """강사별 학기별 반 숙제 성취도 통계 - 데모 버전"""
    return {
        "user_id": user_id,
        "user_name": "김선생" if user_id == 2 else "이선생" if user_id == 3 else "최선생" if user_id == 4 else "데모 관리자",
        "semester_id": semester_id,
        "semester_name": "2024 Spring",
        "overall_completion_rate": 90.6,
        "classes_below_70_percent": 0,
        "total_students_below_70_percent": 2,
        "class_details": [
            {
                "class_id": 1,
                "class_name": "초등 A반",
                "total_homeworks": 48,
                "completed_homeworks": 45,
                "completion_rate": 93.75,
                "avg_score": 88.5,
                "students_below_70_percent": 1
            },
            {
                "class_id": 2,
                "class_name": "초등 B반",
                "total_homeworks": 48,
                "completed_homeworks": 42,
                "completion_rate": 87.5,
                "avg_score": 85.2,
                "students_below_70_percent": 1
            }
        ]
    }

# 21.5. 강사별 학기별 과목 숙제 성취도 통계
@router.get("/teachers/{user_id}/semesters/{semester_id}/subject-performance")
async def get_teacher_subject_performance(user_id: int, semester_id: int):
    """강사별 학기별 과목 숙제 성취도 통계 - 데모 버전"""
    return {
        "user_id": user_id,
        "user_name": "김선생" if user_id == 2 else "이선생" if user_id == 3 else "최선생" if user_id == 4 else "데모 관리자",
        "semester_id": semester_id,
        "semester_name": "2024 Spring",
        "overall_completion_rate": 91.7,
        "subjects_below_70_percent": 0,
        "total_students_below_70_percent": 3,
        "subject_details": [
            {
                "subject_id": 1,
                "subject_name": "English",
                "total_homeworks": 96,
                "completed_homeworks": 87,
                "completion_rate": 90.6,
                "avg_score": 87.3,
                "students_below_70_percent": 2
            },
            {
                "subject_id": 2,
                "subject_name": "Math",
                "total_homeworks": 96,
                "completed_homeworks": 89,
                "completion_rate": 92.7,
                "avg_score": 89.1,
                "students_below_70_percent": 1
            }
        ]
    }

# 21.6. 통합 숙제 성취도 하위 10명 조회
@router.get("/dashboard/low-performance-students")
async def get_low_performance_students(
    semester_id: int = Query(...),
    limit: int = Query(10, ge=1, le=50)
):
    """통합 숙제 성취도 하위 학생 조회 - 데모 버전"""
    demo_students = [
        {
            "rank": 1,
            "student_id": 8,
            "student_name": "윤지안",
            "homeroom_teacher": "이선생",
            "class_name": "초등 B반",
            "overall_completion_rate": 60.4
        },
        {
            "rank": 2,
            "student_id": 4,
            "student_name": "최예준",
            "homeroom_teacher": "김선생",
            "class_name": "초등 A반",
            "overall_completion_rate": 62.1
        },
        {
            "rank": 3,
            "student_id": 9,
            "student_name": "임유준",
            "homeroom_teacher": "김선생",
            "class_name": "초등 A반",
            "overall_completion_rate": 62.5
        },
        {
            "rank": 4,
            "student_id": 5,
            "student_name": "정하윤",
            "homeroom_teacher": "이선생",
            "class_name": "초등 B반",
            "overall_completion_rate": 64.2
        },
        {
            "rank": 5,
            "student_id": 10,
            "student_name": "한지호",
            "homeroom_teacher": "이선생",
            "class_name": "초등 B반",
            "overall_completion_rate": 64.6
        },
        {
            "rank": 6,
            "student_id": 6,
            "student_name": "강시우",
            "homeroom_teacher": "최선생",
            "class_name": "초등 C반",
            "overall_completion_rate": 66.3
        },
        {
            "rank": 7,
            "student_id": 1,
            "student_name": "김민준",
            "homeroom_teacher": "김선생",
            "class_name": "초등 A반",
            "overall_completion_rate": 66.7
        },
        {
            "rank": 8,
            "student_id": 7,
            "student_name": "조서준",
            "homeroom_teacher": "김선생",
            "class_name": "초등 A반",
            "overall_completion_rate": 68.3
        },
        {
            "rank": 9,
            "student_id": 2,
            "student_name": "이서연",
            "homeroom_teacher": "김선생",
            "class_name": "초등 A반",
            "overall_completion_rate": 68.9
        },
        {
            "rank": 10,
            "student_id": 3,
            "student_name": "박지우",
            "homeroom_teacher": "이선생",
            "class_name": "초등 B반",
            "overall_completion_rate": 69.8
        }
    ]
    return demo_students[:limit]

# 21.7. 과목별 숙제 성취도 하위 10명 조회
@router.get("/dashboard/low-performance-subject-students")
async def get_low_performance_subject_students(
    semester_id: int = Query(...),
    limit: int = Query(10, ge=1, le=50)
):
    """과목별 숙제 성취도 하위 학생 조회 - 데모 버전"""
    demo_students = [
        {
            "rank": 1,
            "student_id": 4,
            "student_name": "최예준",
            "homeroom_teacher": "김선생",
            "subject_name": "Science",
            "subject_completion_rate": 61.0
        },
        {
            "rank": 2,
            "student_id": 1,
            "student_name": "김민준",
            "homeroom_teacher": "김선생",
            "subject_name": "English",
            "subject_completion_rate": 62.5
        },
        {
            "rank": 3,
            "student_id": 5,
            "student_name": "정하윤",
            "homeroom_teacher": "이선생",
            "subject_name": "Math",
            "subject_completion_rate": 63.2
        },
        {
            "rank": 4,
            "student_id": 6,
            "student_name": "강시우",
            "homeroom_teacher": "최선생",
            "subject_name": "English",
            "subject_completion_rate": 65.3
        },
        {
            "rank": 5,
            "student_id": 2,
            "student_name": "이서연",
            "homeroom_teacher": "김선생",
            "subject_name": "Math",
            "subject_completion_rate": 65.7
        },
        {
            "rank": 6,
            "student_id": 7,
            "student_name": "조서준",
            "homeroom_teacher": "김선생",
            "subject_name": "Social Studies",
            "subject_completion_rate": 67.5
        },
        {
            "rank": 7,
            "student_id": 3,
            "student_name": "박지우",
            "homeroom_teacher": "이선생",
            "subject_name": "English",
            "subject_completion_rate": 68.8
        },
        {
            "rank": 8,
            "student_id": 8,
            "student_name": "윤지안",
            "homeroom_teacher": "이선생",
            "subject_name": "Math",
            "subject_completion_rate": 69.7
        }
    ]
    return demo_students[:limit]

# 21.1. 반 숙제 진척도 리포트 조회
@router.get("/class/{class_id}/homework-progress")
async def get_class_homework_progress_report(class_id: int):
    """반 숙제 진척도 리포트 조회 - 데모 버전"""
    return {
        "class_id": class_id,
        "reports": [
            {
                "student_id": 1,
                "student_name": "김민준",
                "total_homework": 48,
                "completed_homework": 38,
                "completion_rate": 79.2
            },
            {
                "student_id": 2,
                "student_name": "이서연",
                "total_homework": 48,
                "completed_homework": 42,
                "completion_rate": 87.5
            },
            {
                "student_id": 3,
                "student_name": "박지우",
                "total_homework": 48,
                "completed_homework": 35,
                "completion_rate": 72.9
            }
        ]
    }

# 21.3. 학생 주간 숙제 상세 내역 조회
@router.get("/students/{student_id}/weekly-homework-details")
async def get_student_weekly_homework_details(student_id: int):
    """학생 주간 숙제 상세 내역 조회 - 데모 버전"""
    return {
        "student_id": student_id,
        "student_name": "김민준",
        "week_start": "2024-01-15",
        "week_end": "2024-01-21",
        "homeworks": [
            {
                "homework_id": 1,
                "subject_name": "English",
                "title": "Unit 1 Vocabulary",
                "due_date": "2024-01-16",
                "status": "COMPLETED",
                "score": 85,
                "completion_date": "2024-01-15"
            },
            {
                "homework_id": 2,
                "subject_name": "Math",
                "title": "Chapter 2 Practice",
                "due_date": "2024-01-17",
                "status": "COMPLETED",
                "score": 92,
                "completion_date": "2024-01-17"
            },
            {
                "homework_id": 3,
                "subject_name": "Science",
                "title": "Lab Report",
                "due_date": "2024-01-19",
                "status": "PENDING",
                "score": None,
                "completion_date": None
            }
        ],
        "total_homeworks": 3,
        "completed_homeworks": 2,
        "completion_rate": 66.7
    }

# 21.8. 학생 개별 반/과목별 숙제 진척도 리포트 조회
@router.get("/students/{student_id}/subject-progress")
async def get_student_subject_progress(student_id: int):
    """학생 개별 반/과목별 숙제 진척도 리포트 조회 - 데모 버전"""
    return [
        {
            "class_id": 1,
            "class_name": "초등 A반",
            "subject_id": 1,
            "subject_name": "English",
            "total_homeworks": 24,
            "completed_homeworks": 20,
            "completion_rate": 83.3,
            "avg_score": 85.5
        },
        {
            "class_id": 1,
            "class_name": "초등 A반",
            "subject_id": 2,
            "subject_name": "Math",
            "total_homeworks": 24,
            "completed_homeworks": 22,
            "completion_rate": 91.7,
            "avg_score": 88.2
        },
        {
            "class_id": 2,
            "class_name": "초등 B반",
            "subject_id": 3,
            "subject_name": "Science",
            "total_homeworks": 24,
            "completed_homeworks": 18,
            "completion_rate": 75.0,
            "avg_score": 82.0
        }
    ]
