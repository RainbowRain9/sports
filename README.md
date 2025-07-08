# 体育赛事管理系统 - 嘉庚大二实践周作业

一个功能完整的体育赛事管理系统，支持多角色登录和运动员自助服务。

## 🎯 系统特色

- **多角色权限管理**: 支持管理员、操作员、运动员、裁判员四种角色
- **运动员自助系统**: 完整的运动员专用功能模块
- **在线报名系统**: 智能报名限制和状态管理
- **成绩管理**: 完善的成绩录入和查询功能
- **响应式设计**: 支持桌面端和移动端访问

## 📚 相关链接
- [项目在线链接](http://39.105.108.226:7001)
- [项目仓库地址](https://github.com/RainbowRain9/sports)
- [体育赛事管理系统的设计与实现设计文档](https://cnphkngr8e.feishu.cn/file/boxcnb2B5V2LAJjrX6P77cPuItg)
- [接口文档链接](http://note.youdao.com/noteshare?id=f691c1b7400922f6abb96fefc81aad54)
- [项目数据库sql文件](./sports-backend/sports.sql)

## 📖 项目文档
- [运动员自助系统使用指南](./docs/player-system-guide.md)
- [系统部署指南](./docs/deployment-guide.md)
- [功能测试清单](./docs/testing-checklist.md)
- [项目开发总结](./docs/project-summary.md)

## 🚀 快速开始

### 1. 数据库部署
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE sports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入基础数据
mysql -u root -p sports < sports-backend/sports.sql

# 导入多角色认证扩展
mysql -u root -p sports < sports-backend/database/multi-role-auth-extension.sql

# 导入运动员自助系统扩展
mysql -u root -p sports < sports-backend/database/player-registration-extension.sql
```

### 2. 后端部署 (sports-backend)
```bash
# 安装依赖
npm install

# 配置数据库连接
# 编辑 config/config.local.js 文件，配置数据库连接信息

# 启动开发环境
npm run dev

# 启动生产环境
npm run start

# 停止服务
npm run stop
```

### 3. 前端部署 (sports-web)
```bash
# 安装依赖
npm install

# 配置后端接口地址
# 编辑 .env 文件，设置 VUE_APP_API_BASE_URL=http://127.0.0.1:7001

# 启动开发服务器
NODE_OPTIONS="--openssl-legacy-provider" npm start

# 构建生产版本
NODE_OPTIONS="--openssl-legacy-provider" npm run build
```

## 🔐 默认测试账号

### 管理员账号
- **超级管理员**: admin / 123
- **操作员**: operator / 123

### 运动员账号
- **赵一**: 001 / 123456
- **王二**: 002 / 123456
- **李三**: 003 / 123456

### 裁判员账号
- **裁判员**: judge001 / 123456

## 🎮 功能模块

### 🏠 运动员自助系统
运动员专用的自助服务平台，提供完整的个人管理功能：

#### 个人中心
- 个人信息概览和统计数据展示
- 报名状态和成绩统计
- 快捷操作入口
- 最近成绩展示

#### 在线报名
- 浏览可报名的体育项目
- 在线提交报名申请
- 智能报名限制验证
- 报名确认流程

#### 报名管理
- 查看个人报名记录
- 按状态筛选报名
- 取消报名功能
- 报名详情查看

#### 成绩查询
- 个人成绩列表展示
- 成绩筛选和搜索
- 排名信息显示
- 成绩统计分析

#### 个人信息
- 基本信息查看和编辑
- 登录密码修改
- 账号状态管理

### 🛡️ 管理员系统
完善的后台管理功能，支持多角色权限控制：

#### 项目管理
- 体育项目类型管理
- 比赛项目创建和编辑
- 项目状态控制

#### 运动员管理
- 运动员信息管理
- 账号状态控制
- 批量操作功能

#### 成绩管理
- 成绩录入和编辑
- 成绩审核和发布
- 排名统计

#### 系统管理
- 用户权限管理
- 系统配置
- 数据统计

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Vue.js 2.x
- **UI组件**: Element UI
- **状态管理**: Vuex
- **路由**: Vue Router
- **HTTP客户端**: Axios

### 后端技术栈
- **框架**: Egg.js
- **数据库**: MySQL
- **认证**: JWT Token
- **权限控制**: RBAC

### 数据库设计
- **用户系统**: 多角色用户管理
- **项目管理**: 体育项目和比赛管理
- **报名系统**: 完整的报名流程管理
- **成绩系统**: 成绩录入和统计

## 🔒 业务规则

### 报名限制
- 每人最多报名 3 个项目
- 每班每项目最多 5 人
- 项目总人数不超过限制
- 防止重复报名同一项目

### 权限控制
- 基于角色的访问控制 (RBAC)
- 路由级别权限验证
- API接口权限验证
- 数据权限隔离

## ✨ 项目特色

### 🎯 完整的业务流程
- 从项目创建到成绩发布的完整流程
- 智能的报名限制和验证机制
- 多角色协同工作流程

### 🛡️ 安全可靠
- JWT Token认证机制
- 完善的权限控制体系
- 数据验证和安全防护

### 📱 用户体验
- 响应式设计，支持多设备访问
- 直观友好的用户界面
- 流畅的操作体验

### 🔧 技术先进
- 现代化的前后端分离架构
- 模块化的代码组织
- 完善的错误处理机制

## 📊 项目统计

- **代码行数**: 5000+ 行
- **功能模块**: 15+ 个
- **数据库表**: 10+ 张
- **API接口**: 30+ 个
- **Vue组件**: 20+ 个

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

### 开发环境要求
- Node.js 14.x+
- MySQL 5.7+
- Git

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 📄 许可证

本项目仅供学习和演示使用。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- **GitHub**: [RainbowRain9](https://github.com/RainbowRain9)
- **项目仓库**: [sports](https://github.com/RainbowRain9/sports)

---

**注意**: 本项目为嘉庚大二实践周作业，展示了现代Web应用开发的完整流程和最佳实践。