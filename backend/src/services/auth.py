from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.models.user import User
from src.schemas.auth import UserCreate, UserLogin, LoginResponse
from src.utils.auth import verify_password, get_password_hash, create_access_token

class AuthService:
    @staticmethod
    def register(db: Session, user_data: UserCreate) -> User:
        """用户注册"""
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 创建新用户
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def login(db: Session, login_data: UserLogin) -> LoginResponse:
        """用户登录"""
        # 查找用户
        user = db.query(User).filter(User.username == login_data.username).first()
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        # 创建访问令牌
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return LoginResponse(
            user=user,
            access_token=access_token
        )
    
    @staticmethod
    def get_current_user(db: Session, user_id: int) -> User:
        """获取当前用户"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        return user
