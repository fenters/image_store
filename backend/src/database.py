from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# 创建数据库引擎，优化连接池配置
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,           # 连接池大小，默认5
    max_overflow=10,       # 连接池溢出最大连接数
    pool_pre_ping=True,     # 连接池预检查
    pool_recycle=3600,      # 连接回收时间（秒）
    echo_pool=True          # 连接池日志
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 依赖函数：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
