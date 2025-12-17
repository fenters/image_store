from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.image import (
    ImageResponse, ImageQueryParams, BatchDeleteRequest, 
    BatchDeleteResponse, UploadResponse, ChunkInitRequest,
    ChunkInitResponse, ChunkUploadRequest, ChunkUploadResponse
)
from src.schemas.common import Response, Pagination
from src.services.image import ImageService
from src.models.user import User
from src.utils.dependency import get_current_user

router = APIRouter(prefix="/api", tags=["图片管理"])

@router.get("/images", response_model=Response[List[ImageResponse]])
async def get_images(
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
    """查询图片列表（支持多条件过滤、分页）"""
    try:
        # 构建查询参数
        query_params = ImageQueryParams(
            page=page,
            page_size=page_size,
            name_like=name_like,
            start_date=start_date,
            end_date=end_date,
            sort_by=sort_by,
            order=order
        )
        
        # 查询图片
        result = ImageService.get_images(db, current_user, query_params)
        
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
            data=result["images"],
            pagination=pagination
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/images", response_model=Response[UploadResponse])
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传图片（支持批量上传）"""
    try:
        # 解析表单数据获取nicnames
        form_data = await request.form()
        nicnames = form_data.getlist("nicnames")
        result = await ImageService.upload_images(db, current_user, files, nicnames if nicnames else None)
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

@router.delete("/images/{image_id}", response_model=Response)
async def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除单张图片"""
    try:
        ImageService.delete_image(db, current_user, image_id)
        return Response(
            code=0,
            message="删除成功",
            data={"id": image_id}
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )

@router.post("/images/batch-delete", response_model=Response[BatchDeleteResponse])
async def batch_delete_images(
    delete_request: BatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量删除图片"""
    try:
        result = ImageService.batch_delete_images(db, current_user, delete_request)
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


@router.post("/images/chunk/init", response_model=Response[ChunkInitResponse])
async def init_chunk_upload(
    request: ChunkInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """初始化切片上传"""
    try:
        result = await ImageService.init_chunk_upload(db, current_user, request)
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


@router.post("/images/chunk/upload", response_model=Response[ChunkUploadResponse])
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
        result = await ImageService.upload_chunk(db, current_user, upload_id, chunk_index, file)
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


@router.post("/images/chunk/merge/{upload_id}", response_model=Response[UploadResponse])
async def merge_chunks(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """合并所有切片并完成上传"""
    try:
        result = await ImageService.merge_chunks(db, current_user, upload_id)
        return Response(
            code=0,
            message="图片上传成功",
            data=result
        )
    except HTTPException as e:
        return Response(
            code=e.status_code,
            message=e.detail,
            data=None
        )
