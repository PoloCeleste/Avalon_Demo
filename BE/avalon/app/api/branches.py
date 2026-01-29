from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..schemas.branch import BranchCreate, BranchUpdate, BranchResponse
from ..services.branch_service import BranchService
from ..core.database import get_db
from ..utils.dependencies import require_admin, get_current_user, require_manager_or_higher, require_teacher_or_higher
from ..models import User

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
DEMO_BRANCHES = [
    {
        "branch_id": 1,
        "branch_name": "본점",
        "branch_phone": "055-123-4567",
        "branch_address": "경남 창원시 의창구 원이대로 362"
    },
    {
        "branch_id": 2,
        "branch_name": "마산지점",
        "branch_phone": "055-234-5678",
        "branch_address": "경남 창원시 마산합포구 3·15대로 227"
    }
]

@router.get("", response_model=List[BranchResponse])
async def get_all_branches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """지점 목록 조회 - 데모 버전"""
    return DEMO_BRANCHES[skip:skip+limit]

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(branch_id: int):
    """지점 조회 - 데모 버전"""
    branch = next((b for b in DEMO_BRANCHES if b["branch_id"] == branch_id), None)
    if not branch:
        raise HTTPException(status_code=404, detail="지점을 찾을 수 없습니다.")
    return branch

@router.get("", response_model=List[BranchResponse])
async def get_all_branches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """모든 지점 목록 조회 - 데모 버전"""
    return DEMO_BRANCHES[skip:skip+limit]