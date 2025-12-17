from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    nicname = Column(String(255), nullable=False, unique=True)  # 唯一标识符
    path = Column(String(255), nullable=False)
    url = Column(String(255), nullable=False)
    markdown = Column(String(500), nullable=False)  # Markdown格式地址
    html = Column(String(500), nullable=False)  # HTML格式地址
    gitee_url = Column(String(255), nullable=True)  # Gitee访问URL（可选）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    user = relationship("User", back_populates="images")


class ChunkUpload(Base):
    __tablename__ = "chunk_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(String(100), nullable=False, unique=True)  # 上传会话ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # 原始文件名
    nicname = Column(String(255), nullable=True)  # 图片昵称，可为空
    file_extension = Column(String(20), nullable=False)  # 文件扩展名
    total_chunks = Column(Integer, nullable=False)  # 总分片数
    uploaded_chunks = Column(Integer, default=0)  # 已上传分片数
    file_size = Column(Integer, nullable=False)  # 文件总大小
    temp_path = Column(String(255), nullable=False)  # 临时存储路径
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 创建时间
    
    # 关系
    user = relationship("User", backref="chunk_uploads")
