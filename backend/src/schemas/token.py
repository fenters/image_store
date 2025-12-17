from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TokenCreate(BaseModel):
    name: str

class TokenResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenCreateResponse(TokenResponse):
    token: str  # 仅在创建时返回完整Token

class TokenListResponse(BaseModel):
    tokens: list[TokenResponse]
    total: int
