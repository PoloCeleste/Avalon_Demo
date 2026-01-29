from datetime import datetime, timedelta, timezone
import pytz
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from .logging import app_logger

# 패스워드 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer 토큰
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(pytz.utc) + expires_delta
    else:
        expire = datetime.now(pytz.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(data: dict):
    """리프레시 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.now(pytz.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_password_reset_token(data: dict, expires_delta: Optional[timedelta] = None):
    """비밀번호 재설정 토큰 생성 (5분후 만료)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(pytz.utc) + expires_delta
    else:
        # 5분 유효기간
        expire = datetime.now(pytz.utc) + timedelta(minutes=5)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str):
    """토큰 검증"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            app_logger.warning("Token verification failed: 'sub' claim missing.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        app_logger.info(f"Token verified for user ID: {user_id}")
        return payload
    except JWTError as e:
        app_logger.error(f"JWTError during token verification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        app_logger.error(f"Unexpected error during token verification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token verification"
        )

async def get_current_user_id(request: Request):
    """현재 사용자 ID 가져오기"""
    
    try:
        token = request.cookies.get("access_token")
        if not token:
            app_logger.warning("Access token not found in cookies.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token not found.")
        app_logger.info(f"Attempting to get current user ID from token: {token[:30]}...")
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            app_logger.warning("get_current_user_id failed: 'sub' claim missing after verification.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        app_logger.info(f"Successfully extracted user ID {user_id} from token.")
        return int(user_id)
    except HTTPException:
        raise # Re-raise FastAPI HTTPExceptions
    except Exception as e:
        app_logger.error(f"Error in get_current_user_id: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during user ID retrieval")

async def get_current_user(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(lambda: None)  # 이후 dependency injection으로 수정
):
    """현재 사용자 정보 가져오기 - 이 함수는 사용자 API에서 재정의됩니다"""
    pass