"""
Pydantic 데이터 검증 스키마
"""
# Existing Schemas
from .auth import TokenResponse, LoginResponse, PasswordReset, ForgotPasswordRequest, ConfirmPasswordReset
from .user import UserBase, UserCreate, UserUpdate, UserPasswordUpdate, UserResponse, UserLogin
from .branch import BranchBase, BranchCreate, BranchUpdate, BranchResponse

# New Schemas
from .student import Student, StudentCreate, StudentUpdate, StudentInDB
from .assignment import TeacherAssignment, TeacherAssignmentCreate
from .subject import Subject, SubjectCreate, SubjectUpdate
from .curriculum import Curriculum, CurriculumCreate, CurriculumUpdate
from .curriculum_detail import CurriculumDetail, CurriculumDetailCreate, CurriculumDetailUpdate
from .semester import Semester, SemesterCreate, SemesterUpdate
from .class_schema import ClassResponse, ClassCreate, ClassUpdate
from .classtime import Classtime, ClasstimeCreate, ClasstimeUpdate
from .class_student import ClassStudent, ClassStudentCreate
from .holiday import Holiday, HolidayCreate, HolidayUpdate
from .homework import Homework, HomeworkCreate, HomeworkUpdate
from .check_homework import CheckHomework, CheckHomeworkCreate
from .todo import Todo, TodoCreate, TodoUpdate
from .test import Test, TestCreate, TestUpdate
from .test_result import TestResult, TestResultCreate
from .student_comment import StudentComment, StudentCommentCreate
from .consultation import Consultation, ConsultationCreate, ConsultationUpdate
from .talent import Talent, TalentCreate
from .class_session import ClassSession, ClassSessionCreate, ClassSessionUpdate

__all__ = [
    # Auth
    "TokenResponse", "LoginResponse", "PasswordReset", "ForgotPasswordRequest", "ConfirmPasswordReset",
    # User
    "UserBase", "UserCreate", "UserUpdate", "UserPasswordUpdate", "UserResponse", "UserLogin",
    # Branch
    "BranchBase", "BranchCreate", "BranchUpdate", "BranchResponse",
    # Student
    "Student", "StudentCreate", "StudentUpdate", "StudentInDB",
    # Assignment
    "TeacherAssignment", "TeacherAssignmentCreate",
    # Subject
    "Subject", "SubjectCreate", "SubjectUpdate",
    # Curriculum
    "Curriculum", "CurriculumCreate", "CurriculumUpdate",
    # CurriculumDetail
    "CurriculumDetail", "CurriculumDetailCreate", "CurriculumDetailUpdate",
    # Semester
    "Semester", "SemesterCreate", "SemesterUpdate",
    # Class
    "ClassResponse", "ClassCreate", "ClassUpdate",
    # Classtime
    "Classtime", "ClasstimeCreate", "ClasstimeUpdate",
    # ClassStudent
    "ClassStudent", "ClassStudentCreate",
    # Holiday
    "Holiday", "HolidayCreate", "HolidayUpdate",
    # Homework
    "Homework", "HomeworkCreate", "HomeworkUpdate",
    # CheckHomework
    "CheckHomework", "CheckHomeworkCreate",
    # Todo
    "Todo", "TodoCreate", "TodoUpdate",
    # Test
    "Test", "TestCreate", "TestUpdate",
    # TestResult
    "TestResult", "TestResultCreate",
    # StudentComment
    "StudentComment", "StudentCommentCreate",
    # Consultation
    "Consultation", "ConsultationCreate", "ConsultationUpdate",
    # Talent
    "Talent", "TalentCreate",
    "ClassSession", "ClassSessionCreate", "ClassSessionUpdate",
]