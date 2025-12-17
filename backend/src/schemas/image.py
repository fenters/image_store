from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ImageResponse(BaseModel):
    id: int
    filename: str
    nicname: str
    url: str
    markdown: str
    html: str
    gitee_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ImageQueryParams(BaseModel):
    page: int = 1
    page_size: int = 20
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    name_like: Optional[str] = None
    sort_by: str = "created_at"
    order: str = "desc"

class BatchDeleteRequest(BaseModel):
    image_ids: List[int]

class BatchDeleteResponse(BaseModel):
    deleted: int
    failed: int

class UploadResponse(BaseModel):
    uploaded: int
    failed: int
    images: List[ImageResponse]


class ChunkInitRequest(BaseModel):
    """初始化切片上传请求"""
    filename: str = Field(..., description="原始文件名")
    file_size: int = Field(..., description="文件总大小（字节）")
    total_chunks: int = Field(..., description="总分片数")
    nicname: Optional[str] = Field(None, description="图片昵称，为空则使用原始文件名")


class ChunkInitResponse(BaseModel):
    """初始化切片上传响应"""
    upload_id: str = Field(..., description="上传会话ID")
    chunk_size: int = Field(..., description="分片大小（字节）")
    total_chunks: int = Field(..., description="总分片数")
    message: str = Field(..., description="响应消息")


class ChunkUploadRequest(BaseModel):
    """上传单个切片请求"""
    upload_id: str = Field(..., description="上传会话ID")
    chunk_index: int = Field(..., description="当前分片索引（从0开始）")
    total_chunks: int = Field(..., description="总分片数")


class ChunkUploadResponse(BaseModel):
    """上传单个切片响应"""
    upload_id: str = Field(..., description="上传会话ID")
    chunk_index: int = Field(..., description="当前分片索引")
    uploaded_chunks: int = Field(..., description="已上传分片数")
    total_chunks: int = Field(..., description="总分片数")
    is_completed: bool = Field(..., description="是否所有分片都已上传")
    message: str = Field(..., description="响应消息")


class ChunkMergeRequest(BaseModel):
    """合并切片请求"""
    upload_id: str = Field(..., description="上传会话ID")

