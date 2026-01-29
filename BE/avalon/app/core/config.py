import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# 이 파일(config.py)의 위치를 기준으로 프로젝트 루트 경로를 계산
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# .env 파일 경로를 명시적으로 결정
env_state = os.getenv("ENV_STATE", "development")
env_file_path = BASE_DIR / f".env.{env_state}"

class Settings(BaseSettings):
    # App
    app_name: str = "langcon"
    debug: bool = False
    server_port: int = 8000
    
    # Database (Demo mode - optional)
    database_url: str = "sqlite:///demo.db"
    
    # Redis (Demo mode - optional)
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    secret_key: str = "demo-secret-key-for-portfolio"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    refresh_token_expire_days: int = 30
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Mail Server
    mail_server: str = "localhost"
    mail_port: int = 25
    mail_use_tls: bool = False
    mail_username: Optional[str] = None
    mail_password: Optional[str] = None
    mail_from: str = "noreply@manageschool.co.kr"
    frontend_url: str = "https://www.manageschool.co.kr"
    service_key: str = "demo-service-key"

    # Cookie Settings
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=env_file_path, extra="ignore")

settings = Settings()