from pydantic import BaseModel
from typing import List
from datetime import date

class StudentHomeworkProgress(BaseModel):
    student_id: int
    student_name: str
    total_assigned_homework: int
    completed_homework: int
    incomplete_overdue_homework: int
    pending_homework: int
    completion_rate: float # 완료한 개수/총 개수 퍼센테이지
    overdue_rate: float # 지난거 개수/총 개수 퍼센테이지

    class Config:
        from_attributes = True

class StudentSubjectProgressDetail(BaseModel):
    class_id: int
    subject_id: int
    subject_name: str
    teacher_name: str
    subject_total: int
    subject_completed: int
    completion_rate: float

class HomeworkProgressReport(BaseModel):
    class_id: int
    reports: List[StudentHomeworkProgress]

    class Config:
        from_attributes = True

class HomeworkDetail(BaseModel):
    homework_id: int
    homework_name: str
    subject_name: str
    assigned_date: date
    due_date: date
    status: str  # "완료", "미완료", "미완료 (기한 지남)"

class StudentWeeklyHomeworkReport(BaseModel):
    student_id: int
    student_name: str
    start_of_week: date
    end_of_week: date
    total_homework_count: int
    completed_homework_count: int
    completion_rate: float
    homeworks: List[HomeworkDetail]

class ClassPerformanceDetail(BaseModel):
    class_id: int
    class_name: str
    kr_homeroom_teacher: str
    fr_homeroom_teacher: str
    completion_rate: float
    students_below_70_percent: int # 해당 클래스의 숙제 완료율 70%미만 학생 수

class TeacherClassPerformance(BaseModel):
    user_id: int
    user_name: str
    semester_id: int
    semester_name: str
    overall_completion_rate: float # 이번 학기의 해당 교사의 모든 수업에서 전체 숙제 완료율
    classes_below_70_percent: int # 전체 완료율이 70% 미만인 반 수
    total_students_below_70_percent: int # 모든 학급에서 숙제 완료율이 70% 미만인 학생 수
    class_details: List[ClassPerformanceDetail]


# 3번: 강사별 학기별 과목 성취도 통계용 스키마
class SubjectPerformanceDetail(BaseModel):
    class_id: int
    subject_id: int
    subject_name: str
    completion_rate: float
    students_below_70_percent: int # 해당 과목의 숙제 완료율 70% 미만 학생 수

class TeacherSubjectPerformance(BaseModel):
    user_id: int
    user_name: str
    semester_id: int
    semester_name: str
    overall_completion_rate: float # 담당 과목 전체 숙제 완료율(평균)
    subjects_below_70_percent: int # 숙제 완료율 70% 미만 과목 수
    total_students_below_70_percent: int # 모든 담당 과목에서 숙제 완료율 70% 미만 학생 수
    subject_details: List[SubjectPerformanceDetail]
    
    # 4번: 통합 숙제 성취도 하위 10명 스키마
class DashboardLowPerformanceStudent(BaseModel):
    rank: int
    student_id: int
    student_name: str
    homeroom_teacher: str
    class_name: str
    overall_completion_rate: float

# 5번: 과목별 숙제 성취도 하위 10명 스키마
class DashboardLowPerformanceSubjectStudent(BaseModel):
    rank: int
    student_id: int
    student_name: str
    homeroom_teacher: str
    subject_name: str
    subject_completion_rate: float

class StudentSubjectProgressDetail(BaseModel):
    class_id: int
    subject_id: int
    subject_name: str
    teacher_name: str
    subject_total: int
    subject_completed: int
    completion_rate: float

class StudentProgressDetail(BaseModel):
    student_id: int
    student_name: str
    english_name: str
    school: str
    grade: str
    overall_completion_rate: float
    subjects: list[StudentSubjectProgressDetail]

    class Config:
        from_attributes = True