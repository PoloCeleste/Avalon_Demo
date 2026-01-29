from fastapi import HTTPException, status
from sqlalchemy import select
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Optional
from fastapi import Response

from ..models import User, UserStatus
from ..schemas.user import UserCreate, UserLogin
from ..schemas.auth import TokenResponse, LoginResponse, PasswordReset, ForgotPasswordRequest, ConfirmPasswordReset
from ..core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token, create_password_reset_token
from ..core.config import settings
from ..utils.redis_client import redis_client
from ..utils.email_utils import send_password_reset_email

class AuthService:
    def __init__(self, db: Optional['AsyncSession'] = None):
        self.db = db

    

    async def login(self, login_data: UserLogin, response: Response) -> LoginResponse:
        """로그인"""
        # 사용자 조회 (상태와 무관하게 username으로 먼저 조회)
        result = await self.db.execute(select(User).where(User.username == login_data.username))
        user = result.scalars().first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # INACTIVE 상태인 경우 (비밀번호 재설정 필요)
        if user.status == UserStatus.INACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please reset your password to activate."
            )
            
        # ACTIVE 상태가 아닌 다른 상태 (SUSPENDED, DELETED 등)인 경우
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active."
            )
        
        # 토큰 생성
        access_token = create_access_token({"sub": str(user.user_id)})
        refresh_token = create_refresh_token({"sub": str(user.user_id)})
        
        # Redis에 리프레시 토큰 저장
        await redis_client.set_refresh_token(user.user_id, refresh_token, settings.refresh_token_expire_days)
        
        # HttpOnly 쿠키 설정
        response.set_cookie(
            key="access_token", 
            value=access_token, 
            httponly=True, 
            secure=settings.cookie_secure, 
            samesite=settings.cookie_samesite, 
            domain=settings.cookie_domain or None,
            path="/",
            max_age=settings.access_token_expire_minutes * 60
        )
        response.set_cookie(
            key="refresh_token", 
            value=refresh_token, 
            httponly=True, 
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain or None,
            path="/",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60 # 리프레시 토큰 만료 시간
        )
        
        return LoginResponse(
            user_id=user.user_id,
            username=user.username,
            role=user.role.value
        )

    async def logout(self, user_id: int, response: Response):
        """로그아웃"""
        # Redis에서 리프레시 토큰 삭제
        await redis_client.delete_refresh_token(user_id)
        
        # HttpOnly 쿠키 삭제 (생성 시와 동일한 옵션 사용)
        cookie_args = {
            "domain": settings.cookie_domain or None,
            "path": "/",
            "httponly": True,
            "secure": settings.cookie_secure,
            "samesite": settings.cookie_samesite
        }
        response.delete_cookie(key="access_token", **cookie_args)
        response.delete_cookie(key="refresh_token", **cookie_args)
        
        return {"message": "Successfully logged out"}

    async def reset_password_and_activate(self, reset_data: PasswordReset):
        """비밀번호를 재설정하고 계정을 활성화합니다."""
        result = await self.db.execute(
            select(User).where(User.username == reset_data.username, User.status == UserStatus.INACTIVE)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(reset_data.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or current password"
            )

        if user.status != UserStatus.INACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is already active or in a different state."
            )

        # 새 비밀번호 해싱 및 업데이트
        user.password_hash = get_password_hash(reset_data.new_password)
        # 계정 활성화
        user.status = UserStatus.ACTIVE
        await self.db.commit()
        return {"message": "Password has been reset successfully. You can now log in."}

    async def refresh_token(self, user_id: int, old_refresh_token: str, response: Response) -> TokenResponse:
        """토큰 갱신"""
        # 리프레시 토큰 검증
        try:
            payload = verify_token(old_refresh_token)
            user_id = int(payload.get("sub"))
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Redis에서 토큰 확인
        if not await redis_client.is_token_valid(user_id, old_refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found or expired"
            )
        
        # 새 토큰 생성
        new_access_token = create_access_token({"sub": str(user_id)})
        new_refresh_token = create_refresh_token({"sub": str(user_id)})
        
        # Redis 업데이트
        await redis_client.set_refresh_token(user_id, new_refresh_token, settings.refresh_token_expire_days)
        
        # HttpOnly 쿠키 설정
        response.set_cookie(
            key="access_token", 
            value=new_access_token, 
            httponly=True, 
            secure=settings.cookie_secure, 
            samesite=settings.cookie_samesite, 
            domain=settings.cookie_domain or None,
            path="/",
            max_age=settings.access_token_expire_minutes * 60
        )
        response.set_cookie(
            key="refresh_token", 
            value=new_refresh_token, 
            httponly=True, 
            secure=settings.cookie_secure, 
            samesite=settings.cookie_samesite, 
            domain=settings.cookie_domain or None,
            path="/",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60
        )
        
        return TokenResponse(
            expires_in=settings.access_token_expire_minutes * 60
        )

    async def request_password_reset(self, request_data: ForgotPasswordRequest):
        result = await self.db.execute(
            select(User).where(User.username == request_data.username, User.email == request_data.email)
        )
        user = result.scalar_one_or_none()
        
        if not user or user.status != UserStatus.ACTIVE:
            # 보안을 위해 사용자가 존재하지 않거나 ACTIVE 상태가 아니어도 성공한 것처럼 응답
            return {"message": "If a matching active account was found, a password reset email has been sent."} 
        
        # 비밀번호 재설정 토큰 생성 (유효기간 짧게)
        reset_token = create_password_reset_token({"sub": str(user.user_id), "purpose": "password_reset"})
        reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
        
        # 이메일 발송
        await send_password_reset_email(user.email, user.username, reset_link)
        
        return {"message": "If a matching active account was found, a password reset email has been sent."} 

    async def confirm_password_reset(self, confirm_data: ConfirmPasswordReset):
        try:
            payload = verify_token(confirm_data.token)
            user_id = int(payload.get("sub"))
            purpose = payload.get("purpose")
            
            if purpose != "password_reset":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token purpose.")
            
            result = await self.db.execute(
                select(User).where(User.user_id == user_id)
            )
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
            
            # 비밀번호 업데이트
            user.password_hash = get_password_hash(confirm_data.new_password)
            user.status = UserStatus.ACTIVE # 비밀번호 재설정 시 계정 활성화
            self.db.commit()
            
            return {"message": "Password has been reset successfully."}
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")
        except HTTPException:
            raise
        except Exception as e:
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal server error during password reset confirmation: {e}"
            )