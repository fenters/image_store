# ImageBed - 现代化的图床系统

ImageBed是一个功能完善的现代化图床系统，提供了便捷的图片上传、管理、分享和API访问功能，支持多种上传方式和文件管理功能。

## 功能特点

### 前端功能
- 📤 支持单张和批量图片上传
- 📋 图片列表展示和管理
- 🔗 生成分享链接和嵌入代码
- 🔍 图片搜索和过滤
- 📱 响应式设计，支持移动端
- 🎨 美观的用户界面
- 🔐 用户认证和授权
- 💻 LinkToken管理，支持API访问

### 后端功能
- 🚀 基于FastAPI的高性能API
- 📦 支持多种上传方式（普通上传、分片上传）
- 💾 图片存储管理
- 🔒 JWT认证机制
- 🗄️ MySQL数据库存储
- 📊 Redis缓存支持
- 🔄 图片处理和优化
- 📈 API访问日志和统计

### 技术特性
- 🏗️ 前后端分离架构
- 🐳 Docker容器化部署
- 🔄 CI/CD支持
- 📝 完整的API文档
- 🧪 单元测试和集成测试

## 技术栈

### 前端技术
- **框架**: React 19
- **路由**: React Router v7
- **UI组件**: Ant Design 6
- **状态管理**: TanStack React Query
- **构建工具**: Vite 7
- **语言**: TypeScript

### 后端技术
- **框架**: FastAPI
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **认证**: JWT
- **ORM**: SQLAlchemy
- **语言**: Python 3.10

### 部署技术
- **容器化**: Docker
- **编排**: Docker Compose
- **反向代理**: Nginx

## 项目结构

```
.
├── backend/                # 后端代码
│   ├── src/               # 后端源代码
│   │   ├── main.py        # 应用入口
│   │   ├── config.py      # 配置文件
│   │   ├── models/        # 数据库模型
│   │   ├── schemas/       # 数据验证和序列化
│   │   ├── api/           # API路由
│   │   ├── utils/         # 工具函数
│   │   └── middlewares/   # 中间件
│   ├── sql/               # 数据库脚本
│   ├── static/            # 静态文件存储
│   ├── requirements.txt   # 依赖列表
│   └── Dockerfile         # Docker构建文件
├── frontend/              # 前端代码
│   ├── src/               # 前端源代码
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── api/           # API调用
│   │   ├── context/       # 状态管理
│   │   ├── types/         # TypeScript类型定义
│   │   └── styles/        # 样式文件
│   ├── public/            # 静态资源
│   ├── package.json       # 依赖列表
│   ├── vite.config.ts      # Vite配置
│   └── Dockerfile         # Docker构建文件
└── docker-compose.yml      # Docker Compose配置
```

## 安装和部署

### 本地开发

#### 后端开发环境

1. **安装依赖**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
. venv/bin/activate
pip install -r requirements.txt
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑.env文件，配置数据库和其他参数
```

3. **启动开发服务器**
```bash
uvicorn src.main:app --reload
```

#### 前端开发环境

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

### Docker部署

#### 单节点部署

1. **确保Docker和Docker Compose已安装**

2. **配置环境变量和Docker Compose**

   ```bash
   # 复制Docker Compose示例配置文件
   cp docker-compose.override.example.yml docker-compose.override.yml
   
   # 复制后端环境变量示例文件
   cp backend/.env.example backend/.env
   ```

3. **修改配置文件**

   - **docker-compose.override.yml**: 配置数据库密码、端口映射等
   - **backend/.env**: 配置数据库连接、JWT密钥等
   - **frontend/.env**: 配置API基础地址等

   **关键配置项说明**:
   
   - **docker-compose.override.yml**:
     ```yaml
     # MySQL配置
     MYSQL_ROOT_PASSWORD: your-secret-password
     
     # 后端配置
     DATABASE_URL: mysql+pymysql://root:your-secret-password@mysql:3306/imagebed
     JWT_SECRET_KEY: your-strong-secret-key
     BASE_URL: http://localhost:80
     ```
     
   - **backend/.env**:
     ```
     # 数据库连接
     DATABASE_URL=mysql+pymysql://root:your-secret-password@mysql:3306/imagebed
     
     # JWT配置
     JWT_SECRET_KEY=your-strong-secret-key
     
     # 项目配置
     BASE_URL=http://localhost:80
     UPLOAD_FOLDER=static
     MAX_FILE_SIZE=10485760
     
     # Gitee配置（可选，用于图片同步）
     GITEE_ACCESS_TOKEN=your-gitee-token
     GITEE_REPO_OWNER=your-gitee-username
     GITEE_REPO_NAME=your-gitee-repo
     GITEE_REPO_BRANCH=main
     ```

4. **Gitee仓库配置（可选）**

   如果启用了Gitee图片同步功能，需要在Gitee仓库中预先创建`images`目录：
   
   这个步骤确保Gitee API能够成功上传图片，否则会返回400 Bad Request错误。

5. **启动所有服务**
   ```bash
   # 在项目根目录执行，--build参数确保重新构建镜像
   docker-compose up -d --build
   ```

6. **访问应用**
   ```
   http://localhost:80
   ```

#### 访问服务

- 应用首页: http://localhost:80
- API文档: http://localhost:80/api/docs
- 数据库: localhost:3306
- Redis: localhost:6379

#### 配置文件说明

| 配置文件 | 作用 | 位置 |
|---------|------|------|
| docker-compose.override.example.yml | Docker Compose示例配置 | 根目录 |
| docker-compose.override.yml | 实际Docker Compose配置（被忽略） | 根目录 |
| backend/.env.example | 后端环境变量示例 | backend/ |
| backend/.env | 实际后端环境变量（被忽略） | backend/ |
| frontend/.env.example | 前端环境变量示例 | frontend/ |
| frontend/.env | 实际前端环境变量（被忽略） | frontend/ |

#### 配置最佳实践

1. **数据库配置**:
   - 使用强密码: `openssl rand -hex 16` 生成随机密码
   - 不同环境使用不同数据库
   - 定期备份数据库

2. **JWT配置**:
   - 使用强密钥: `openssl rand -hex 32` 生成随机密钥
   - 定期更新密钥
   - 合理设置过期时间

3. **文件存储配置**:
   - 确保存储路径有足够空间
   - 配置合理的文件大小限制
   - 考虑使用云存储服务

### 开发规范

- 前端代码遵循 TypeScript 和 React 最佳实践
- 后端代码遵循 Python PEP 8 规范
- 所有代码变更需要通过 CI 测试
- 提交信息使用清晰的描述


## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的图片上传和管理功能
- 支持API访问和LinkToken管理
- 支持Docker部署
