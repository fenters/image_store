-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS imagebed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE imagebed;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建Token表
CREATE TABLE IF NOT EXISTS tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建图片表
CREATE TABLE IF NOT EXISTS images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    nicname VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    markdown VARCHAR(500) NOT NULL,
    html VARCHAR(500) NOT NULL,
    gitee_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建切片上传表
CREATE TABLE IF NOT EXISTS chunk_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upload_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    total_chunks INT NOT NULL,
    uploaded_chunks INT DEFAULT 0,
    file_size INT NOT NULL,
    temp_path VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_nicname ON images(nicname);
CREATE INDEX idx_images_created_at ON images(created_at);
CREATE INDEX idx_chunk_uploads_user_id ON chunk_uploads(user_id);
CREATE INDEX idx_chunk_uploads_upload_id ON chunk_uploads(upload_id);

-- 创建管理员用户（账户：admin，密码：admin）
INSERT INTO users (username, password, email) 
VALUES ('admin', '$2b$12$WmZlNt87ngC2KjOeS.9MceR0JmLTdyUsxZp6ocD74ClWLLJKsS8vq', 'admin@example.com') 
ON DUPLICATE KEY UPDATE username = username;

