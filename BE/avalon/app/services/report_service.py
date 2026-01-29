from sqlalchemy import select
from sqlalchemy.orm import joinedload
from collections import defaultdict
from fastapi import HTTPException
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, select
from typing import Dict, Any
from datetime import date, timedelta
from collections import defaultdict

from ..models.class_session import ClassSession
from ..models.homework import Homework
from ..models.check_homework import CheckHomework
from ..models.student import Student
from ..models.class_student import ClassStudent
from ..models.class_model import Class
from ..models.semester import Semester
from ..models.subject import Subject
from ..models.curriculum_detail import CurriculumDetail
from ..models.weekday import Weekday
from ..models.test import Test
from ..models.todo import Todo, TodoType
from ..models.user import User
from ..models.assignment import TeacherAssignment

from ..schemas.reports import (
    HomeworkDetail, HomeworkProgressReport, StudentHomeworkProgress, StudentWeeklyHomeworkReport,
    TeacherClassPerformance, ClassPerformanceDetail, TeacherSubjectPerformance, SubjectPerformanceDetail,
    DashboardLowPerformanceStudent, DashboardLowPerformanceSubjectStudent
)

from ..utils.cache_decorator import cache_with_background_refresh

WEEKDAY_MAP = {
    0: Weekday.Mon,
    1: Weekday.Tue,
    2: Weekday.Wed,
    3: Weekday.Thu,
    4: Weekday.Fri,
    5: Weekday.Sat,
    6: Weekday.Sun,
}

class ReportService:
    def __init__(self, db):
        self.db = db


    @cache_with_background_refresh(cache_time=86400, key_prefix="student_progress")
    async def get_student_subject_progress(self, student_id: int):
        today = date.today()
        student = await self.db.execute(
            select(Student).where(Student.student_id == student_id)
        )
        student = student.scalars().first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        class_students = await self.db.execute(
            select(ClassStudent.class_id).where(ClassStudent.student_id == student_id)
        )
        class_ids = class_students.scalars().all()
        if not class_ids:
            return []
        assignments = await self.db.execute(
            select(TeacherAssignment).where(TeacherAssignment.class_id.in_(class_ids))
        )
        subject_ids = list({a.subject_id for a in assignments.scalars().all()})
        result = []
        for class_id in class_ids:
            for subject_id in subject_ids:
                subject_obj = await self.db.execute(
                    select(Subject).where(Subject.subject_id == subject_id)
                )
                subject = subject_obj.scalars().first()
                subject_name = subject.subject_name if subject else ""
                teacher_assignment_obj = await self.db.execute(
                    select(TeacherAssignment).where(
                        TeacherAssignment.class_id == class_id,
                        TeacherAssignment.subject_id == subject_id
                    )
                )
                teacher_assignment = teacher_assignment_obj.scalars().first()
                teacher = None
                teacher_name = ""
                if teacher_assignment:
                    teacher_obj = await self.db.execute(
                        select(User).where(User.user_id == teacher_assignment.user_id)
                    )
                    teacher = teacher_obj.scalars().first()
                    teacher_name = teacher.name if teacher else ""
                class_obj = await self.db.execute(
                    select(Class).where(Class.class_id == class_id)
                )
                class_row = class_obj.scalars().first()
                curri_detail_ids_obj = await self.db.execute(
                    select(CurriculumDetail.curri_detail_id).where(
                        CurriculumDetail.curriculum_id == class_row.curriculum_id
                    )
                )
                curri_detail_ids = curri_detail_ids_obj.scalars().all()
                homeworks_obj = await self.db.execute(
                    select(Homework).where(
                        Homework.curri_detail_id.in_(curri_detail_ids),
                        Homework.subject_id == subject_id
                    )
                )
                homeworks = homeworks_obj.scalars().all()
                valid_homeworks = []
                for hw in homeworks:
                    if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                        continue
                    assigned_session_obj = await self.db.execute(
                        select(ClassSession).where(
                            ClassSession.class_id == class_id,
                            ClassSession.subject_id == hw.subject_id,
                            ClassSession.curri_detail_id == hw.curri_detail_id
                        ).order_by(ClassSession.session_date)
                    )
                    assigned_session = assigned_session_obj.scalars().first()
                    assigned_date = assigned_session.session_date if assigned_session else None
                    next_session = None
                    if assigned_date:
                        next_session_obj = await self.db.execute(
                            select(ClassSession).where(
                                ClassSession.class_id == class_id,
                                ClassSession.subject_id == hw.subject_id,
                                ClassSession.session_date > assigned_date
                            ).order_by(ClassSession.session_date)
                        )
                        next_session = next_session_obj.scalars().first()
                    if next_session:
                        due_date = next_session.session_date
                    elif assigned_date:
                        due_date = assigned_date + timedelta(days=7)
                    else:
                        due_date = None
                    if due_date and due_date <= today:
                        valid_homeworks.append(hw)
                checks_obj = await self.db.execute(
                    select(CheckHomework).where(
                        CheckHomework.student_id == student_id,
                        CheckHomework.class_id == class_id
                    )
                )
                checks = checks_obj.scalars().all()
                completed_set = {c.homework_id for c in checks}
                subject_total = len(valid_homeworks)
                subject_completed = sum(hw.homework_id in completed_set for hw in valid_homeworks)
                completion_rate = (subject_completed / subject_total) * 100 if subject_total > 0 else 0.0
                result.append({
                    "class_id": class_id,
                    "subject_id": subject_id,
                    "subject_name": subject_name,
                    "teacher_name": teacher_name,
                    "subject_total": subject_total,
                    "subject_completed": subject_completed,
                    "completion_rate": round(completion_rate, 2)
                })
        return result



    @cache_with_background_refresh(cache_time=86400, key_prefix="homework_progress")
    async def get_homework_progress_for_class(self, class_id: int, start_date: date, end_date: date) -> HomeworkProgressReport:
        today = date.today()
        students_in_class_obj = await self.db.execute(
            select(Student).join(ClassStudent).where(ClassStudent.class_id == class_id)
        )
        students_in_class = students_in_class_obj.scalars().all()
        if not students_in_class:
            return HomeworkProgressReport(class_id=class_id, reports=[])
        sessions_obj = await self.db.execute(
            select(ClassSession)
            .where(ClassSession.class_id == class_id, ClassSession.session_date.between(start_date, end_date))
            .options(
                joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                joinedload(ClassSession.subject),
                joinedload(ClassSession.classtime),
            )
            .order_by(ClassSession.session_date)
        )
        sessions = sessions_obj.unique().scalars().all()
        sessions_by_subject = defaultdict(list)
        for s in sessions:
            sessions_by_subject[s.subject_id].append(s)
        homework_map = {}
        all_assigned_homeworks_with_due_dates = []
        for subject_id, subject_sessions in sessions_by_subject.items():
            for i, current_session in enumerate(subject_sessions):
                next_due_session = None
                for j in range(i + 1, len(subject_sessions)):
                    if subject_sessions[j].session_date > current_session.session_date:
                        next_due_session = subject_sessions[j]
                        break
                if not next_due_session:
                    continue
                if not current_session.curriculum_detail or not current_session.curriculum_detail.homeworks:
                    continue
                for hw in current_session.curriculum_detail.homeworks:
                    if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                        continue
                    assigned_session_obj = await self.db.execute(
                        select(ClassSession).where(
                            ClassSession.class_id == class_id,
                            ClassSession.subject_id == hw.subject_id,
                            ClassSession.curri_detail_id == hw.curri_detail_id
                        ).order_by(ClassSession.session_date)
                    )
                    assigned_session = assigned_session_obj.scalars().first()
                    assigned_date = assigned_session.session_date if assigned_session else None
                    next_session = None
                    if assigned_date:
                        next_session_obj = await self.db.execute(
                            select(ClassSession).where(
                                ClassSession.class_id == class_id,
                                ClassSession.subject_id == hw.subject_id,
                                ClassSession.session_date > assigned_date
                            ).order_by(ClassSession.session_date)
                        )
                        next_session = next_session_obj.scalars().first()
                    if next_session:
                        due_date = next_session.session_date
                    elif assigned_date:
                        due_date = assigned_date + timedelta(days=7)
                    else:
                        due_date = None
                    if due_date and due_date <= today:
                        homework_map.setdefault((class_id, hw.subject_id), []).append(hw)
                        all_assigned_homeworks_with_due_dates.append((hw, assigned_date, due_date))
        completed_homework_records_obj = await self.db.execute(
            select(CheckHomework).where(
                CheckHomework.class_id == class_id,
                CheckHomework.student_id.in_([s.student_id for s in students_in_class])
            )
        )
        completed_homework_records = completed_homework_records_obj.scalars().all()
        completed_homework_set = set((ch.student_id, ch.homework_id) for ch in completed_homework_records)
        student_reports = []
        for student in students_in_class:
            total_assigned = 0
            completed = 0
            incomplete_overdue = 0
            pending = 0
            for hw, assigned_date, due_date in all_assigned_homeworks_with_due_dates:
                total_assigned += 1
                if (student.student_id, hw.homework_id) in completed_homework_set:
                    completed += 1
                elif today > due_date:
                    incomplete_overdue += 1
                else:
                    pending += 1
            completion_rate = (completed / total_assigned) * 100 if total_assigned > 0 else 0
            overdue_rate = (incomplete_overdue / total_assigned) * 100 if total_assigned > 0 else 0
            student_reports.append(
                StudentHomeworkProgress(
                    student_id=student.student_id,
                    student_name=student.student_name,
                    total_assigned_homework=total_assigned,
                    completed_homework=completed,
                    incomplete_overdue_homework=incomplete_overdue,
                    pending_homework=pending,
                    completion_rate=round(completion_rate, 2),
                    overdue_rate=round(overdue_rate, 2)
                )
            )
        return HomeworkProgressReport(class_id=class_id, reports=student_reports)



    @cache_with_background_refresh(cache_time=86400, key_prefix="weekly_homework")
    async def get_student_weekly_homework_report(self, student_id: int) -> StudentWeeklyHomeworkReport:
        today = date.today()
        if today.weekday() >= 5:
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=4)
        else:
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = today
        student_obj = await self.db.execute(
            select(Student).where(Student.student_id == student_id)
        )
        student = student_obj.scalars().first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        class_ids_obj = await self.db.execute(
            select(ClassStudent.class_id).where(ClassStudent.student_id == student_id)
        )
        class_ids = class_ids_obj.scalars().all()
        if not class_ids:
            return StudentWeeklyHomeworkReport(
                student_id=student_id,
                student_name=student.student_name,
                start_of_week=start_of_week,
                end_of_week=end_of_week,
                total_homework_count=0,
                completed_homework_count=0,
                completion_rate=0.0,
                homeworks=[]
            )
        all_sessions_obj = await self.db.execute(
            select(ClassSession)
            .where(ClassSession.class_id.in_(class_ids))
            .options(
                joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                joinedload(ClassSession.subject),
                joinedload(ClassSession.classtime),
            )
            .order_by(ClassSession.session_date)
        )
        all_sessions = all_sessions_obj.unique().scalars().all()
        sessions_by_subject = defaultdict(list)
        for s in all_sessions:
            sessions_by_subject[s.subject_id].append(s)
        all_homeworks_details = []
        for session in all_sessions:
            if not session.curriculum_detail or not session.curriculum_detail.homeworks:
                continue
            subject_sessions = sessions_by_subject[session.subject_id]
            current_session_index = -1
            for i, s in enumerate(subject_sessions):
                if s.session_id == session.session_id:
                    current_session_index = i
                    break
            next_due_session = None
            if current_session_index != -1:
                for j in range(current_session_index + 1, len(subject_sessions)):
                    if subject_sessions[j].session_date > session.session_date:
                        next_due_session = subject_sessions[j]
                        break
            due_date = next_due_session.session_date if next_due_session else session.session_date + timedelta(days=7)
            for hw in session.curriculum_detail.homeworks:
                if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                    continue
                all_homeworks_details.append({
                    "homework_id": hw.homework_id,
                    "homework_name": hw.homework_name,
                    "subject_name": session.subject.subject_name,
                    "assigned_date": session.session_date,
                    "due_date": due_date,
                })
        weekly_homeworks_details = [hw for hw in all_homeworks_details if start_of_week <= hw["due_date"] <= end_of_week]
        completed_homework_records_obj = await self.db.execute(
            select(CheckHomework).where(CheckHomework.student_id == student_id)
        )
        completed_homework_records = completed_homework_records_obj.scalars().all()
        completed_homework_set = {ch.homework_id for ch in completed_homework_records}
        homework_details_list = []
        completed_count = 0
        for hw_detail in weekly_homeworks_details:
            status = "미완료"
            if hw_detail["homework_id"] in completed_homework_set:
                status = "완료"
                completed_count += 1
            elif today > hw_detail["due_date"]:
                status = "미완료 (기한 지남)"
            homework_details_list.append(
                HomeworkDetail(
                    homework_id=hw_detail["homework_id"],
                    homework_name=hw_detail["homework_name"],
                    subject_name=hw_detail["subject_name"],
                    assigned_date=hw_detail["assigned_date"],
                    due_date=hw_detail["due_date"],
                    status=status
                )
            )
        total_count = len(homework_details_list)
        completion_rate = (completed_count / total_count) * 100 if total_count > 0 else 0
        return StudentWeeklyHomeworkReport(
            student_id=student_id,
            student_name=student.student_name,
            start_of_week=start_of_week,
            end_of_week=end_of_week,
            total_homework_count=total_count,
            completed_homework_count=completed_count,
            completion_rate=round(completion_rate, 2),
            homeworks=homework_details_list
        )



    @cache_with_background_refresh(cache_time=86400, key_prefix="dashboard_low_perf")
    async def get_dashboard_low_performance_students(self, semester_id: int, limit: int = 10):
        """전체 학생 중 3과목 통합 숙제 완료율이 가장 낮은 학생 리스트 반환"""
        classes_obj = await self.db.execute(
            select(Class).where(Class.semester_id == semester_id)
        )
        classes = classes_obj.scalars().all()
        class_ids = [c.class_id for c in classes]
        class_map = {c.class_id: c for c in classes}
        teacher_map = {}
        for c in classes:
            teacher_obj = await self.db.execute(
                select(User).where(User.user_id == c.kr_homeroom_id)
            )
            teacher = teacher_obj.scalars().first()
            teacher_map[c.class_id] = teacher.username if teacher else ""
        class_students_obj = await self.db.execute(
            select(ClassStudent).where(ClassStudent.class_id.in_(class_ids))
        )
        class_students = class_students_obj.scalars().all()
        student_ids = list({cs.student_id for cs in class_students})
        students_obj = await self.db.execute(
            select(Student).where(Student.student_id.in_(student_ids))
        )
        students = students_obj.scalars().all()
        student_map = {s.student_id: s for s in students}
        student_class_map = {}
        for cs in class_students:
            if cs.student_id not in student_class_map:
                student_class_map[cs.student_id] = cs.class_id
        class_curri_map = {c.class_id: c.curriculum_id for c in classes}
        curriculum_ids = list(set(class_curri_map.values()))
        curri_details_obj = await self.db.execute(
            select(CurriculumDetail).where(CurriculumDetail.curriculum_id.in_(curriculum_ids))
        )
        curri_details = curri_details_obj.scalars().all()
        curri_detail_map = {}
        for cd in curri_details:
            curri_detail_map.setdefault(cd.curriculum_id, []).append(cd.curri_detail_id)
        homeworks_obj = await self.db.execute(
            select(Homework).where(Homework.curri_detail_id.in_([cd.curri_detail_id for cd in curri_details]))
        )
        homeworks = homeworks_obj.scalars().all()
        homework_map = {}
        for hw in homeworks:
            if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                continue
            for class_id, curriculum_id in class_curri_map.items():
                if hw.curri_detail_id in curri_detail_map.get(curriculum_id, []):
                    assigned_session_obj = await self.db.execute(
                        select(ClassSession)
                        .where(
                            ClassSession.class_id == class_id,
                            ClassSession.subject_id == hw.subject_id,
                            ClassSession.curri_detail_id == hw.curri_detail_id
                        )
                        .options(
                            joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                            joinedload(ClassSession.subject),
                            joinedload(ClassSession.classtime),
                        )
                        .order_by(ClassSession.session_date)
                    )
                    assigned_session = assigned_session_obj.unique().scalars().first()
                    assigned_date = assigned_session.session_date if assigned_session else None
                    next_session = None
                    if assigned_date:
                        next_session_obj = await self.db.execute(
                            select(ClassSession).where(
                                ClassSession.class_id == class_id,
                                ClassSession.subject_id == hw.subject_id,
                                ClassSession.session_date > assigned_date
                            ).order_by(ClassSession.session_date)
                        )
                        next_session = next_session_obj.scalars().first()
                    if next_session:
                        due_date = next_session.session_date
                    elif assigned_date:
                        due_date = assigned_date + timedelta(days=7)
                    else:
                        due_date = None
                    if due_date and due_date <= date.today():
                        homework_map.setdefault((class_id, hw.subject_id), []).append(hw)
        checks_obj = await self.db.execute(
            select(CheckHomework).where(CheckHomework.class_id.in_(class_ids))
        )
        checks = checks_obj.scalars().all()
        check_set = set((c.student_id, c.homework_id) for c in checks)
        result = []
        for student_id in student_ids:
            class_id = student_class_map.get(student_id)
            class_name = class_map[class_id].class_name if class_id and class_id in class_map else ""
            homeroom_teacher = teacher_map.get(class_id, "")
            student_name = student_map[student_id].student_name if student_id in student_map else ""
            assigned_subject_ids_obj = await self.db.execute(
                select(TeacherAssignment.subject_id).where(TeacherAssignment.class_id == class_id).distinct()
            )
            assigned_subject_ids = assigned_subject_ids_obj.scalars().all()
            total = 0
            done = 0
            for sid in assigned_subject_ids:
                hws = homework_map.get((class_id, sid), [])
                total += len(hws)
                done += sum((student_id, hw.homework_id) in check_set for hw in hws)
            rate = (done / total) * 100 if total > 0 else 0.0
            result.append({
                "student_id": student_id,
                "student_name": student_name,
                "homeroom_teacher": homeroom_teacher,
                "class_name": class_name,
                "overall_completion_rate": round(rate, 2)
            })
        result.sort(key=lambda x: (x["overall_completion_rate"], x["student_name"], x["student_id"]))
        filtered = [item for item in result if item["overall_completion_rate"] < 70]
        filtered.sort(key=lambda x: (x["overall_completion_rate"], x["student_name"], x["student_id"]))
        for idx, item in enumerate(filtered[:limit], 1):
            item["rank"] = idx
        return filtered[:limit]



    @cache_with_background_refresh(cache_time=86400, key_prefix="dashboard_low_subj_perf")
    async def get_dashboard_low_performance_subject_students(self, semester_id: int, limit: int = 10):
        """과목별 숙제 완료율이 가장 낮은 학생 리스트 반환"""
        classes_obj = await self.db.execute(
            select(Class).where(Class.semester_id == semester_id)
        )
        classes = classes_obj.scalars().all()
        class_ids = [c.class_id for c in classes]
        class_map = {c.class_id: c for c in classes}
        teacher_map = {}
        for c in classes:
            teacher_obj = await self.db.execute(
                select(User).where(User.user_id == c.kr_homeroom_id)
            )
            teacher = teacher_obj.scalars().first()
            teacher_map[c.class_id] = teacher.username if teacher else ""
        class_students_obj = await self.db.execute(
            select(ClassStudent).where(ClassStudent.class_id.in_(class_ids))
        )
        class_students = class_students_obj.scalars().all()
        student_ids = list({cs.student_id for cs in class_students})
        students_obj = await self.db.execute(
            select(Student).where(Student.student_id.in_(student_ids))
        )
        students = students_obj.scalars().all()
        student_map = {s.student_id: s for s in students}
        student_class_map = {}
        for cs in class_students:
            if cs.student_id not in student_class_map:
                student_class_map[cs.student_id] = cs.class_id
        class_curri_map = {c.class_id: c.curriculum_id for c in classes}
        curriculum_ids = list(set(class_curri_map.values()))
        curri_details_obj = await self.db.execute(
            select(CurriculumDetail).where(CurriculumDetail.curriculum_id.in_(curriculum_ids))
        )
        curri_details = curri_details_obj.scalars().all()
        curri_detail_map = {}
        for cd in curri_details:
            curri_detail_map.setdefault(cd.curriculum_id, []).append(cd.curri_detail_id)
        homeworks_obj = await self.db.execute(
            select(Homework).where(Homework.curri_detail_id.in_([cd.curri_detail_id for cd in curri_details]))
        )
        homeworks = homeworks_obj.scalars().all()
        homework_by_subject = defaultdict(list)
        for hw in homeworks:
            if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                continue
            for class_id, curriculum_id in class_curri_map.items():
                if hw.curri_detail_id in curri_detail_map.get(curriculum_id, []):
                    assigned_session_obj = await self.db.execute(
                        select(ClassSession)
                        .where(
                            ClassSession.class_id == class_id,
                            ClassSession.subject_id == hw.subject_id,
                            ClassSession.curri_detail_id == hw.curri_detail_id
                        )
                        .options(
                            joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                            joinedload(ClassSession.subject),
                            joinedload(ClassSession.classtime),
                        )
                        .order_by(ClassSession.session_date)
                    )
                    assigned_session = assigned_session_obj.unique().scalars().first()
                    assigned_date = assigned_session.session_date if assigned_session else None
                    next_session = None
                    if assigned_date:
                        next_session_obj = await self.db.execute(
                            select(ClassSession).where(
                                ClassSession.class_id == class_id,
                                ClassSession.subject_id == hw.subject_id,
                                ClassSession.session_date > assigned_date
                            ).order_by(ClassSession.session_date)
                        )
                        next_session = next_session_obj.scalars().first()
                    if next_session:
                        due_date = next_session.session_date
                    elif assigned_date:
                        due_date = assigned_date + timedelta(days=7)
                    else:
                        due_date = None
                    if due_date and due_date <= date.today():
                        homework_by_subject[(class_id, hw.subject_id)].append(hw)
        subject_ids = list(set([hw.subject_id for hw in homeworks]))
        subjects_obj = await self.db.execute(
            select(Subject).where(Subject.subject_id.in_(subject_ids))
        )
        subjects = subjects_obj.scalars().all()
        subject_map = {s.subject_id: s.subject_name for s in subjects}
        checks_obj = await self.db.execute(
            select(CheckHomework).where(CheckHomework.class_id.in_(class_ids))
        )
        checks = checks_obj.scalars().all()
        check_set = set((c.student_id, c.homework_id) for c in checks)
        perf = []
        for student_id in student_ids:
            class_id = student_class_map.get(student_id)
            homeroom_teacher = teacher_map.get(class_id, "")
            student_name = student_map[student_id].student_name if student_id in student_map else ""
            assigned_subject_ids_obj = await self.db.execute(
                select(TeacherAssignment.subject_id).where(TeacherAssignment.class_id == class_id).distinct()
            )
            assigned_subject_ids = assigned_subject_ids_obj.scalars().all()
            for subject_id in assigned_subject_ids:
                hws = homework_by_subject.get((class_id, subject_id), [])
                total = len(hws)
                done = sum((student_id, hw.homework_id) in check_set for hw in hws)
                rate = (done / total) * 100 if total > 0 else 0.0
                perf.append({
                    "rank": 0,  # 임시값, 나중에 설정
                    "student_id": student_id,
                    "student_name": student_name,
                    "homeroom_teacher": homeroom_teacher,
                    "subject_name": subject_map.get(subject_id, ""),
                    "subject_completion_rate": round(rate, 2)
                })
        perf.sort(key=lambda x: (x["subject_completion_rate"], x["student_id"]))
        filtered = [item for item in perf if item["subject_completion_rate"] < 70]
        filtered.sort(key=lambda x: (x["subject_completion_rate"], x["student_id"]))
        for idx, item in enumerate(filtered[:limit], 1):
            item["rank"] = idx
        return filtered[:limit]



    @cache_with_background_refresh(cache_time=86400, key_prefix="teacher_subject_perf")
    async def get_teacher_subject_performance(self, user_id: int, semester_id: int):
        """특정 강사의 특정 학기 담당 과목별 숙제 성취도 통계 반환"""
        teaching_assignments_obj = await self.db.execute(
            select(TeacherAssignment).where(TeacherAssignment.user_id == user_id)
        )
        teaching_assignments = teaching_assignments_obj.scalars().all()
        class_ids = list(set([ta.class_id for ta in teaching_assignments]))
        classes_obj = await self.db.execute(
            select(Class).where(
                Class.class_id.in_(class_ids),
                Class.semester_id == semester_id
            )
        )
        classes = classes_obj.scalars().all()
        if not classes:
            semester_obj = await self.db.execute(
                select(Semester).where(Semester.semester_id == semester_id)
            )
            semester = semester_obj.scalars().first()
            user_obj = await self.db.execute(
                select(User).where(User.user_id == user_id)
            )
            user = user_obj.scalars().first()
            return TeacherSubjectPerformance(
                user_id=user_id,
                user_name=user.username if user else "",
                semester_id=semester_id,
                semester_name=semester.semester_name if semester else "",
                overall_completion_rate=0.0,
                subjects_below_70_percent=0,
                total_students_below_70_percent=0,
                subject_details=[]
            )
        subject_details = []
        all_completion_rates = []
        total_students_below_70 = 0
        subjects_below_70 = 0
        unique_assignments = set()
        for ta in teaching_assignments:
            cls = next((c for c in classes if c.class_id == ta.class_id), None)
            if not cls:
                continue
            key = (cls.class_id, ta.subject_id)
            unique_assignments.add(key)
        for class_id, subject_id in unique_assignments:
            cls = next((c for c in classes if c.class_id == class_id), None)
            subject_obj = await self.db.execute(
                select(Subject).where(Subject.subject_id == subject_id)
            )
            subject = subject_obj.scalars().first()
            students_obj = await self.db.execute(
                select(Student)
                .join(ClassStudent, ClassStudent.student_id == Student.student_id)
                .where(ClassStudent.class_id == class_id)
            )
            students = students_obj.scalars().all()
            student_ids = [s.student_id for s in students]
            curri_detail_ids_obj = await self.db.execute(
                select(CurriculumDetail.curri_detail_id).where(
                    CurriculumDetail.curriculum_id == cls.curriculum_id
                )
            )
            curri_detail_ids = curri_detail_ids_obj.scalars().all()
            homeworks_obj = await self.db.execute(
                select(Homework).where(
                    Homework.curri_detail_id.in_(curri_detail_ids), Homework.subject_id == subject_id
                )
            )
            homeworks = homeworks_obj.scalars().all()
            filtered_homeworks = []
            for hw in homeworks:
                if hasattr(hw, 'tags') and hw.tags:
                    tag_names = [tag.tag_name for tag in hw.tags]
                    if "OVERDUE" in tag_names:
                        continue
                assigned_session_obj = await self.db.execute(
                    select(ClassSession)
                    .where(
                        ClassSession.class_id == class_id,
                        ClassSession.subject_id == hw.subject_id,
                        ClassSession.curri_detail_id == hw.curri_detail_id
                    )
                    .options(
                        joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                        joinedload(ClassSession.subject),
                        joinedload(ClassSession.classtime),
                    )
                    .order_by(ClassSession.session_date)
                )
                assigned_session = assigned_session_obj.unique().scalars().first()
                assigned_date = assigned_session.session_date if assigned_session else None
                next_session = None
                if assigned_date:
                    next_session_obj = await self.db.execute(
                        select(ClassSession).where(
                            ClassSession.class_id == class_id,
                            ClassSession.subject_id == hw.subject_id,
                            ClassSession.session_date > assigned_date
                        ).order_by(ClassSession.session_date)
                    )
                    next_session = next_session_obj.scalars().first()
                if next_session:
                    due_date = next_session.session_date
                elif assigned_date:
                    due_date = assigned_date + timedelta(days=7)
                else:
                    due_date = None
                if due_date and due_date <= date.today():
                    filtered_homeworks.append(hw)
            homework_ids = [h.homework_id for h in filtered_homeworks]
            completed_obj = await self.db.execute(
                select(CheckHomework).where(
                    CheckHomework.class_id == class_id,
                    CheckHomework.homework_id.in_(homework_ids)
                )
            )
            completed = completed_obj.scalars().all()
            completed_set = set((c.student_id, c.homework_id) for c in completed)
            students_below_70 = 0
            for s_id in student_ids:
                total = len(homework_ids)
                if total == 0:
                    continue
                done = sum((s_id, hw_id) in completed_set for hw_id in homework_ids)
                rate = (done / total) * 100
                if rate < 70:
                    students_below_70 += 1
            total_assignments = len(homework_ids) * len(student_ids) if student_ids else 0
            total_completed = sum((s_id, hw_id) in completed_set for s_id in student_ids for hw_id in homework_ids)
            completion_rate = (total_completed / total_assignments) * 100 if total_assignments > 0 else 0.0
            all_completion_rates.append(completion_rate)
            if completion_rate < 70:
                subjects_below_70 += 1
            total_students_below_70 += students_below_70
            subject_details.append(SubjectPerformanceDetail(
                class_id=class_id,
                subject_id=subject_id,
                subject_name=subject.subject_name if subject else "",
                completion_rate=round(completion_rate, 2),
                students_below_70_percent=students_below_70
            ))
        overall_completion_rate = sum(all_completion_rates) / len(all_completion_rates) if all_completion_rates else 0.0
        semester_obj = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        semester = semester_obj.scalars().first()
        user_obj = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        user = user_obj.scalars().first()
        return TeacherSubjectPerformance(
            user_id=user_id,
            user_name=user.username if user else "",
            semester_id=semester_id,
            semester_name=semester.semester_name if semester else "",
            overall_completion_rate=round(overall_completion_rate, 2),
            subjects_below_70_percent=subjects_below_70,
            total_students_below_70_percent=total_students_below_70,
            subject_details=subject_details
        )



    @cache_with_background_refresh(cache_time=86400, key_prefix="teacher_class_perf")
    async def get_teacher_class_performance(self, user_id: int, semester_id: int):
        """특정 강사의 특정 학기 담당 반들의 숙제 성취도 통계 반환"""
        classes_obj = await self.db.execute(
            select(Class).where(
                or_(Class.kr_homeroom_id == user_id, Class.fr_homeroom_id == user_id),
                Class.semester_id == semester_id
            )
        )
        classes = classes_obj.scalars().all()
        if not classes:
            semester_obj = await self.db.execute(
                select(Semester).where(Semester.semester_id == semester_id)
            )
            semester = semester_obj.scalars().first()
            user_obj = await self.db.execute(
                select(User).where(User.user_id == user_id)
            )
            user = user_obj.scalars().first()
            return TeacherClassPerformance(
                user_id=user_id,
                user_name=user.username if user else "",
                semester_id=semester_id,
                semester_name=semester.semester_name if semester else "",
                overall_completion_rate=0.0,
                classes_below_70_percent=0,
                total_students_below_70_percent=0,
                class_details=[]
            )
        class_ids = [c.class_id for c in classes]
        class_map = {c.class_id: c for c in classes}
        kr_teacher_map = {}
        fr_teacher_map = {}
        for c in classes:
            kr_teacher = None
            fr_teacher = None
            if c.kr_homeroom_id:
                kr_teacher_obj = await self.db.execute(
                    select(User).where(User.user_id == c.kr_homeroom_id)
                )
                kr_teacher = kr_teacher_obj.scalars().first()
            if c.fr_homeroom_id:
                fr_teacher_obj = await self.db.execute(
                    select(User).where(User.user_id == c.fr_homeroom_id)
                )
                fr_teacher = fr_teacher_obj.scalars().first()
            kr_teacher_map[c.class_id] = kr_teacher.name if kr_teacher and kr_teacher.name else ""
            fr_teacher_map[c.class_id] = fr_teacher.name if fr_teacher and fr_teacher.name else ""
        class_students_obj = await self.db.execute(
            select(ClassStudent).where(ClassStudent.class_id.in_(class_ids))
        )
        class_students = class_students_obj.scalars().all()
        student_ids = list({cs.student_id for cs in class_students})
        students_obj = await self.db.execute(
            select(Student).where(Student.student_id.in_(student_ids))
        )
        students = students_obj.scalars().all()
        student_map = {s.student_id: s for s in students}
        student_class_map = {}
        for cs in class_students:
            if cs.student_id not in student_class_map:
                student_class_map[cs.student_id] = cs.class_id
        assigned_subject_map = {}
        for class_id in class_ids:
            assigned_subjects_obj = await self.db.execute(
                select(TeacherAssignment.subject_id).where(TeacherAssignment.class_id == class_id).distinct()
            )
            assigned_subjects = assigned_subjects_obj.scalars().all()
            assigned_subject_map[class_id] = assigned_subjects
        curriculum_ids = [c.curriculum_id for c in classes]
        curri_details_obj = await self.db.execute(
            select(CurriculumDetail).where(CurriculumDetail.curriculum_id.in_(curriculum_ids))
        )
        curri_details = curri_details_obj.scalars().all()
        curri_detail_ids = [cd.curri_detail_id for cd in curri_details]
        homeworks_obj = await self.db.execute(
            select(Homework).where(Homework.curri_detail_id.in_(curri_detail_ids))
        )
        homeworks = homeworks_obj.scalars().all()
        curri_detail_to_class = {}
        for c in classes:
            for cd in curri_details:
                if cd.curriculum_id == c.curriculum_id:
                    curri_detail_to_class[cd.curri_detail_id] = c.class_id
        homework_map = {}
        for hw in homeworks:
            if hw.tag_name and hw.tag_name.upper() == 'OVERDUE':
                continue
            class_id = curri_detail_to_class.get(hw.curri_detail_id)
            if class_id is None:
                continue
            assigned_session_obj = await self.db.execute(
                select(ClassSession)
                .where(
                    ClassSession.class_id == class_id,
                    ClassSession.subject_id == hw.subject_id,
                    ClassSession.curri_detail_id == hw.curri_detail_id
                )
                .options(
                    joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
                    joinedload(ClassSession.subject),
                    joinedload(ClassSession.classtime),
                )
                .order_by(ClassSession.session_date)
            )
            assigned_session = assigned_session_obj.unique().scalars().first()
            assigned_date = assigned_session.session_date if assigned_session else None
            next_session = None
            if assigned_date:
                next_session_obj = await self.db.execute(
                    select(ClassSession).where(
                        ClassSession.class_id == class_id,
                        ClassSession.subject_id == hw.subject_id,
                        ClassSession.session_date > assigned_date
                    ).order_by(ClassSession.session_date)
                )
                next_session = next_session_obj.scalars().first()
            if next_session:
                due_date = next_session.session_date
            elif assigned_date:
                due_date = assigned_date + timedelta(days=7)
            else:
                due_date = None
            if due_date and due_date <= date.today():
                homework_map.setdefault((class_id, hw.subject_id), []).append(hw)
        checks_obj = await self.db.execute(
            select(CheckHomework).where(CheckHomework.class_id.in_(class_ids))
        )
        checks = checks_obj.scalars().all()
        check_set = set((c.student_id, c.homework_id) for c in checks)
        class_details = []
        all_completion_rates = []
        total_students_below_70 = 0
        classes_below_70 = 0
        for cls in classes:
            students_in_class = [cs.student_id for cs in class_students if cs.class_id == cls.class_id]
            students_below_70 = 0
            total_rates = []
            for student_id in students_in_class:
                assigned_subject_ids = assigned_subject_map.get(cls.class_id, [])
                total = 0
                done = 0
                for sid in assigned_subject_ids:
                    hws = homework_map.get((cls.class_id, sid), [])
                    total += len(hws)
                    done += sum((student_id, hw.homework_id) in check_set for hw in hws)
                rate = (done / total) * 100 if total > 0 else 0.0
                total_rates.append(rate)
                if rate < 70:
                    students_below_70 += 1
            completion_rate = sum(total_rates) / len(total_rates) if total_rates else 0.0
            if completion_rate < 70:
                classes_below_70 += 1
            total_students_below_70 += students_below_70
            all_completion_rates.append(completion_rate)
            class_details.append(ClassPerformanceDetail(
                class_id=cls.class_id,
                class_name=cls.class_name,
                kr_homeroom_teacher=kr_teacher_map.get(cls.class_id, ""),
                fr_homeroom_teacher=fr_teacher_map.get(cls.class_id, ""),
                completion_rate=round(completion_rate, 2),
                students_below_70_percent=students_below_70
            ))
        overall_completion_rate = sum(all_completion_rates) / len(all_completion_rates) if all_completion_rates else 0.0
        semester_obj = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        semester = semester_obj.scalars().first()
        user_obj = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        user = user_obj.scalars().first()
        return TeacherClassPerformance(
            user_id=user_id,
            user_name=user.username if user else "",
            semester_id=semester_id,
            semester_name=semester.semester_name if semester else "",
            overall_completion_rate=round(overall_completion_rate, 2),
            classes_below_70_percent=classes_below_70,
            total_students_below_70_percent=total_students_below_70,
            class_details=class_details
        )



    @cache_with_background_refresh(cache_time=86400, key_prefix="class_student_progress")
    async def get_student_progress_details_for_class(self, class_id: int):
        students_obj = await self.db.execute(
            select(Student).join(ClassStudent, ClassStudent.student_id == Student.student_id).where(ClassStudent.class_id == class_id)
        )
        students = students_obj.scalars().all()
        if not students:
            return []
        assignments_obj = await self.db.execute(
            select(TeacherAssignment).where(TeacherAssignment.class_id == class_id)
        )
        assignments = assignments_obj.scalars().all()
        subject_teacher_map = {a.subject_id: a.user_id for a in assignments}
        subjects_obj = await self.db.execute(
            select(Subject).where(Subject.subject_id.in_(list(subject_teacher_map.keys())))
        )
        subjects = subjects_obj.scalars().all()
        subject_name_map = {s.subject_id: s.subject_name for s in subjects}
        teacher_obj = await self.db.execute(
            select(User).where(User.user_id.in_(list(subject_teacher_map.values())))
        )
        teachers = teacher_obj.scalars().all()
        teacher_map = {u.user_id: u.username for u in teachers}
        class_obj = await self.db.execute(
            select(Class).where(Class.class_id == class_id)
        )
        class_row = class_obj.scalars().first()
        curri_details_obj = await self.db.execute(
            select(CurriculumDetail).where(CurriculumDetail.curriculum_id == class_row.curriculum_id) if class_row else select(CurriculumDetail).where(False)
        )
        curri_details = curri_details_obj.scalars().all()
        curri_detail_ids = [cd.curri_detail_id for cd in curri_details]
        homeworks_obj = await self.db.execute(
            select(Homework)
            .where(Homework.curri_detail_id.in_(curri_detail_ids))
            .options(
                joinedload(Homework.curri_detail),
                joinedload(Homework.subject),
            )
        )
        homeworks = homeworks_obj.unique().scalars().all()
        homeworks_by_subject = {}
        for hw in homeworks:
            homeworks_by_subject.setdefault(hw.subject_id, []).append(hw)
        checks_obj = await self.db.execute(
            select(CheckHomework).where(CheckHomework.class_id == class_id)
        )
        checks = checks_obj.scalars().all()
        check_set = set((c.student_id, c.homework_id) for c in checks)
        result = []
        for student in students:
            total_homework = 0
            completed_homework = 0
            subject_progress = []
            for subject_id, subject_homeworks in homeworks_by_subject.items():
                subject_total = len(subject_homeworks)
                subject_completed = sum((student.student_id, hw.homework_id) in check_set for hw in subject_homeworks)
                teacher_name = teacher_map.get(subject_teacher_map.get(subject_id), "")
                subject_progress.append({
                    "subject_name": subject_name_map.get(subject_id, ""),
                    "teacher_name": teacher_name,
                    "completion_rate": round((subject_completed / subject_total) * 100, 2) if subject_total > 0 else 0.0
                })
                total_homework += subject_total
                completed_homework += subject_completed
            overall_rate = round((completed_homework / total_homework) * 100, 2) if total_homework > 0 else 0.0
            result.append({
                "student_id": student.student_id,
                "student_name": student.student_name,
                "english_name": getattr(student, "english_name", ""),
                "school": getattr(student, "school", ""),
                "grade": getattr(student, "grade", ""),
                "overall_completion_rate": overall_rate,
                "subjects": subject_progress
            })
        return result



# 시간표 제작 함수
async def fetch_class_timetable_three_months(db, class_id: int) -> Dict[str, Any]:
    # 클래스 및 학기 정보 조회
    cls_obj = await db.execute(
        select(Class).options(joinedload(Class.semester)).where(Class.class_id == class_id)
    )
    cls: Class | None = cls_obj.scalars().first()
    if not cls or not cls.semester:
        raise ValueError(f"class_id {class_id} or its semester not found")

    sem = cls.semester
    q_from, q_to = sem.semester_start_at, sem.semester_end_at

    # 수업 세션 조회
    sessions_obj = await db.execute(
        select(ClassSession)
        .where(ClassSession.class_id == class_id, ClassSession.session_date.between(q_from, q_to))
        .options(
            joinedload(ClassSession.subject),
            joinedload(ClassSession.classtime),
            joinedload(ClassSession.curriculum_detail).joinedload(CurriculumDetail.homeworks),
        )
        .order_by(ClassSession.session_date, ClassSession.classtime_id)
    )
    sessions = sessions_obj.unique().scalars().all()

    # 시험 조회
    tests_obj = await db.execute(
        select(Test)
        .where(Test.class_id == class_id, Test.test_day.between(q_from, q_to))
        .options(joinedload(Test.subject))
    )
    tests = tests_obj.scalars().all()

    # 공지 조회
    curri_detail_ids = {s.curri_detail_id for s in sessions if s.curri_detail_id}
    if curri_detail_ids:
        todos_obj = await db.execute(
            select(Todo)
            .where(Todo.curri_detail_id.in_(curri_detail_ids), Todo.todo_type == TodoType.NOTICE)
        )
        todos = todos_obj.scalars().all()
    else:
        todos = []
    todo_map = defaultdict(list)
    for todo in todos:
        todo_map[todo.curri_detail_id].append(todo.todo_thing)

    rows = []
    session_dates = set()
    for s in sessions:
        session_dates.add(s.session_date)
        homeworks = s.curriculum_detail.homeworks if s.curriculum_detail else []
        notices = todo_map.get(s.curri_detail_id, [])
        progress_str = ""
        if s.curriculum_detail:
            progress_content = s.curriculum_detail.progress.replace('\n', '<br>')
            progress_str = f"DAY {s.curriculum_detail.day}<br>{progress_content}"

        rows.append({
            "type": "session",
            "date": s.session_date,
            "weekday": s.weekday.value,
            "time_id": s.classtime.time_id,
            "subject_nick": s.subject.subject_nick,
            "progress": progress_str,
            "homework": "<br>".join([f"- {hw.homework_name} {hw.homework_contents or ''}" for hw in homeworks]),
            "notice": "<br>".join([n.replace('\n', '<br>') for n in notices]),
            "test": ""
        })

    test_only_map = defaultdict(list)
    for t in tests:
        if t.test_day not in session_dates:
            test_only_map[t.test_day].append(f"- {t.subject.subject_nick} - {t.test_title}")

    for test_day, test_list in test_only_map.items():
        rows.append({
            "type": "test_only",
            "date": test_day,
            "weekday": WEEKDAY_MAP[test_day.weekday()].value,
            "time_id": "",
            "subject_nick": "",
            "progress": "",
            "homework": "",
            "notice": "",
            "test": "<br>".join(test_list)
        })

    rows.sort(key=lambda r: r["date"])

    return {
        "class_name": cls.class_name,
        "range_from": q_from.strftime("%Y-%m-%d"),
        "range_to": q_to.strftime("%Y-%m-%d"),
        "rows": rows,
    }