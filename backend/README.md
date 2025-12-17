# 图床后端API

这是一个基于FastAPI的前后端分离图床系统的后端服务，用于存储和展示图片。

## 技术栈

- Python 3.10+
- FastAPI
- MySQL
- Redis
- SQLAlchemy
- Pydantic
- JWT

## 功能特性

### 用户管理
- 用户注册
- 用户登录
- 登录Token过期时间为一周

### Token管理
- 支持创建多个外部Token
- 外部Token永不过期
- Token列表查询隐藏实际Token值
- 仅在创建时返回完整Token

### 图片管理
- 支持批量上传图片
- 支持多条件查询图片
- 支持单张和批量删除图片
- 图片自动生成Markdown和HTML格式地址
- 按用户ID分目录存储图片

### Gitee集成
- 支持图片同步上传到Gitee仓库
- 可配置Gitee仓库信息

## 快速开始

### 环境要求

- Python 3.10+
- MySQL 8.0+
- Redis 6.0+

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置环境变量

1. 复制 `.env.example` 文件为 `.env`
2. 修改 `.env` 文件中的配置项

```bash
cp .env.example .env
```

### 启动服务

```bash
# 开发模式
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### API文档

启动服务后，可以通过以下地址访问API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
src/
├── main.py              # FastAPI入口
├── config.py            # 配置管理
├── database.py          # 数据库连接
├── models/              # 数据库模型
├── schemas/             # 请求响应模型
├── routers/             # API路由
├── services/            # 业务逻辑
├── utils/               # 工具函数
└── static/              # 静态资源存储
```

## API路由

### 认证相关
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录

### Token管理
- GET /api/tokens - 获取Token列表
- POST /api/tokens - 创建新Token
- DELETE /api/tokens/{token_id} - 删除Token

### 图片管理
- GET /api/images - 查询图片列表
- POST /api/images - 上传图片
- DELETE /api/images/{image_id} - 删除单张图片
- POST /api/images/batch-delete - 批量删除图片

## 数据库设计

### 用户表 (users)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | 加密密码 |
| email | VARCHAR(100) | 邮箱，可重复 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### Token表 (tokens)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 外键，关联用户 |
| name | VARCHAR(50) | Token名称 |
| token | VARCHAR(255) | 加密的Token值 |
| created_at | DATETIME | 创建时间 |

### 图片表 (images)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 外键，关联用户 |
| filename | VARCHAR(255) | 原始文件名 |
| nicname | VARCHAR(255) | 生成的唯一名称 |
| path | VARCHAR(255) | 本地存储路径 |
| url | VARCHAR(255) | 访问URL |
| markdown | VARCHAR(500) | Markdown格式地址 |
| html | VARCHAR(500) | HTML格式地址 |
| gitee_url | VARCHAR(255) | Gitee访问URL |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 切片上传表 (chunk_uploads)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INT | 主键，自增 |
| upload_id | VARCHAR(100) | 上传会话ID，唯一 |
| user_id | INT | 外键，关联用户 |
| filename | VARCHAR(255) | 原始文件名 |
| nicname | VARCHAR(255) | 图片昵称，可为空 |
| file_extension | VARCHAR(20) | 文件扩展名 |
| total_chunks | INT | 总分片数 |
| uploaded_chunks | INT | 已上传分片数，默认0 |
| file_size | INT | 文件总大小 |
| temp_path | VARCHAR(255) | 临时存储路径 |
| created_at | DATETIME | 创建时间 |

## 安全措施

- 密码使用bcrypt哈希存储
- JWT Token认证
- Token列表隐藏实际值
- 图片访问权限控制
- 输入数据验证

## 许可证

MIT
