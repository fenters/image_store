import os
import shutil
from typing import Tuple, Optional
from datetime import datetime, timedelta
import secrets
import uuid
from src.config import settings
from fastapi import UploadFile, HTTPException, status
import aiofiles
import html


async def save_file(file: UploadFile, username: str) -> Tuple[str, str]:
    """保存文件到本地存储"""
    # 验证文件类型
    if "." not in file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件名必须包含扩展名"
        )
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型，允许的类型：{', '.join(settings.allowed_file_types_list)}"
        )
    
    # 创建用户目录结构：static/{username}/images/
    user_image_dir = os.path.join(settings.UPLOAD_FOLDER, username, "images")
    os.makedirs(user_image_dir, exist_ok=True)
    
    # 生成唯一的文件名，避免冲突
    unique_filename = generate_nicname(username, file_extension)
    
    # 文件路径：使用唯一文件名进行保存
    file_path = os.path.join(user_image_dir, unique_filename)
    
    # 保存文件
    try:
        content_length = 0
        async with aiofiles.open(file_path, 'wb') as f:
            # 直接读取整个文件内容，确保完整保存
            content = await file.read()
            content_length = len(content)
            
            if content_length > settings.MAX_FILE_SIZE:
                await f.close()
                os.remove(file_path)  # 清理已写入的文件
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"文件大小超过限制，最大允许 {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
                )
            
            await f.write(content)
    except HTTPException:
        raise  # 重新抛出HTTP异常
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件保存失败: {str(e)}"
        )
    
    # 生成URL
    url = f"{settings.BASE_URL}/{settings.UPLOAD_FOLDER}/{username}/images/{unique_filename}"
    
    return file_path, url

def delete_file(file_path: str) -> bool:
    """删除文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except PermissionError as e:
        print(f"删除文件权限不足: {str(e)}")
        return False
    except OSError as e:
        print(f"删除文件系统错误: {str(e)}")
        return False
    except Exception as e:
        print(f"删除文件未知错误: {str(e)}")
        return False

def generate_nicname(username: str, file_extension: str) -> str:
    """生成唯一的文件名"""
    timestamp = int(datetime.now().timestamp())
    random_str = secrets.token_hex(6)
    return f"{username}_{timestamp}_{random_str}.{file_extension}"

def generate_image_urls(filename: str, url: str) -> dict:
    """生成不同格式的图片地址"""
    # 转义特殊字符，防止XSS攻击
    escaped_filename = html.escape(filename)
    escaped_url = html.escape(url)
    return {
        "url": url,
        "markdown": f"![{escaped_filename}]({escaped_url})",
        "html": f"<img src=\"{escaped_url}\" alt=\"{escaped_filename}\">",
    }

def get_user_dir(username: str) -> str:
    """获取用户目录"""
    return os.path.join(settings.UPLOAD_FOLDER, username)

def clear_empty_user_dir(username: str) -> None:
    """清理空用户目录"""
    # 清理图片目录
    user_image_dir = os.path.join(settings.UPLOAD_FOLDER, username, "images")
    try:
        if os.path.exists(user_image_dir):
            if len(os.listdir(user_image_dir)) == 0:
                os.rmdir(user_image_dir)
                # 清理用户根目录
                user_dir = os.path.join(settings.UPLOAD_FOLDER, username)
                if os.path.exists(user_dir) and len(os.listdir(user_dir)) == 0:
                    os.rmdir(user_dir)
    except PermissionError as e:
        print(f"清理空目录权限不足: {str(e)}")
    except OSError as e:
        print(f"清理空目录系统错误: {str(e)}")
    except Exception as e:
        print(f"清理空目录未知错误: {str(e)}")


async def init_chunk_upload(username: str, filename: str, file_size: int, total_chunks: int) -> Tuple[str, str]:
    """初始化切片上传会话"""
    # 验证文件类型
    if "." not in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件名必须包含扩展名"
        )
    file_extension = filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型，允许的类型：{', '.join(settings.allowed_file_types_list)}"
        )
    
    # 验证文件大小
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制，最大允许 {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
        )
    
    # 生成上传会话ID
    upload_id = str(uuid.uuid4())
    
    # 创建临时目录：temp/{upload_id}/
    temp_dir = os.path.join(settings.TEMP_UPLOAD_FOLDER, upload_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    return upload_id, temp_dir


async def save_chunk(upload_id: str, chunk_index: int, file: UploadFile) -> None:
    """保存单个切片"""
    # 临时文件路径
    temp_dir = os.path.join(settings.TEMP_UPLOAD_FOLDER, upload_id)
    chunk_file_path = os.path.join(temp_dir, f"chunk_{chunk_index}")
    
    # 验证临时目录是否存在
    if not os.path.exists(temp_dir):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="上传会话不存在"
        )
    
    # 保存切片
    try:
        async with aiofiles.open(chunk_file_path, 'wb') as f:
            # 使用循环读取文件内容，确保正确读取所有数据
            chunk_size = 1024 * 1024  # 1MB chunks
            while True:
                content = await file.read(chunk_size)
                if not content:
                    break
                await f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存切片失败: {str(e)}"
        )


async def merge_chunks(upload_id: str, username: str, filename: str, total_chunks: int) -> Tuple[str, str]:
    """合并所有切片成完整文件"""
    
    # 创建用户目录结构：static/{username}/images/
    user_image_dir = os.path.join(settings.UPLOAD_FOLDER, username, "images")
    os.makedirs(user_image_dir, exist_ok=True)
    
    # 获取文件扩展名
    file_extension = filename.split(".")[-1].lower()
    
    # 生成唯一的文件名，避免冲突
    unique_filename = generate_nicname(username, file_extension)
    
    # 文件路径：使用唯一文件名进行保存
    file_path = os.path.join(user_image_dir, unique_filename)
    
    # 临时目录路径
    temp_dir = os.path.join(settings.TEMP_UPLOAD_FOLDER, upload_id)
    
    # 验证临时目录是否存在
    if not os.path.exists(temp_dir):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="上传会话不存在"
        )
    
    # 验证所有切片是否都已上传
    for i in range(total_chunks):
        chunk_file_path = os.path.join(temp_dir, f"chunk_{i}")
        if not os.path.exists(chunk_file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"切片 {i} 未上传"
            )
    
    # 合并切片
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            for i in range(total_chunks):
                chunk_file_path = os.path.join(temp_dir, f"chunk_{i}")
                async with aiofiles.open(chunk_file_path, 'rb') as chunk_file:
                    chunk_content = await chunk_file.read()
                    await f.write(chunk_content)
    except Exception as e:
        # 清理已合并的文件
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"合并切片失败: {str(e)}"
        )
    
    # 生成URL：使用唯一文件名
    url = f"{settings.BASE_URL}/{settings.UPLOAD_FOLDER}/{username}/images/{unique_filename}"
    
    return file_path, url


async def cleanup_chunk_upload(upload_id: str) -> None:
    """清理切片上传的临时文件和数据"""
    temp_dir = os.path.join(settings.TEMP_UPLOAD_FOLDER, upload_id)
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"清理临时目录失败: {str(e)}")


async def cleanup_expired_chunks() -> None:
    """定期清理过期的临时分片文件"""
    temp_dir = settings.TEMP_UPLOAD_FOLDER
    if not os.path.exists(temp_dir):
        return
    
    # 获取当前时间
    now = datetime.now()
    
    # 遍历临时目录下的所有upload_id目录
    for upload_id in os.listdir(temp_dir):
        chunk_dir = os.path.join(temp_dir, upload_id)
        if os.path.isdir(chunk_dir):
            try:
                # 获取目录创建时间
                stat = os.stat(chunk_dir)
                create_time = datetime.fromtimestamp(stat.st_ctime)
                
                # 计算目录存在时间
                delta = now - create_time
                
                # 如果超过配置的过期时间，删除目录
                if delta.total_seconds() > settings.CHUNK_EXPIRE_TIME:
                    shutil.rmtree(chunk_dir)
                    print(f"清理过期临时目录: {chunk_dir}")
            except Exception as e:
                print(f"清理临时目录 {chunk_dir} 失败: {str(e)}")


async def get_chunk_upload_status(upload_id: str, total_chunks: int) -> int:
    """获取切片上传状态（已上传切片数）"""
    temp_dir = os.path.join(settings.TEMP_UPLOAD_FOLDER, upload_id)
    if not os.path.exists(temp_dir):
        return 0
    
    uploaded_chunks = 0
    for i in range(total_chunks):
        chunk_file_path = os.path.join(temp_dir, f"chunk_{i}")
        if os.path.exists(chunk_file_path):
            uploaded_chunks += 1
    
    return uploaded_chunks
