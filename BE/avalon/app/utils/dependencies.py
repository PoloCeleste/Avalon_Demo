from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..core.database import get_db
from ..core.security import get_current_user_id
from ..models import User
from ..models.user import UserStatus, UserRole
from ..core.logging import app_logger

async def get_current_user(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    try:
        result = await db.execute(select(User).where(User.user_id == current_user_id))
        user = result.scalar_one_or_none()
        if not user:
            app_logger.error(f"[Dependency] User with ID {current_user_id} not found.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        if user.status != UserStatus.ACTIVE:
            app_logger.error(f"[Dependency] User {user.username} (ID: {current_user_id}) is not active. Status: {user.status.value}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not active")

        app_logger.info(f"[Dependency] User {user.username} (ID: {current_user_id}) successfully retrieved.")
        return user
    except HTTPException:
        raise # Re-raise FastAPI HTTPExceptions
    except Exception as e:
        app_logger.error(f"[Dependency] Error in get_current_user for ID {current_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during user retrieval")

# New Role-based Dependencies
def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            app_logger.warning(f"[Dependency] User {current_user.username} (Role: {current_user.role.value}) attempted super admin action without privilege.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin privileges required")
        app_logger.info(f"[Dependency] User {current_user.username} has super admin privilege.")
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"[Dependency] Error in require_super_admin for user {current_user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during privilege check")

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    try:
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            app_logger.warning(f"[Dependency] User {current_user.username} (Role: {current_user.role.value}) attempted admin action without privilege.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
        app_logger.info(f"[Dependency] User {current_user.username} has admin privilege.")
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"[Dependency] Error in require_admin for user {current_user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during privilege check")

def require_manager_or_higher(current_user: User = Depends(get_current_user)) -> User:
    try:
        allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        if current_user.role not in allowed_roles:
            app_logger.warning(f"[Dependency] User {current_user.username} (Role: {current_user.role.value}) attempted manager+ action without privilege.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager privileges or higher required")
        app_logger.info(f"[Dependency] User {current_user.username} has manager+ privilege.")
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"[Dependency] Error in require_manager_or_higher for user {current_user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during privilege check")

def require_teacher_or_higher(current_user: User = Depends(get_current_user)) -> User:
    try:
        allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER]
        if current_user.role not in allowed_roles:
            app_logger.warning(f"[Dependency] User {current_user.username} (Role: {current_user.role.value}) attempted teacher+ action without privilege.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher privileges or higher required")
        app_logger.info(f"[Dependency] User {current_user.username} has teacher+ privilege.")
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"[Dependency] Error in require_teacher_or_higher for user {current_user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during privilege check")
