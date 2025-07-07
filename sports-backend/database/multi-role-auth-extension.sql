-- =============================================
-- 多角色登录系统数据库扩展脚本
-- 嘉庚大二实践周作业 - 体育赛事管理系统
-- =============================================

-- 1. 扩展player表，添加登录相关字段
ALTER TABLE `player` 
ADD COLUMN `player_username` varchar(100) DEFAULT NULL COMMENT '运动员登录用户名',
ADD COLUMN `player_password` varchar(100) DEFAULT NULL COMMENT '运动员登录密码',
ADD COLUMN `player_status` tinyint(1) DEFAULT 1 COMMENT '账号状态：1-启用，0-禁用',
ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 为现有运动员添加默认登录信息（用学号作为用户名和初始密码）
UPDATE `player` SET 
  `player_username` = `player_studentid`,
  `player_password` = '123456',
  `player_status` = 1
WHERE `player_username` IS NULL;

-- 2. 创建裁判员表
DROP TABLE IF EXISTS `judge`;
CREATE TABLE `judge` (
  `judge_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '裁判员ID',
  `judge_name` varchar(100) NOT NULL COMMENT '裁判员姓名',
  `judge_username` varchar(100) NOT NULL COMMENT '登录用户名',
  `judge_password` varchar(100) NOT NULL COMMENT '登录密码',
  `judge_sex` varchar(10) NOT NULL COMMENT '性别',
  `judge_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `judge_email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `judge_specialty` varchar(200) DEFAULT NULL COMMENT '专业特长',
  `judge_status` tinyint(1) DEFAULT 1 COMMENT '账号状态：1-启用，0-禁用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`judge_id`),
  UNIQUE KEY `uk_judge_username` (`judge_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='裁判员表';

-- 插入默认裁判员数据
INSERT INTO `judge` (`judge_name`, `judge_username`, `judge_password`, `judge_sex`, `judge_phone`, `judge_specialty`) VALUES
('张裁判', 'judge001', '123456', '男', '13800138001', '田径项目'),
('李裁判', 'judge002', '123456', '女', '13800138002', '游泳项目'),
('王裁判', 'judge003', '123456', '男', '13800138003', '球类项目');

-- 3. 扩展admin表，添加时间戳字段
ALTER TABLE `admin` 
ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 4. 创建用户会话表（用于JWT Token管理）
DROP TABLE IF EXISTS `user_session`;
CREATE TABLE `user_session` (
  `session_id` varchar(100) NOT NULL COMMENT '会话ID',
  `user_id` int(100) NOT NULL COMMENT '用户ID',
  `user_type` varchar(20) NOT NULL COMMENT '用户类型：admin/player/judge',
  `token` text NOT NULL COMMENT 'JWT Token',
  `refresh_token` varchar(100) DEFAULT NULL COMMENT '刷新Token',
  `expires_at` timestamp NOT NULL COMMENT 'Token过期时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_active` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  PRIMARY KEY (`session_id`),
  KEY `idx_user` (`user_id`, `user_type`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户会话表';

-- 5. 创建角色权限表
DROP TABLE IF EXISTS `role_permission`;
CREATE TABLE `role_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_type` varchar(20) NOT NULL COMMENT '角色类型：admin/operator/player/judge',
  `permission` varchar(100) NOT NULL COMMENT '权限标识',
  `description` varchar(200) DEFAULT NULL COMMENT '权限描述',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_type`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='角色权限表';

-- 插入默认权限配置
INSERT INTO `role_permission` (`role_type`, `permission`, `description`) VALUES
-- 管理员权限（admin_type=2）
('admin', 'user:manage', '用户管理'),
('admin', 'project:manage', '项目管理'),
('admin', 'competition:manage', '赛程管理'),
('admin', 'score:manage', '成绩管理'),
('admin', 'report:view', '报表查看'),
('admin', 'system:config', '系统配置'),

-- 操作员权限（admin_type=1）
('operator', 'project:view', '项目查看'),
('operator', 'competition:view', '赛程查看'),
('operator', 'score:input', '成绩录入'),
('operator', 'player:view', '运动员查看'),

-- 运动员权限
('player', 'profile:view', '个人信息查看'),
('player', 'profile:edit', '个人信息编辑'),
('player', 'registration:create', '报名参赛'),
('player', 'registration:view', '查看报名'),
('player', 'score:view', '成绩查看'),
('player', 'schedule:view', '赛程查看'),

-- 裁判员权限
('judge', 'profile:view', '个人信息查看'),
('judge', 'profile:edit', '个人信息编辑'),
('judge', 'score:input', '成绩录入'),
('judge', 'competition:view', '赛程查看'),
('judge', 'player:view', '参赛选手查看');

-- 6. 添加索引优化
ALTER TABLE `player` ADD INDEX `idx_username` (`player_username`);
ALTER TABLE `judge` ADD INDEX `idx_username` (`judge_username`);
ALTER TABLE `admin` ADD INDEX `idx_username` (`admin_username`);

-- 7. 创建视图：统一用户信息视图
CREATE OR REPLACE VIEW `v_all_users` AS
SELECT 
  'admin' as user_type,
  admin_id as user_id,
  admin_username as username,
  admin_name as name,
  admin_sex as sex,
  admin_type as role_sub_type,
  created_at,
  updated_at
FROM admin
UNION ALL
SELECT 
  'player' as user_type,
  player_id as user_id,
  player_username as username,
  player_name as name,
  player_sex as sex,
  player_class as role_sub_type,
  created_at,
  updated_at
FROM player
WHERE player_username IS NOT NULL
UNION ALL
SELECT 
  'judge' as user_type,
  judge_id as user_id,
  judge_username as username,
  judge_name as name,
  judge_sex as sex,
  judge_specialty as role_sub_type,
  created_at,
  updated_at
FROM judge;

-- 执行完成提示
SELECT '多角色登录系统数据库扩展完成！' as message;
