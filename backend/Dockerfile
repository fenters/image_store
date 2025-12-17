# 使用官方Python基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libmariadb-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装生产环境所需的WSGI服务器gunicorn
RUN pip install --no-cache-dir gunicorn

# 复制应用代码
COPY src/ ./src/
COPY static/ ./static/
COPY sql/ ./sql/

# 复制配置文件
COPY .env.example ./.env

# 创建临时目录并设置权限
RUN mkdir -p temp && chmod 755 temp

# 暴露端口
EXPOSE 8000

# 使用Gunicorn作为WSGI服务器运行应用
# 优化配置：减少worker数量，增加超时设置，优化内存使用
CMD ["gunicorn", "src.main:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "60", "--keep-alive", "2", "--limit-request-line", "4094", "--limit-request-fields", "100", "--limit-request-field_size", "8190"]
