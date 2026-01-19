from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # 原始文件名
    nicname = Column(String(255), nullable=False, unique=True)  # 唯一标识符
    path = Column(String(255), nullable=False)  # 视频文件路径
    url = Column(String(255), nullable=False)  # 视频访问URL
    markdown = Column(String(500), nullable=False)  # Markdown格式地址
    html = Column(String(500), nullable=False)  # HTML格式地址
    gitee_url = Column(String(255), nullable=True)  # Gitee访问URL（可选）
    cover_path = Column(String(255), nullable=False)  # 视频封面本地路径
    cover_url = Column(String(255), nullable=False)  # 视频封面访问URL
    duration = Column(Integer, nullable=False, default=0)  # 视频时长（秒）
    width = Column(Integer, nullable=False, default=0)  # 视频宽度（像素）
    height = Column(Integer, nullable=False, default=0)  # 视频高度（像素）
    size = Column(BigInteger, nullable=False, default=0)  # 文件大小（字节）
    mime_type = Column(String(50), nullable=False)  # MIME类型
    resolution = Column(String(20), nullable=False)  # 视频分辨率（如1920x1080）
    bitrate = Column(Integer, nullable=False, default=0)  # 视频比特率（Kbps）
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 创建时间
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # 更新时间
    
    # 关系
    user = relationship("User", back_populates="videos")
