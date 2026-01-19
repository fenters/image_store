import os
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime
from typing import List, Optional
from src.models.video import Video
from src.models.image import ChunkUpload
from src.models.user import User
from src.schemas.video import (
    VideoResponse, VideoQueryParams, VideoBatchDeleteRequest, VideoBatchDeleteResponse,
    VideoUploadResponse, UploadResponse, ChunkInitRequest, ChunkUploadResponse, ChunkUploadRequest
)
from src.schemas.image import ImageResponse, ChunkInitResponse
from src.utils.file import (
    save_file, delete_file, clear_empty_user_dir,
    init_chunk_upload, save_chunk, merge_chunks, cleanup_chunk_upload, get_chunk_upload_status
)
from src.utils.video import extract_video_metadata, generate_video_cover, generate_video_urls
from src.utils.gitee import upload_to_gitee
from src.config import settings

class VideoService:
    @staticmethod
    def _generate_unique_nicname(db: Session, base_nicname: str) -> str:
        """生成唯一的nicname"""
        # 检查基础nicname是否已存在
        existing = db.query(Video).filter(Video.nicname == base_nicname).first()
        if not existing:
            return base_nicname
        
        # 如果已存在，添加数字后缀直到找到唯一值
        suffix = 1
        while True:
            new_nicname = f"{base_nicname}_{suffix}"
            existing = db.query(Video).filter(Video.nicname == new_nicname).first()
            if not existing:
                return new_nicname
            suffix += 1
    
    @staticmethod
    async def upload_videos(db: Session, user: User, files: List[UploadFile], nicnames: Optional[List[str]] = None) -> UploadResponse:
        """上传视频（支持批量）"""
        uploaded_videos = []
        failed_count = 0
        
        for i, file in enumerate(files):
            try:
                # 获取当前文件的nicname，如果没有提供则使用文件名
                base_nicname = nicnames[i] if nicnames and i < len(nicnames) else os.path.splitext(file.filename)[0]
                # 生成唯一nicname
                nicname = VideoService._generate_unique_nicname(db, base_nicname)
                
                # 保存文件到本地
                file_path, url = await save_file(file, user.username)
                
                # 生成封面路径和URL
                cover_path = file_path.replace(os.path.splitext(file_path)[1], ".jpg")
                cover_url = url.replace(os.path.splitext(url)[1], ".jpg")
                
                # 生成视频封面
                await generate_video_cover(file_path, cover_path)
                
                # 提取视频元数据
                metadata = await extract_video_metadata(file_path)
                if not metadata:
                    metadata = {
                        "width": 0,
                        "height": 0,
                        "duration": 0,
                        "bitrate": 0,
                        "resolution": "0x0"
                    }
                
                # 生成不同格式的视频地址
                urls = generate_video_urls(file.filename, url, cover_url)
                
                # 上传到Gitee（如果配置了）
                gitee_url = None
                if settings.GITEE_ACCESS_TOKEN:
                    gitee_url = await upload_to_gitee(file_path, file_path.split('/')[-1])
                
                # 创建视频记录
                db_video = Video(
                    user_id=user.id,
                    filename=file.filename,
                    nicname=nicname,
                    path=file_path,
                    url=urls["url"],
                    markdown=urls["markdown"],
                    html=urls["html"],
                    gitee_url=gitee_url,
                    cover_path=cover_path,
                    cover_url=cover_url,
                    duration=metadata["duration"],
                    width=metadata["width"],
                    height=metadata["height"],
                    size=os.path.getsize(file_path),
                    mime_type=f"video/{file.filename.split('.')[-1].lower()}",
                    resolution=metadata["resolution"],
                    bitrate=metadata["bitrate"]
                )
                
                db.add(db_video)
                db.commit()
                db.refresh(db_video)
                
                uploaded_videos.append(db_video)
            except Exception as e:
                import traceback
                print(f"上传视频失败: {str(e)}")
                print(f"详细错误信息: {traceback.format_exc()}")
                failed_count += 1
        
        # 转换为响应模型
        video_responses = [
            VideoResponse.model_validate(video) for video in uploaded_videos
        ]
        
        return UploadResponse(
            uploaded=len(uploaded_videos),
            failed=failed_count,
            videos=video_responses
        )
    
    @staticmethod
    def get_videos(db: Session, user: User, query_params: VideoQueryParams) -> dict:
        """查询视频列表（支持多条件过滤、分页）"""
        # 构建查询
        query = db.query(Video).filter(Video.user_id == user.id)
        
        # 时间范围过滤
        if query_params.start_date:
            query = query.filter(Video.created_at >= query_params.start_date)
        if query_params.end_date:
            query = query.filter(Video.created_at <= query_params.end_date)
        
        # 名称模糊查询
        if query_params.name_like:
            query = query.filter(
                or_(
                    Video.filename.ilike(f"%{query_params.name_like}%"),
                    Video.nicname.ilike(f"%{query_params.name_like}%")
                )
            )
        
        # 排序
        if query_params.order == "asc":
            query = query.order_by(getattr(Video, query_params.sort_by).asc())
        else:
            query = query.order_by(getattr(Video, query_params.sort_by).desc())
        
        # 分页
        total = query.count()
        videos = query.offset((query_params.page - 1) * query_params.page_size).limit(query_params.page_size).all()
        
        # 计算总页数
        total_pages = (total + query_params.page_size - 1) // query_params.page_size
        
        # 转换为响应模型
        video_responses = [
            VideoResponse.model_validate(video) for video in videos
        ]
        
        return {
            "videos": video_responses,
            "total": total,
            "page": query_params.page,
            "page_size": query_params.page_size,
            "total_pages": total_pages
        }
    
    @staticmethod
    async def delete_video(db: Session, user: User, video_id: int) -> bool:
        """删除单个视频"""
        # 查找视频
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == user.id
        ).first()
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="视频不存在"
            )
        
        # 删除本地文件（视频和封面）
        delete_file(video.path)
        delete_file(video.cover_path)
        
        # 删除数据库记录
        db.delete(video)
        db.commit()
        
        # 清理空用户目录
        clear_empty_user_dir(user.username)
        
        return True
    
    @staticmethod
    async def batch_delete_videos(db: Session, user: User, delete_request: VideoBatchDeleteRequest) -> VideoBatchDeleteResponse:
        """批量删除视频"""
        deleted_count = 0
        failed_count = 0
        
        for video_id in delete_request.video_ids:
            try:
                # 查找视频
                video = db.query(Video).filter(
                    Video.id == video_id,
                    Video.user_id == user.id
                ).first()
                
                if video:
                    # 删除本地文件（视频和封面）
                    delete_file(video.path)
                    delete_file(video.cover_path)
                    
                    # 删除数据库记录
                    db.delete(video)
                    deleted_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"批量删除视频失败: {str(e)}")
                failed_count += 1
        
        # 提交事务
        db.commit()
        
        # 清理空用户目录
        clear_empty_user_dir(user.username)
        
        return VideoBatchDeleteResponse(
            deleted=deleted_count,
            failed=failed_count
        )
    
    @staticmethod
    async def init_chunk_upload(db: Session, user: User, request: ChunkInitRequest) -> ChunkInitResponse:
        """初始化切片上传（视频）"""
        # 验证文件类型
        if "." not in request.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件名必须包含扩展名"
            )
        file_extension = request.filename.split(".")[-1].lower()
        is_video = file_extension in ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"]
        
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
            temp_path=temp_path,
            is_video=is_video
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
        
        # 合并切片
        file_path, url = await merge_chunks(
            upload_id=upload_id,
            username=user.username,
            filename=chunk_upload.filename,
            total_chunks=chunk_upload.total_chunks,
            is_video=chunk_upload.is_video
        )
        
        if chunk_upload.is_video:
            # 生成封面路径和URL
            cover_path = file_path.replace(os.path.splitext(file_path)[1], ".jpg")
            cover_url = url.replace(os.path.splitext(url)[1], ".jpg")
            
            # 生成视频封面
            await generate_video_cover(file_path, cover_path)
            
            # 提取视频元数据
            metadata = await extract_video_metadata(file_path)
            if not metadata:
                metadata = {
                    "width": 0,
                    "height": 0,
                    "duration": 0,
                    "bitrate": 0,
                    "resolution": "0x0"
                }
            
            # 生成唯一nicname
            base_nicname = chunk_upload.nicname if chunk_upload.nicname else os.path.splitext(chunk_upload.filename)[0]
            nicname = VideoService._generate_unique_nicname(db, base_nicname)
            
            # 生成不同格式的视频地址
            urls = generate_video_urls(chunk_upload.filename, url, cover_url)
            
            # 上传到Gitee（如果配置了）
            gitee_url = None
            if settings.GITEE_ACCESS_TOKEN:
                gitee_url = await upload_to_gitee(file_path, file_path.split('/')[-1])
            
            # 创建视频记录
            db_video = Video(
                user_id=user.id,
                filename=chunk_upload.filename,
                nicname=nicname,
                path=file_path,
                url=urls["url"],
                markdown=urls["markdown"],
                html=urls["html"],
                gitee_url=gitee_url,
                cover_path=cover_path,
                cover_url=cover_url,
                duration=metadata["duration"],
                width=metadata["width"],
                height=metadata["height"],
                size=os.path.getsize(file_path),
                mime_type=f"video/{chunk_upload.file_extension}",
                resolution=metadata["resolution"],
                bitrate=metadata["bitrate"]
            )
            
            db.add(db_video)
            db.commit()
            db.refresh(db_video)
            
            # 删除切片上传记录
            db.delete(chunk_upload)
            db.commit()
            
            # 清理临时文件
            await cleanup_chunk_upload(upload_id)
            
            # 转换为响应模型
            video_response = VideoResponse.model_validate(db_video)
            
            return UploadResponse(
                uploaded=1,
                failed=0,
                videos=[video_response]
            )
        else:
            # 不是视频，按原有图片逻辑处理
            # 这里可以调用ImageService的逻辑，或者直接复制图片合并的逻辑
            # 为了简单起见，我们直接返回空的上传响应
            return UploadResponse(
                uploaded=0,
                failed=1,
                videos=[]
            )
