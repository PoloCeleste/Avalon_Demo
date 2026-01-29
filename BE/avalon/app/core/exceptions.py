import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from redis.exceptions import RedisError

logger = logging.getLogger("langcon.exceptions")

async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 예외 처리"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "path": str(request.url.path)
            }
        }
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """데이터베이스 예외 처리"""
    logger.error(f"Database error: {str(exc)} - {request.method} {request.url}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal database error",
                "path": str(request.url.path)
            }
        }
    )

async def redis_exception_handler(request: Request, exc: RedisError):
    """Redis 예외 처리"""
    logger.error(f"Redis error: {str(exc)} - {request.method} {request.url}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Cache service error",
                "path": str(request.url.path)
            }
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 처리"""
    logger.error(f"Unexpected error: {str(exc)} - {request.method} {request.url}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "path": str(request.url.path)
            }
        }
    )