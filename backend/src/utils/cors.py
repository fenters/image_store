from fastapi.staticfiles import StaticFiles
from fastapi import Request, Response
import asyncio

class CORSServedStaticFiles(StaticFiles):
    """支持CORS的静态文件服务"""
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        # 添加CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = '*'
        response.headers['Access-Control-Allow-Headers'] = '*'
        return response