from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator
from .config import settings

# 데모 모드: 비동기 SQLite 드라이버 사용 (aiosqlite)
# 본운영: MySQL 사용
if settings.database_url.startswith("sqlite"):
    database_url = f"{settings.database_url}+aiosqlite"
else:
    database_url = settings.database_url

try:
    engine = create_async_engine(
        database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=settings.debug,
        pool_size=18,
        max_overflow=50,
        connect_args={
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            "autocommit": True
        } if not settings.database_url.startswith("sqlite") else {}
    )
except Exception as e:
    print(f"Warning: Database engine initialization failed: {e}")
    engine = None

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession) if engine else None

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """비동기 데이터베이스 세션 의존성"""
    if AsyncSessionLocal is None:
        return
    async with AsyncSessionLocal() as session:
        yield session

async def create_tables():
    """비동기 테이블 생성"""
    if engine is None:
        return
    from ..models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
