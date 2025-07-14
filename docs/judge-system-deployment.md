# 裁判员专用功能模块部署指南

## 🎯 概述

本文档详细说明如何部署和测试新开发的裁判员专用功能模块。该模块为嘉园运动会系统增加了完整的裁判员工作流程支持。

## 📋 功能特性

### 🏆 核心功能
- **个人中心**: 裁判员专用Dashboard，展示工作统计和今日安排
- **赛事管理**: 查看分配的比赛项目、参赛选手名单
- **成绩录入**: 支持单个录入和批量录入两种模式
- **个人信息管理**: 基本信息编辑和密码修改

### 🛡️ 权限控制
- 基于JWT Token的身份验证
- RBAC角色权限控制
- 裁判员只能操作分配给自己的比赛项目
- 完整的API权限验证

## 🗄️ 数据库部署

### 1. 执行数据库扩展脚本

```bash
# 进入项目目录
cd sports

# 执行裁判员系统数据库扩展脚本
mysql -u root -p sports < sports-backend/database/judge-system-extension.sql
```

### 2. 验证数据库结构

```sql
-- 检查新创建的表
USE sports;
SHOW TABLES LIKE '%judge%';

-- 验证judge_events表结构
DESCRIBE judge_events;

-- 检查视图是否创建成功
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 验证存储过程
SHOW PROCEDURE STATUS WHERE Db = 'sports';
```

### 3. 检查测试数据

```sql
-- 查看裁判员账号
SELECT judge_id, judge_name, judge_username, judge_specialty FROM judge;

-- 查看裁判员赛事分配
SELECT * FROM judge_events;

-- 查看裁判员工作统计
SELECT * FROM v_judge_work_stats;
```

## 🔧 后端部署

### 1. 验证新增文件

确认以下文件已正确创建：
- `sports-backend/app/controller/judge.js`
- `sports-backend/app/service/judge.js`
- `sports-backend/database/judge-system-extension.sql`

### 2. 检查路由配置

验证 `sports-backend/app/router.js` 中已添加裁判员API路由：

```javascript
// 裁判员专用API
router.get('/api/judge/profile', app.middleware.auth(), controller.judge.getProfile);
router.put('/api/judge/profile', app.middleware.auth(), controller.judge.updateProfile);
// ... 其他路由
```

### 3. 重启后端服务

```bash
cd sports-backend
npm run dev
```

### 4. 测试API接口

```bash
# 测试裁判员登录
curl -X POST http://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userType":"judge","username":"judge001","password":"123456"}'

# 测试获取裁判员信息（需要替换实际token）
curl -X GET http://localhost:7001/api/judge/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 前端部署

### 1. 验证新增文件

确认以下文件已正确创建：
- `sports-web/src/views/JudgeLayout.vue`
- `sports-web/src/views/JudgeDashboard.vue`
- `sports-web/src/views/JudgeProfile.vue`
- `sports-web/src/views/JudgeEvents.vue`
- `sports-web/src/views/JudgeScoreInput.vue`

### 2. 检查路由配置

验证 `sports-web/src/router/index.js` 中已添加裁判员路由。

### 3. 检查API配置

验证 `sports-web/src/api/demo.js` 中已添加裁判员API函数。

### 4. 重启前端服务

```bash
cd sports-web
NODE_OPTIONS="--openssl-legacy-provider" npm start
```

## 🔐 测试账号

### 默认裁判员账号
- **张裁判**: judge001 / 123456 (田径项目)
- **李裁判**: judge002 / 123456 (游泳项目)  
- **王裁判**: judge003 / 123456 (球类项目)

## 🧪 功能测试清单

### 1. 登录认证测试
- [ ] 使用裁判员账号登录系统
- [ ] 验证登录后跳转到裁判员Dashboard
- [ ] 测试Token过期自动退出
- [ ] 验证权限控制（无法访问其他角色页面）

### 2. 个人中心测试
- [ ] Dashboard页面正常加载
- [ ] 统计数据正确显示
- [ ] 今日赛事安排显示
- [ ] 快捷操作按钮功能正常

### 3. 个人信息管理测试
- [ ] 查看个人信息
- [ ] 编辑基本信息
- [ ] 修改密码功能
- [ ] 数据验证和错误处理

### 4. 赛事管理测试
- [ ] 查看分配的比赛项目
- [ ] 筛选和搜索功能
- [ ] 查看赛事详情
- [ ] 查看参赛选手名单

### 5. 成绩录入测试
- [ ] 选择比赛项目
- [ ] 加载参赛选手
- [ ] 单个成绩录入
- [ ] 批量成绩录入
- [ ] 成绩修改和删除
- [ ] 数据验证和错误处理

### 6. 权限验证测试
- [ ] 只能查看分配给自己的比赛项目
- [ ] 只能修改自己录入的成绩
- [ ] API接口权限验证
- [ ] 前端路由权限验证

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接错误
```
检查数据库服务状态
验证连接配置
确认数据库脚本执行成功
```

#### 2. API接口404错误
```
检查路由配置是否正确
验证controller文件是否存在
确认后端服务重启
```

#### 3. 前端页面空白
```
检查Vue组件是否正确导入
验证路由配置
查看浏览器控制台错误
```

#### 4. 权限验证失败
```
检查JWT Token是否有效
验证用户角色配置
确认权限中间件配置
```

### 日志查看

```bash
# 后端日志
tail -f sports-backend/logs/sports-web.log

# 前端开发服务器日志
# 查看终端输出

# 数据库日志
tail -f /var/log/mysql/error.log
```

## 📊 性能监控

### 关键指标
- API响应时间
- 数据库查询性能
- 前端页面加载速度
- 用户操作响应时间

### 监控命令
```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';

-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看表状态
SHOW TABLE STATUS LIKE 'judge%';
```

## 🚀 生产环境部署

### 1. 环境配置
- 配置生产数据库连接
- 设置JWT密钥
- 配置日志级别
- 设置CORS策略

### 2. 安全加固
- 启用HTTPS
- 配置防火墙
- 设置访问限制
- 启用日志审计

### 3. 备份策略
- 数据库定期备份
- 应用代码备份
- 配置文件备份
- 日志文件归档

## 📝 维护说明

### 定期维护任务
- 清理过期会话数据
- 优化数据库索引
- 更新系统依赖
- 监控系统性能

### 数据维护
```sql
-- 清理过期会话（示例）
DELETE FROM user_session WHERE expires_at < NOW();

-- 优化表
OPTIMIZE TABLE judge_events;
OPTIMIZE TABLE plog;
```

## 📞 技术支持

如遇到部署或使用问题，请：
1. 查看本文档的故障排除部分
2. 检查系统日志文件
3. 验证配置文件设置
4. 联系技术支持团队

---

**裁判员专用功能模块部署完成！**

系统现已支持完整的多角色工作流程：
- ✅ 管理员系统
- ✅ 操作员系统  
- ✅ 运动员自助系统
- ✅ 裁判员专用系统
