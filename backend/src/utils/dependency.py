from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.common import Response
from src.services.auth import AuthService
from src.services.token import TokenService
from .auth import decode_access_token

# OAuth2密码Bearer模式
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """获取当前用户（支持用户登录Token和外部Token）"""
    try:
        # 尝试解析为用户登录Token
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
        user = AuthService.get_current_user(db, user_id)
        return user
    except Exception as e:
        # 尝试解析为外部Token
        try:
            user = TokenService.verify_token(db, token)
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证信息",
                headers={"WWW-Authenticate": "Bearer"},
            )
