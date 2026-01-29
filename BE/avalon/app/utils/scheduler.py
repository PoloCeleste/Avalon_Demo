from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
from datetime import datetime
from sqlalchemy import select

from ..core.database import get_db
from app.core.database import AsyncSessionLocal
from ..services.holiday_service import HolidayService
from ..services.report_service import ReportService
from ..models.semester import Semester
from ..models.user import User
from ..models.class_model import Class

logger = logging.getLogger(__name__)

async def sync_holidays_job():
    """
    Scheduled job to sync public holidays from data.go.kr.
    Runs daily at midnight.
    """
    logger.info("Starting public holidays sync job...")
    async with AsyncSessionLocal() as db:
        try:
            holiday_service = HolidayService(db)
            current_year = datetime.now().year
            # Sync current year's holidays
            await holiday_service.sync_public_holidays(current_year)
            # Sync next year's holidays (pre-fetch)
            await holiday_service.sync_public_holidays(current_year + 1)
            logger.info("Public holidays sync job completed.")
        except Exception as e:
            logger.error(f"Error during public holidays sync job: {e}", exc_info=True)


async def refresh_low_performance_cache_job():
    logger.info("Refreshing low performance student/subject cache...")
    async with AsyncSessionLocal() as db:
        try:
            report_service = ReportService(db)
            semesters_result = await db.execute(
                select(Semester).where(Semester.status == 1)
            )
            semesters = semesters_result.scalars().all()
            for semester in semesters:
                # 캐시 데코레이터 우회: 원본 메서드 직접 호출
                origin_students_func = report_service.get_dashboard_low_performance_students.__func__ if hasattr(report_service.get_dashboard_low_performance_students, '__func__') else report_service.get_dashboard_low_performance_students
                origin_subject_func = report_service.get_dashboard_low_performance_subject_students.__func__ if hasattr(report_service.get_dashboard_low_performance_subject_students, '__func__') else report_service.get_dashboard_low_performance_subject_students
                await origin_students_func(report_service, semester.semester_id)
                await origin_subject_func(report_service, semester.semester_id)
            logger.info("Low performance cache refresh completed.")
        except Exception as e:
            logger.error(f"Error during low performance cache refresh: {e}", exc_info=True)

async def refresh_teacher_performance_cache_job():
    logger.info("Refreshing teacher class/subject performance cache...")
    async with AsyncSessionLocal() as db:
        try:
            report_service = ReportService(db)
            semesters_result = await db.execute(
                select(Semester).where(Semester.status == 1)
            )
            semesters = semesters_result.scalars().all()
            users_result = await db.execute(select(User))
            users = users_result.scalars().all()
            for semester in semesters:
                for user in users:
                    # 캐시 데코레이터 우회: 원본 메서드 직접 호출
                    origin_class_func = report_service.get_teacher_class_performance.__func__ if hasattr(report_service.get_teacher_class_performance, '__func__') else report_service.get_teacher_class_performance
                    origin_subject_func = report_service.get_teacher_subject_performance.__func__ if hasattr(report_service.get_teacher_subject_performance, '__func__') else report_service.get_teacher_subject_performance
                    await origin_class_func(report_service, user.user_id, semester.semester_id)
                    await origin_subject_func(report_service, user.user_id, semester.semester_id)
            logger.info("Teacher performance cache refresh completed.")
        except Exception as e:
            logger.error(f"Error during teacher performance cache refresh: {e}", exc_info=True)


class TaskScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self):
        """스케줄러 시작"""
        # 공휴일 동기화 (매일 오전 10시)
        self.scheduler.add_job(sync_holidays_job, 'cron', hour=10, minute=0, misfire_grace_time=60)
        # 저성과 학생/과목 캐시 (매일 밤 23시 10분)
        self.scheduler.add_job(refresh_low_performance_cache_job, 'cron', hour=23, minute=10, misfire_grace_time=60)
        # 담당반/담당과목 숙제 완성률 캐시 (매일 밤 23시 30분)
        self.scheduler.add_job(refresh_teacher_performance_cache_job, 'cron', hour=23, minute=30, misfire_grace_time=60)

        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Task scheduler started.")
        else:
            logger.info("Task scheduler is already running.")

    def shutdown(self):
        """스케줄러 종료"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Task scheduler shutdown")

# 싱글톤 인스턴스
task_scheduler = TaskScheduler()
