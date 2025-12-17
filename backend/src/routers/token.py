from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.token import TokenCreate, TokenResponse, TokenCreateResponse, TokenListResponse
from src.schemas.common import Response
from src.services.token import TokenService
from src.models.user import User
from src.utils.dependency import get_current_user

router = APIRouter(prefix="/api", tags=["Token管理"])

@router.get("/tokens", response_model=Response[TokenListResponse])
async def get_tokens(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的Token列表（隐藏实际Token值）"""
    try:
        tokens = TokenService.get_tokens(db, current_user.id)
        return Response(
            code=0,
            message="获取成功",
            data=tokens
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/tokens", response_model=Response[TokenCreateResponse])
async def create_token(
    token_data: TokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新的外部Token（仅创建时返回完整Token）"""
    try:
        token = TokenService.create_token(db, current_user.id, token_data.name)
        return Response(
            code=0,
            message="创建成功",
            data=token
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.delete("/tokens/{token_id}", response_model=Response)
async def delete_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除指定Token"""
    try:
        TokenService.delete_token(db, current_user.id, token_id)
        return Response(
            code=0,
            message="删除成功",
            data={"id": token_id}
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )
