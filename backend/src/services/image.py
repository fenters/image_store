from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime
from typing import List, Optional
from src.models.image import Image, ChunkUpload
from src.models.user import User
from src.schemas.image import (
    ImageResponse, ImageQueryParams, BatchDeleteRequest, BatchDeleteResponse, UploadResponse,
    ChunkInitRequest, ChunkInitResponse, ChunkUploadResponse, ChunkUploadRequest
)
from src.utils.file import (
    save_file, delete_file, generate_image_urls, clear_empty_user_dir,
    init_chunk_upload, save_chunk, merge_chunks, cleanup_chunk_upload, get_chunk_upload_status
)
from src.utils.gitee import upload_to_gitee
from src.config import settings

class ImageService:
    @staticmethod
    async def upload_images(db: Session, user: User, files: List[UploadFile], nicnames: Optional[List[str]] = None) -> UploadResponse:
        """上传图片（支持批量）"""
        uploaded_images = []
        failed_count = 0
        
        for i, file in enumerate(files):
            try:
                # 获取当前文件的nicname，如果没有提供则使用None
                nicname = nicnames[i] if nicnames and i < len(nicnames) else None
                
                # 保存文件到本地
                file_path, url = await save_file(file, user.username)
                
                # 生成不同格式的图片地址
                urls = generate_image_urls(file.filename, url)
                
                # 上传到Gitee（如果配置了）
                gitee_url = None
                if settings.GITEE_ACCESS_TOKEN:
                    gitee_url = await upload_to_gitee(file_path, file_path.split('/')[-1])
                
                # 创建图片记录，直接使用原始nicname
                db_image = Image(
                    user_id=user.id,
                    filename=file.filename,
                    nicname=nicname,
                    path=file_path,
                    url=urls["url"],
                    markdown=urls["markdown"],
                    html=urls["html"],
                    gitee_url=gitee_url
                )
                
                db.add(db_image)
                db.commit()
                db.refresh(db_image)
                
                uploaded_images.append(db_image)
            except Exception as e:
                print(f"上传图片失败: {str(e)}")
                failed_count += 1
        
        # 转换为响应模型
        image_responses = [
            ImageResponse.model_validate(image) for image in uploaded_images
        ]
        
        return UploadResponse(
            uploaded=len(uploaded_images),
            failed=failed_count,
            images=image_responses
        )
    
    @staticmethod
    def get_images(db: Session, user: User, query_params: ImageQueryParams) -> dict:
        """查询图片列表（支持多条件过滤、分页）"""
        # 构建查询
        query = db.query(Image).filter(Image.user_id == user.id)
        
        # 时间范围过滤
        if query_params.start_date:
            query = query.filter(Image.created_at >= query_params.start_date)
        if query_params.end_date:
            query = query.filter(Image.created_at <= query_params.end_date)
        
        # 名称模糊查询
        if query_params.name_like:
            query = query.filter(
                or_(
                    Image.filename.ilike(f"%{query_params.name_like}%"),
                    Image.nicname.ilike(f"%{query_params.name_like}%")
                )
            )
        
        # 排序
        if query_params.order == "asc":
            query = query.order_by(getattr(Image, query_params.sort_by).asc())
        else:
            query = query.order_by(getattr(Image, query_params.sort_by).desc())
        
        # 分页
        total = query.count()
        images = query.offset((query_params.page - 1) * query_params.page_size).limit(query_params.page_size).all()
        
        # 计算总页数
        total_pages = (total + query_params.page_size - 1) // query_params.page_size
        
        # 转换为响应模型
        image_responses = [
            ImageResponse.model_validate(image) for image in images
        ]
        
        return {
            "images": image_responses,
            "total": total,
            "page": query_params.page,
            "page_size": query_params.page_size,
            "total_pages": total_pages
        }
    
    @staticmethod
    def delete_image(db: Session, user: User, image_id: int) -> bool:
        """删除单张图片"""
        # 查找图片
        image = db.query(Image).filter(
            Image.id == image_id,
            Image.user_id == user.id
        ).first()
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图片不存在"
            )
        
        # 删除本地文件
        delete_file(image.path)
        
        # 删除数据库记录
        db.delete(image)
        db.commit()
        
        # 清理空用户目录
        clear_empty_user_dir(user.username)
        
        return True
    
    @staticmethod
    def batch_delete_images(db: Session, user: User, delete_request: BatchDeleteRequest) -> BatchDeleteResponse:
        """批量删除图片"""
        deleted_count = 0
        failed_count = 0
        
        for image_id in delete_request.image_ids:
            try:
                # 查找图片
                image = db.query(Image).filter(
                    Image.id == image_id,
                    Image.user_id == user.id
                ).first()
                
                if image:
                    # 删除本地文件
                    delete_file(image.path)
                    
                    # 删除数据库记录
                    db.delete(image)
                    deleted_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"批量删除图片失败: {str(e)}")
                failed_count += 1
        
        # 提交事务
        db.commit()
        
        # 清理空用户目录
        clear_empty_user_dir(user.username)
        
        return BatchDeleteResponse(
            deleted=deleted_count,
            failed=failed_count
        )
    
    @staticmethod
    async def init_chunk_upload(db: Session, user: User, request: ChunkInitRequest) -> ChunkInitResponse:
        """初始化切片上传"""
        # 验证文件类型
        if "." not in request.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件名必须包含扩展名"
            )
        file_extension = request.filename.split(".")[-1].lower()
        if file_extension not in settings.allowed_file_types_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型，允许的类型：{', '.join(settings.allowed_file_types_list)}"
            )
        
        # 初始化切片上传
        upload_id, temp_path = await init_chunk_upload(
            username=user.username,
            filename=request.filename,
            file_size=request.file_size,
            total_chunks=request.total_chunks
        )
        
        # 创建切片上传记录
        chunk_upload = ChunkUpload(
            upload_id=upload_id,
            user_id=user.id,
            filename=request.filename,
            nicname=request.nicname,  # 保存nicname
            file_extension=file_extension,
            total_chunks=request.total_chunks,
            uploaded_chunks=0,
            file_size=request.file_size,
            temp_path=temp_path
        )
        
        db.add(chunk_upload)
        db.commit()
        db.refresh(chunk_upload)
        
        return ChunkInitResponse(
            upload_id=upload_id,
            chunk_size=settings.CHUNK_SIZE,
            total_chunks=request.total_chunks,
            message="切片上传初始化成功"
        )
    
    @staticmethod
    async def upload_chunk(db: Session, user: User, upload_id: str, chunk_index: int, file: UploadFile) -> ChunkUploadResponse:
        """上传单个切片"""
        # 查找上传会话
        chunk_upload = db.query(ChunkUpload).filter(
            ChunkUpload.upload_id == upload_id,
            ChunkUpload.user_id == user.id
        ).first()
        
        if not chunk_upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="上传会话不存在"
            )
        
        # 验证切片索引
        if chunk_index < 0 or chunk_index >= chunk_upload.total_chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的切片索引，必须在0-{chunk_upload.total_chunks-1}范围内"
            )
        
        # 保存切片
        await save_chunk(upload_id, chunk_index, file)
        
        # 更新已上传切片数
        chunk_upload.uploaded_chunks = await get_chunk_upload_status(upload_id, chunk_upload.total_chunks)
        db.commit()
        
        # 检查是否所有切片都已上传
        is_completed = chunk_upload.uploaded_chunks == chunk_upload.total_chunks
        
        return ChunkUploadResponse(
            upload_id=upload_id,
            chunk_index=chunk_index,
            uploaded_chunks=chunk_upload.uploaded_chunks,
            total_chunks=chunk_upload.total_chunks,
            is_completed=is_completed,
            message="切片上传成功"
        )
    
    @staticmethod
    async def merge_chunks(db: Session, user: User, upload_id: str) -> UploadResponse:
        """合并切片并完成上传"""
        # 查找上传会话
        chunk_upload = db.query(ChunkUpload).filter(
            ChunkUpload.upload_id == upload_id,
            ChunkUpload.user_id == user.id
        ).first()
        
        if not chunk_upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="上传会话不存在"
            )
        
        # 检查是否所有切片都已上传
        chunk_upload.uploaded_chunks = await get_chunk_upload_status(upload_id, chunk_upload.total_chunks)
        if chunk_upload.uploaded_chunks != chunk_upload.total_chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"还有 {chunk_upload.total_chunks - chunk_upload.uploaded_chunks} 个切片未上传"
            )
        
        # 合并切片，传递nicname参数
        file_path, url = await merge_chunks(
            upload_id=upload_id,
            username=user.username,
            filename=chunk_upload.filename,
            total_chunks=chunk_upload.total_chunks,
        )
        
        # 生成不同格式的图片地址
        urls = generate_image_urls(chunk_upload.filename, url)
        
        # 上传到Gitee（如果配置了）
        gitee_url = None
        if settings.GITEE_ACCESS_TOKEN:
            gitee_url = await upload_to_gitee(file_path, file_path.split('/')[-1])
        
        # 创建图片记录，直接使用从merge_chunks返回的原始nicname
        db_image = Image(
            user_id=user.id,
            filename=chunk_upload.filename,
            nicname=chunk_upload.nicname,
            path=file_path,
            url=urls["url"],
            markdown=urls["markdown"],
            html=urls["html"],
            gitee_url=gitee_url
        )
        
        db.add(db_image)
        
        # 删除切片上传记录
        db.delete(chunk_upload)
        
        # 提交事务
        db.commit()
        db.refresh(db_image)
        
        # 清理临时文件
        await cleanup_chunk_upload(upload_id)
        
        # 转换为响应模型
        image_response = ImageResponse.model_validate(db_image)
        
        return UploadResponse(
            uploaded=1,
            failed=0,
            images=[image_response]
        )
