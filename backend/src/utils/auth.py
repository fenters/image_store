from datetime import datetime, timedelta
from jose import JWTError, jwt
from src.config import settings
from fastapi import HTTPException, status
from typing import Optional
import hashlib
import bcrypt


def _process_password(password: str) -> bytes:
    """处理密码，确保符合bcrypt要求"""
    # 先将密码转换为字节，再计算SHA-512哈希
    password_bytes = password.encode('utf-8')
    # 使用SHA-512生成固定长度的哈希值
    sha512_hash = hashlib.sha512(password_bytes).hexdigest()
    # 将哈希结果转换为字节，用于bcrypt
    return sha512_hash.encode('utf-8')[:60]  # 限制为60字节，确保远小于bcrypt的72字节限制


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        # 处理密码，确保和哈希时使用相同的逻辑
        processed_password = _process_password(plain_password)
        # 直接使用bcrypt库验证
        return bcrypt.checkpw(processed_password, hashed_password.encode('utf-8'))
    except Exception as e:
        # 记录错误并返回False
        print(f"密码验证错误: {e}")
        return False


def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    try:
        # 处理密码，确保和验证时使用相同的逻辑
        processed_password = _process_password(password)
        # 生成盐值并创建哈希
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(processed_password, salt)
        # 转换为字符串返回
        return hashed.decode('utf-8')
    except Exception as e:
        # 记录错误并抛出异常
        print(f"密码哈希生成错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码处理失败"
        ) from e

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """解码访问令牌"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_external_token() -> str:
    """生成外部访问令牌"""
    # 使用更强的随机数生成
    import secrets
    return secrets.token_urlsafe(32)
