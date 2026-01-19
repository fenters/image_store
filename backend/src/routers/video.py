from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.video import (
    VideoResponse, VideoQueryParams, VideoBatchDeleteRequest, 
    VideoBatchDeleteResponse, VideoUploadResponse, UploadResponse, ChunkInitRequest
)
from src.schemas.image import ChunkInitResponse, ChunkUploadRequest, ChunkUploadResponse
from src.schemas.common import Response, Pagination
from src.services.video import VideoService
from src.models.user import User
from src.utils.dependency import get_current_user

router = APIRouter(prefix="/api", tags=["视频管理"])

@router.get("/videos", response_model=Response[dict])
async def get_videos(
    page: int = 1,
    page_size: int = 20,
    name_like: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """查询视频列表（支持多条件过滤、分页）"""
    try:
        # 构建查询参数
        query_params = VideoQueryParams(
            page=page,
            page_size=page_size,
            name_like=name_like,
            start_date=start_date,
            end_date=end_date,
            sort_by=sort_by,
            order=order
        )
        
        # 查询视频
        result = VideoService.get_videos(db, current_user, query_params)
        
        # 构建分页信息
        pagination = Pagination(
            page=result["page"],
            page_size=result["page_size"],
            total=result["total"],
            total_pages=result["total_pages"]
        )
        
        return Response(
            code=0,
            message="查询成功",
            data=result,
            pagination=pagination
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/videos", response_model=Response[UploadResponse])
async def upload_videos(
    request: Request,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传视频（支持批量上传）"""
    try:
        # 解析表单数据获取nicnames
        form_data = await request.form()
        nicnames = form_data.getlist("nicnames")
        result = await VideoService.upload_videos(db, current_user, files, nicnames if nicnames else None)
        return Response(
            code=0,
            message="上传成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.delete("/videos/{video_id}", response_model=Response)
async def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除单个视频"""
    try:
        await VideoService.delete_video(db, current_user, video_id)
        return Response(
            code=0,
            message="删除成功",
            data={"id": video_id}
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/videos/batch-delete", response_model=Response[VideoBatchDeleteResponse])
async def batch_delete_videos(
    delete_request: VideoBatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量删除视频"""
    try:
        result = await VideoService.batch_delete_videos(db, current_user, delete_request)
        return Response(
            code=0,
            message="批量删除成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )


@router.post("/videos/chunk/init", response_model=Response[ChunkInitResponse])
async def init_chunk_upload(
    request: ChunkInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """初始化切片上传"""
    try:
        result = await VideoService.init_chunk_upload(db, current_user, request)
        return Response(
            code=0,
            message="初始化切片上传成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )


@router.post("/videos/chunk/upload", response_model=Response[ChunkUploadResponse])
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传单个切片"""
    try:
        result = await VideoService.upload_chunk(db, current_user, upload_id, chunk_index, file)
        return Response(
            code=0,
            message="切片上传成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )


@router.post("/videos/chunk/merge/{upload_id}", response_model=Response[UploadResponse])
async def merge_chunks(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """合并所有切片并完成上传"""
    try:
        result = await VideoService.merge_chunks(db, current_user, upload_id)
        return Response(
            code=0,
            message="视频上传成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.get("/videos/stream/{video_id}")
async def stream_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """视频流播放"""
    from fastapi.responses import StreamingResponse
    import os
    
    try:
        # 查找视频
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video or not os.path.exists(video.path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="视频不存在"
            )
        
        # 获取文件大小
        file_size = os.path.getsize(video.path)
        
        # 读取文件内容并返回流响应
        def iterfile():
            with open(video.path, "rb") as f:
                yield from f
        
        return StreamingResponse(
            iterfile(),
            media_type="video/mp4",
            headers={
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes"
            }
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )
