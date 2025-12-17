from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio

# 导入配置和数据库
from src.config import settings
from src.database import engine, Base

# 导入路由
from src.routers import auth_router, token_router, image_router

# 导入工具函数
from src.utils.file import cleanup_expired_chunks

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="图床API",
    description="前后端分离的图床系统API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该配置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# 静态文件目录已经挂载，图片可以通过 /static/{username}/images/{filename} 访问

# 注册路由
app.include_router(auth_router)
app.include_router(token_router)
app.include_router(image_router)

# 健康检查
@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


# 定时清理过期临时文件的后台任务
async def periodic_cleanup():
    """定期清理过期的临时分片文件"""
    while True:
        await cleanup_expired_chunks()
        # 每隔1小时运行一次清理任务
        await asyncio.sleep(10800)


# 启动事件，在应用启动时创建后台任务
async def startup_event():
    """应用启动时执行的事件"""
    # 创建后台任务，定期清理过期临时文件
    asyncio.create_task(periodic_cleanup())
    print("后台清理任务已启动，每隔3小时清理一次过期临时文件")

# 使用新的方式注册事件处理器
app.add_event_handler("startup", startup_event)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        timeout_keep_alive=60,  # 保持连接超时时间，延长到60秒
        timeout_graceful_shutdown=120  # 优雅关闭超时时间，延长到120秒
    )
