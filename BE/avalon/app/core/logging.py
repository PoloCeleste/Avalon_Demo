import logging
import sys
from pathlib import Path

def setup_logging():
    """로깅 설정"""
    
    # 로그 디렉터리 생성
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # 로깅 포맷 설정
    log_format = "%(asctime)s [%(levelname)-5.5s] [%(name)s] %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    from logging.handlers import TimedRotatingFileHandler

    # 일별 분할, 30일 지난 파일 자동 삭제
    langcon_handler = TimedRotatingFileHandler(
        "logs/langcon.log", when="midnight", interval=1, backupCount=30, encoding="utf-8"
    )
    error_handler = TimedRotatingFileHandler(
        "logs/error.log", when="midnight", interval=1, backupCount=30, encoding="utf-8"
    )

    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            langcon_handler,
            error_handler
        ]
    )
    
    # 특정 로거 레벨 설정
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARN)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    # 애플리케이션 로거
    logger = logging.getLogger("langcon")
    logger.setLevel(logging.INFO)
    
    return logger

# 애플리케이션 전역 로거
app_logger = setup_logging()