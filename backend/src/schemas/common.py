from pydantic import BaseModel
from typing import Any, Optional, Generic, TypeVar

T = TypeVar('T')

class Pagination(BaseModel):
    """统一分页响应模型"""
    page: int
    page_size: int
    total: int
    total_pages: int

class Response(BaseModel, Generic[T]):
    """统一响应模型"""
    code: int = 0
    message: str = "success"
    data: Optional[T] = None
    pagination: Optional[Pagination] = None
