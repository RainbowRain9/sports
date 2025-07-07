# 多角色登录系统使用指南

## 🎯 系统概述

体育赛事管理系统现已支持四种用户角色的统一登录：
- **管理员** (admin): 系统管理、用户管理、数据统计
- **操作员** (operator): 项目管理、赛程管理、成绩录入
- **运动员** (player): 个人信息、报名参赛、成绩查询
- **裁判员** (judge): 成绩录入、赛事管理、参赛名单

## 🗄️ 数据库部署

### 1. 执行数据库扩展脚本

```bash
# 在MySQL中执行扩展脚本
mysql -u root -p sports < sports-backend/database/multi-role-auth-extension.sql
```

### 2. 验证表结构

执行后会创建/修改以下表：
- `player` - 扩展了登录字段
- `judge` - 新增裁判员表
- `user_session` - 用户会话管理
- `role_permission` - 角色权限配置

## 🚀 系统启动

### 后端启动
```bash
cd sports-backend
npm run dev
```

### 前端启动
```bash
cd sports-web
NODE_OPTIONS="--openssl-legacy-provider" npm start
```

## 🔐 默认测试账号

### 管理员账号
- **系统管理员**: admin / 123
- **操作员**: operator / 123

### 运动员账号
- **赵一**: 001 / 123456
- **王二**: 002 / 123456  
- **李三**: 003 / 123456

### 裁判员账号
- **张裁判**: judge001 / 123456
- **李裁判**: judge002 / 123456
- **王裁判**: judge003 / 123456

## 🎨 前端使用

### 1. 登录流程

1. 访问 http://localhost:8080/
2. 选择用户角色（管理员/运动员/裁判员）
3. 输入对应的用户名和密码
4. 系统自动跳转到对应的主页面

### 2. 权限控制

#### 在模板中使用权限指令
```vue
<!-- 基于权限显示 -->
<el-button v-permission="'user:manage'">用户管理</el-button>

<!-- 基于角色显示 -->
<div v-role="'admin'">管理员可见内容</div>
<div v-role="['admin', 'operator']">管理员和操作员可见</div>
```

#### 在组件中使用权限方法
```javascript
export default {
  methods: {
    handleEdit() {
      if (this.$hasPermission('user:edit')) {
        // 有编辑权限的操作
      }
    },
    
    checkRole() {
      if (this.$isAdmin()) {
        // 管理员操作
      } else if (this.$isPlayer()) {
        // 运动员操作
      }
    }
  }
}
```

### 3. API调用

所有API请求会自动添加JWT Token，无需手动处理：

```javascript
import { authLogin, authProfile } from '@/api/demo.js';

// 登录
const result = await authLogin({
  userType: 'player',
  username: '001',
  password: '123456'
});

// 获取用户信息（自动携带Token）
const profile = await authProfile();
```

## 🔧 后端API

### 认证接口

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "userType": "admin|player|judge",
  "username": "用户名",
  "password": "密码"
}
```

#### 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 登出
```
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Token验证
```
POST /api/auth/verify
Content-Type: application/json

{
  "token": "jwt_token"
}
```

### 权限中间件使用

```javascript
// 需要登录
router.get('/api/protected', app.middleware.auth(), controller.protected);

// 需要特定角色
router.get('/api/admin-only', 
  app.middleware.auth({ userType: 'admin' }), 
  controller.adminOnly
);

// 需要特定权限
router.post('/api/user-manage', 
  app.middleware.auth({ permission: 'user:manage' }), 
  controller.userManage
);
```

## 🎯 角色权限配置

### 管理员权限
- user:manage - 用户管理
- project:manage - 项目管理
- competition:manage - 赛程管理
- score:manage - 成绩管理
- report:view - 报表查看
- system:config - 系统配置

### 操作员权限
- project:view - 项目查看
- competition:view - 赛程查看
- score:input - 成绩录入
- player:view - 运动员查看

### 运动员权限
- profile:view - 个人信息查看
- profile:edit - 个人信息编辑
- registration:create - 报名参赛
- registration:view - 查看报名
- score:view - 成绩查看
- schedule:view - 赛程查看

### 裁判员权限
- profile:view - 个人信息查看
- profile:edit - 个人信息编辑
- score:input - 成绩录入
- competition:view - 赛程查看
- player:view - 参赛选手查看

## 🔍 故障排除

### 1. 登录失败
- 检查数据库连接
- 确认用户名密码正确
- 查看后端日志

### 2. Token过期
- 系统会自动处理Token过期
- 过期后自动跳转到登录页

### 3. 权限不足
- 检查用户角色配置
- 确认权限表数据正确

## 📝 开发说明

### 添加新角色
1. 在数据库中添加角色权限配置
2. 更新前端角色选择器
3. 添加对应的路由和页面

### 添加新权限
1. 在`role_permission`表中添加权限记录
2. 在需要的地方使用权限检查
3. 更新权限文档

---

**开发完成时间**: 2025-07-07  
**版本**: v1.0.0  
**作者**: AI Assistant
