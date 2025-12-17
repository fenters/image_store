import os
from src.config import settings
from typing import Optional
import base64
import requests

async def upload_to_gitee(file_path: str, filename: str) -> Optional[str]:
    """纯Python实现：上传文件到Gitee仓库的images目录
    
    Args:
        file_path: 本地文件路径
        filename: 文件名
        
    Returns:
        Optional[str]: Gitee文件URL，如果上传失败返回None
    """
    # 检查Gitee配置
    if not gitee_configured():
        return None
    
    try:
        # 准备文件信息
        pure_filename = os.path.basename(file_path)
        target_path = f"images/{pure_filename}"
        
        # 读取并Base64编码文件
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        encoded_content = base64.b64encode(file_content).decode("utf-8")
        
        # 构建API请求
        api_url = f"https://gitee.com/api/v5/repos/{settings.GITEE_REPO_OWNER}/{settings.GITEE_REPO_NAME}/contents/{target_path}"
        
        # 准备请求头和数据
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "ImageBed/1.0"
        }
        
        payload = {
            "access_token": settings.GITEE_ACCESS_TOKEN,
            "message": f"Upload image: {pure_filename}",
            "content": encoded_content,
            "branch": settings.GITEE_REPO_BRANCH
        }
        
        # 发送API请求
        response = requests.put(api_url, headers=headers, json=payload, timeout=30)
        
        # 处理响应
        try:
            result = response.json()
            if response.status_code in [200, 201]:
                gitee_url = result.get("content", {}).get("download_url")
                return gitee_url
        except ValueError:
            # 响应不是JSON格式，忽略错误
            pass
            
        return None
        
    except Exception:
        # 忽略所有异常，返回None
        return None

def gitee_configured() -> bool:
    """检查Gitee是否已配置
    
    Returns:
        bool: 如果配置完整且非默认值返回True，否则返回False
    """
    default_values = ["your-gitee-access-token", "your-gitee-username", "your-gitee-repo-name"]
    
    # 检查配置是否存在且非默认值
    return (all([settings.GITEE_ACCESS_TOKEN, settings.GITEE_REPO_OWNER, settings.GITEE_REPO_NAME]) and
            settings.GITEE_ACCESS_TOKEN not in default_values and
            settings.GITEE_REPO_OWNER not in default_values and
            settings.GITEE_REPO_NAME not in default_values)
