from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.auth import UserCreate, UserLogin, LoginResponse, UserResponse
from src.schemas.common import Response
from src.services.auth import AuthService

router = APIRouter(prefix="/api", tags=["认证"])

@router.post("/auth/register", response_model=Response[UserResponse])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    try:
        user = AuthService.register(db, user_data)
        return Response(
            code=0,
            message="注册成功",
            data=UserResponse.model_validate(user)
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/auth/login", response_model=Response[LoginResponse])
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        login_result = AuthService.login(db, login_data)
        return Response(
            code=0,
            message="登录成功",
            data=login_result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )
