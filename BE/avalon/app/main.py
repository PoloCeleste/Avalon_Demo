from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.exc import SQLAlchemyError

from .core.config import settings
from .core.logging import app_logger
from .core.exceptions import (
    http_exception_handler,
    database_exception_handler,
    general_exception_handler
)
from .middleware.logging_middleware import LoggingMiddleware
from .middleware.trailing_slash_middleware import TrailingSlashMiddleware

# 데모에서 사용하는 API만 import
from .api import auth, users, branches, students, subjects, semesters, homeworks, classtimes, classes, curriculums, curriculum_details, reports, tests, holidays, todos, class_sessions, check_homeworks

@asynccontextmanager
async def lifespan(app: FastAPI):
    app_logger.info("Starting Avalon Demo FastAPI application...")
    app_logger.info("Demo application startup completed")
    yield
    app_logger.info("Demo application shutdown completed")

app = FastAPI(
    title=f"{settings.app_name} - DEMO",
    debug=settings.debug,
    version="1.0.0-demo",
    lifespan=lifespan,
    description="Avalon Education Management System API - Demo Version (Portfolio)"
)

# 예외 핸들러 등록
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrailingSlashMiddleware)

# 미들웨어 추가
app.add_middleware(LoggingMiddleware)

# Preflight 요청을 처리하기 위한 핸들러
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str) -> Response:
    return Response(status_code=204)

# 데모 API 라우터 등록 (필수 기능만)
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(branches.router, prefix="/api/branches", tags=["Branches"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Subjects"])
app.include_router(semesters.router, prefix="/api/semesters", tags=["Semesters"])
app.include_router(homeworks.router, prefix="/api/homeworks", tags=["Homeworks"])
app.include_router(classtimes.router, prefix="/api/classtimes", tags=["Classtimes"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(curriculums.router, prefix="/api/curriculums", tags=["Curriculums"])
app.include_router(curriculum_details.router, prefix="/api/curriculum_details", tags=["Curriculum Details"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(tests.router, prefix="/api/tests", tags=["Tests"])
app.include_router(holidays.router, prefix="/api/holidays", tags=["Holidays"])
app.include_router(todos.router, prefix="/api/todos", tags=["Todos"])
app.include_router(class_sessions.router, prefix="/api/class_sessions", tags=["Class Sessions"])
app.include_router(check_homeworks.router, prefix="/api/check_homeworks", tags=["Check Homeworks"])

@app.get("/")
async def root():
    return {
        "message": "Avalon Education Management System API - Demo Version",
        "version": "1.0.0-demo",
        "description": "포트폴리오용 데모 버전 - 하드코딩된 샘플 데이터 제공"
    }

@app.get("/health")
async def health_check():
    return {"status": "UP", "mode": "demo"}

@app.get("/info")
async def info():
    return {
        "app": {
            "name": settings.app_name,
            "version": "1.0.0",
            "description": "Langcon Education Management System FastAPI"
        }
    }