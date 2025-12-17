from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/imagebed"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT配置
    JWT_SECRET_KEY: str = "your-strong-secret-key"
    JWT_ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    
    # Gitee配置（可选）
    GITEE_ACCESS_TOKEN: Optional[str] = None
    GITEE_REPO_OWNER: Optional[str] = None
    GITEE_REPO_NAME: Optional[str] = None
    GITEE_REPO_BRANCH: str = "main"
    
    # 项目配置
    BASE_URL: str = "http://localhost:8000"
    UPLOAD_FOLDER: str = "static"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: str = "jpg,jpeg,png,gif,webp"
    
    @property
    def allowed_file_types_list(self) -> list[str]:
        return [ft.strip() for ft in self.ALLOWED_FILE_TYPES.split(",")]
    
    # 切片上传配置
    CHUNK_SIZE: int = 2 * 1024 * 1024  # 2MB per chunk
    TEMP_UPLOAD_FOLDER: str = "temp"
    CHUNK_EXPIRE_TIME: int = 24 * 3600  # 24 hours in seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
