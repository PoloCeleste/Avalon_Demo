from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from ..schemas.user import UserCreate, UserLogin
from ..schemas.auth import TokenResponse, LoginResponse, PasswordReset, ForgotPasswordRequest, ConfirmPasswordReset
from ..services.auth_service import AuthService
from ..core.database import get_db
from ..core.security import get_current_user_id, verify_token, create_access_token, create_refresh_token

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_USER = {
    "user_id": 1,
    "username": "demo",
    "name": "데모 관리자",
    "email": "demo@avalon.com",
    "role": "admin",
    "branch_id": 1,
    "branch_name": "본점",
    "status": "ACTIVE"
}

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: UserLogin,
    response: Response,
):
    """로그인 - 데모 버전 (하드코딩)"""
    # 데모 계정 체크
    if login_data.username == "demo" and login_data.password == "demo123":
        # 토큰 생성
        access_token = create_access_token({"sub": str(DEMO_USER["user_id"])})
        refresh_token = create_refresh_token({"sub": str(DEMO_USER["user_id"])})
        
        # 쿠키 설정
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # 데모용
            samesite="lax",
            max_age=7 * 24 * 60 * 60
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=DEMO_USER["user_id"],
            username=DEMO_USER["username"],
            role=DEMO_USER["role"],
            status=DEMO_USER["status"]
        )
    
    # 잘못된 인증 정보
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="데모 계정은 demo / demo123 입니다."
    )

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
):
    """비밀번호 재설정 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )

@router.post("/logout")
async def logout(
    response: Response,
):
    """로그아웃 - 데모 버전"""
    response.delete_cookie(key="refresh_token")
    return {"message": "로그아웃 성공"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
):
    """토큰 갱신 - 데모 버전"""
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found.")
    
    try:
        payload = verify_token(refresh_token_value)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    # 새 토큰 발급
    new_access_token = create_access_token({"sub": str(user_id)})
    new_refresh_token = create_refresh_token({"sub": str(user_id)})
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer"
    )

@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
):
    """비밀번호 찾기 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )

@router.post("/confirm-reset-password")
async def confirm_reset_password(
    confirm_data: ConfirmPasswordReset,
):
    """비밀번호 재설정 확인 - 데모 비활성화"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="데모 버전에서는 지원하지 않습니다."
    )