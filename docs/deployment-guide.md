# 运动员自助系统部署指南

## 🎯 部署概述

本指南详细说明如何部署运动员自助系统，包括数据库配置、后端服务部署、前端应用部署等完整流程。

## 📋 系统要求

### 硬件要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 20GB以上可用空间
- **网络**: 稳定的网络连接

### 软件要求
- **操作系统**: Linux/Windows/macOS
- **Node.js**: 14.x 或更高版本
- **MySQL**: 5.7 或更高版本
- **Git**: 最新版本

## 🗄️ 数据库部署

### 1. 安装MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# macOS (使用Homebrew)
brew install mysql
```

### 2. 创建数据库
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE sports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'sports_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sports.* TO 'sports_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 执行数据库脚本
```bash
# 进入项目目录
cd sports

# 执行基础数据库脚本
mysql -u root -p sports < sports-backend/sports.sql

# 执行多角色认证扩展脚本
mysql -u root -p sports < sports-backend/database/multi-role-auth-extension.sql

# 执行运动员自助系统扩展脚本
mysql -u root -p sports < sports-backend/database/player-registration-extension.sql
```

### 4. 验证数据库
```sql
-- 检查表是否创建成功
USE sports;
SHOW TABLES;

-- 检查运动员登录信息
SELECT player_id, player_name, player_username FROM player;

-- 检查报名表
DESCRIBE registration;
```

## 🔧 后端部署

### 1. 环境准备
```bash
# 克隆项目（如果还没有）
git clone https://github.com/RainbowRain9/sports.git
cd sports/sports-backend

# 安装依赖
npm install
```

### 2. 配置数据库连接
```bash
# 复制配置文件
cp config/config.default.js config/config.local.js

# 编辑配置文件
vim config/config.local.js
```

配置示例：
```javascript
// config/config.local.js
'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // 数据库配置
  config.mysql = {
    client: {
      host: 'localhost',
      port: '3306',
      user: 'sports_user',
      password: 'your_password',
      database: 'sports',
    },
    app: true,
    agent: false,
  };

  // JWT配置
  config.jwt = {
    secret: 'your-jwt-secret-key',
    expiresIn: '24h'
  };

  return config;
};
```

### 3. 启动后端服务
```bash
# 开发环境
npm run dev

# 生产环境
npm run start

# 停止服务
npm run stop
```

### 4. 验证后端服务
```bash
# 测试API连接
curl http://localhost:7001/ping

# 测试认证API
curl -X POST http://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userType":"admin","username":"admin","password":"123"}'
```

## 🎨 前端部署

### 1. 环境准备
```bash
# 进入前端目录
cd sports-web

# 安装依赖
npm install
```

### 2. 配置环境变量
```bash
# 编辑环境配置
vim .env
```

配置示例：
```bash
# .env
VUE_APP_API_BASE_URL=http://localhost:7001
VUE_APP_TITLE=体育赛事管理系统
```

### 3. 开发环境启动
```bash
# 启动开发服务器
NODE_OPTIONS="--openssl-legacy-provider" npm start

# 或者
npm run serve
```

### 4. 生产环境构建
```bash
# 构建生产版本
NODE_OPTIONS="--openssl-legacy-provider" npm run build

# 构建文件将生成在 dist/ 目录
```

### 5. 部署到Web服务器

#### 使用Nginx
```nginx
# /etc/nginx/sites-available/sports
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/sports-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 使用Apache
```apache
# .htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## 🔒 安全配置

### 1. 数据库安全
```sql
-- 删除测试数据库
DROP DATABASE IF EXISTS test;

-- 删除匿名用户
DELETE FROM mysql.user WHERE User='';

-- 禁用远程root登录
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- 刷新权限
FLUSH PRIVILEGES;
```

### 2. 应用安全
```javascript
// config/config.prod.js
'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // 安全配置
  config.security = {
    csrf: {
      enable: true,
    },
    domainWhiteList: ['http://your-domain.com'],
  };

  // CORS配置
  config.cors = {
    origin: 'http://your-domain.com',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  return config;
};
```

### 3. 防火墙配置
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📊 监控和日志

### 1. 应用监控
```bash
# 使用PM2管理Node.js进程
npm install -g pm2

# 启动应用
pm2 start npm --name "sports-backend" -- run start

# 查看状态
pm2 status

# 查看日志
pm2 logs sports-backend
```

### 2. 日志配置
```javascript
// config/config.prod.js
config.logger = {
  level: 'INFO',
  consoleLevel: 'ERROR',
  dir: '/var/log/sports',
};
```

### 3. 数据库监控
```sql
-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
```

## 🔄 备份和恢复

### 1. 数据库备份
```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/sports"
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u sports_user -p sports > $BACKUP_DIR/sports_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/sports_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### 2. 应用备份
```bash
# 备份应用代码
tar -czf /backup/sports_app_$(date +%Y%m%d).tar.gz /path/to/sports

# 备份配置文件
cp -r /path/to/sports/sports-backend/config /backup/config_$(date +%Y%m%d)
```

### 3. 恢复流程
```bash
# 恢复数据库
mysql -u sports_user -p sports < /backup/sports/sports_backup.sql

# 恢复应用
tar -xzf /backup/sports_app_backup.tar.gz -C /path/to/restore
```

## 🚀 性能优化

### 1. 数据库优化
```sql
-- 添加索引
ALTER TABLE registration ADD INDEX idx_player_status (player_id, registration_status);
ALTER TABLE registration ADD INDEX idx_schedule_status (schedule_id, registration_status);

-- 优化配置
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL query_cache_size = 268435456; -- 256MB
```

### 2. 应用优化
```javascript
// 启用gzip压缩
config.middleware = ['gzip', 'errorHandler', 'notfound'];

// 静态资源缓存
config.static = {
  maxAge: 31536000, // 1年
};
```

### 3. 前端优化
```javascript
// webpack配置优化
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
  },
};
```

## 📞 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接配置
   - 检查防火墙设置

2. **API请求失败**
   - 检查后端服务状态
   - 验证API路径配置
   - 查看错误日志

3. **前端页面空白**
   - 检查构建是否成功
   - 验证静态资源路径
   - 查看浏览器控制台错误

### 日志查看
```bash
# 后端日志
tail -f logs/sports-web.log

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u mysql
journalctl -u nginx
```

---

**部署完成后，请按照测试清单进行全面功能验证！**
