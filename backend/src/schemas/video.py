from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class VideoResponse(BaseModel):
    id: int
    filename: str
    nicname: str
    url: str
    markdown: str
    html: str
    gitee_url: Optional[str] = None
    cover_url: str
    duration: int
    width: int
    height: int
    size: int
    mime_type: str
    resolution: str
    bitrate: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class VideoQueryParams(BaseModel):
    page: int = 1
    page_size: int = 20
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    name_like: Optional[str] = None
    sort_by: str = "created_at"
    order: str = "desc"

class VideoBatchDeleteRequest(BaseModel):
    video_ids: List[int]

class VideoBatchDeleteResponse(BaseModel):
    deleted: int
    failed: int

class VideoUploadResponse(BaseModel):
    uploaded: int
    failed: int
    videos: List[VideoResponse]

class UploadResponse(BaseModel):
    uploaded: int
    failed: int
    images: List[VideoResponse] = []
    videos: List[VideoResponse] = []

class ChunkInitRequest(BaseModel):
    """初始化切片上传请求"""
    filename: str = Field(..., description="原始文件名")
    file_size: int = Field(..., description="文件总大小（字节）")
    total_chunks: int = Field(..., description="总分片数")
    nicname: Optional[str] = Field(None, description="文件昵称，为空则使用原始文件名")
    is_video: Optional[bool] = Field(False, description="是否为视频文件")

class ChunkUploadRequest(BaseModel):
    """上传分片请求"""
    upload_id: str = Field(..., description="上传ID")
    chunk_index: int = Field(..., description="分片索引")

class ChunkUploadResponse(BaseModel):
    """分片上传响应"""
    upload_id: str
    chunk_index: int
    status: str
    message: Optional[str] = None
