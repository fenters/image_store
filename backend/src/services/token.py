from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.models.token import Token
from src.models.user import User
from src.schemas.token import TokenCreate, TokenResponse, TokenCreateResponse, TokenListResponse
from src.utils.auth import generate_external_token, get_password_hash

class TokenService:
    @staticmethod
    def create_token(db: Session, user_id: int, token_name: str) -> TokenCreateResponse:
        """创建新的外部Token"""
        # 生成唯一的Token
        external_token = generate_external_token()
        hashed_token = get_password_hash(external_token)  # 使用密码哈希存储Token
        
        # 创建Token记录
        db_token = Token(
            user_id=user_id,
            name=token_name,
            token=hashed_token
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        # 返回包含实际Token的响应
        return TokenCreateResponse(
            id=db_token.id,
            name=db_token.name,
            created_at=db_token.created_at,
            token=external_token  # 仅在创建时返回完整Token
        )
    
    @staticmethod
    def get_tokens(db: Session, user_id: int) -> TokenListResponse:
        """获取用户的Token列表（隐藏实际Token值）"""
        tokens = db.query(Token).filter(Token.user_id == user_id).all()
        
        # 转换为响应模型，不包含实际Token值
        token_responses = [
            TokenResponse(
                id=token.id,
                name=token.name,
                created_at=token.created_at
            )
            for token in tokens
        ]
        
        return TokenListResponse(
            tokens=token_responses,
            total=len(token_responses)
        )
    
    @staticmethod
    def delete_token(db: Session, user_id: int, token_id: int) -> bool:
        """删除Token"""
        # 查找Token
        token = db.query(Token).filter(
            Token.id == token_id,
            Token.user_id == user_id
        ).first()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token不存在"
            )
        
        # 删除Token
        db.delete(token)
        db.commit()
        
        return True
    
    @staticmethod
    def verify_token(db: Session, token: str) -> User:
        """验证外部Token"""
        from src.utils.auth import verify_password
        
        # 查找匹配的Token
        all_tokens = db.query(Token).all()
        for db_token in all_tokens:
            if verify_password(token, db_token.token):
                # 查找关联用户
                user = db.query(User).filter(User.id == db_token.user_id).first()
                if user:
                    return user
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的Token"
        )
